import crypto from 'crypto';
import { getFrontendOrigin } from './billing-shared';

const SANDBOX_BASE = 'https://api-m.sandbox.paypal.com';
const LIVE_BASE = 'https://api-m.paypal.com';

type PayPalTokenCache = { token: string; expiresAt: number };
let tokenCache: PayPalTokenCache | null = null;

/** Strip whitespace and optional wrapping quotes (common Plesk paste mistake). */
function readPayPalEnv(name: 'PAYPAL_CLIENT_ID' | 'PAYPAL_CLIENT_SECRET'): string {
  let raw = process.env[name]?.trim() ?? '';
  if (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    raw = raw.slice(1, -1).trim();
  }
  return raw;
}

export function getPayPalMode(): 'live' | 'sandbox' {
  return process.env.PAYPAL_MODE === 'live' ? 'live' : 'sandbox';
}

export function isPayPalConfigured(): boolean {
  return !!(readPayPalEnv('PAYPAL_CLIENT_ID') && readPayPalEnv('PAYPAL_CLIENT_SECRET'));
}

export function getPayPalBaseUrl(): string {
  return getPayPalMode() === 'live' ? LIVE_BASE : SANDBOX_BASE;
}

export function getPayPalManageUrl(): string {
  return getPayPalMode() === 'live'
    ? 'https://www.paypal.com/myaccount/autopay/'
    : 'https://www.sandbox.paypal.com/myaccount/autopay/';
}

function authFailureHint(status: number, body: string, mode: 'live' | 'sandbox'): string {
  const lower = body.toLowerCase();
  if (status === 401 || lower.includes('invalid_client')) {
    return mode === 'live'
      ? 'Use Client ID + Secret from the same PayPal Live REST app (developer.paypal.com → Live → Apps). Sandbox credentials fail when PAYPAL_MODE=live. Re-copy the Secret (Show) and restart Node — no quotes around values in Plesk.'
      : 'Use Client ID + Secret from the same PayPal Sandbox REST app. Set PAYPAL_MODE=sandbox or switch to Live credentials with PAYPAL_MODE=live.';
  }
  if (status === 403) {
    return 'PayPal rejected this app. Confirm the REST app is enabled for subscriptions in the PayPal dashboard.';
  }
  return 'Verify PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET on the server, then restart the Node app.';
}

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt > now + 60_000) {
    return tokenCache.token;
  }

  const clientId = readPayPalEnv('PAYPAL_CLIENT_ID');
  const clientSecret = readPayPalEnv('PAYPAL_CLIENT_SECRET');
  if (!clientId || !clientSecret) {
    throw new Error('PayPal auth failed: PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET is empty');
  }
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const res = await fetch(`${getPayPalBaseUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal auth failed: ${res.status} ${text}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  tokenCache = {
    token: data.access_token,
    expiresAt: now + data.expires_in * 1000,
  };
  return data.access_token;
}

async function paypalRequest<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(`${getPayPalBaseUrl()}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(body ? { 'PayPal-Request-Id': crypto.randomUUID() } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  const parsed = text ? (JSON.parse(text) as T) : ({} as T);

  if (!res.ok) {
    throw new Error(`PayPal ${method} ${path} failed: ${res.status} ${text}`);
  }

  return parsed;
}

export type PayPalSubscription = {
  id: string;
  status: string;
  plan_id?: string;
  custom_id?: string;
  billing_info?: {
    next_billing_time?: string;
    last_payment?: { amount?: { value?: string; currency_code?: string } };
  };
  start_time?: string;
};

export type PayPalOrder = {
  id: string;
  status: string;
  purchase_units?: Array<{
    custom_id?: string;
    amount?: { value?: string; currency_code?: string };
    payments?: { captures?: Array<{ id: string; amount?: { value?: string; currency_code?: string } }> };
  }>;
  links?: Array<{ rel: string; href: string }>;
};

export async function createPayPalSubscription(
  planId: string,
  userId: string,
  returnUrl: string,
  cancelUrl: string
): Promise<{ id: string; approvalUrl: string }> {
  const data = await paypalRequest<PayPalSubscription & { links?: Array<{ rel: string; href: string }> }>(
    'POST',
    '/v1/billing/subscriptions',
    {
      plan_id: planId,
      custom_id: userId,
      application_context: {
        brand_name: 'Tamir.li',
        locale: 'he-IL',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'SUBSCRIBE_NOW',
        return_url: returnUrl,
        cancel_url: cancelUrl,
      },
    }
  );

  const approvalUrl = data.links?.find((l) => l.rel === 'approve')?.href;
  if (!approvalUrl) throw new Error('PayPal subscription missing approval URL');
  return { id: data.id, approvalUrl };
}

export async function createPayPalOrder(
  amountIls: string,
  description: string,
  userId: string,
  planKey: string,
  returnUrl: string,
  cancelUrl: string
): Promise<{ id: string; approvalUrl: string }> {
  const data = await paypalRequest<PayPalOrder>('POST', '/v2/checkout/orders', {
    intent: 'CAPTURE',
    purchase_units: [
      {
        amount: { currency_code: 'ILS', value: amountIls },
        description,
        custom_id: `${userId}|${planKey}`,
      },
    ],
    application_context: {
      brand_name: 'Tamir.li',
      locale: 'he-IL',
      shipping_preference: 'NO_SHIPPING',
      user_action: 'PAY_NOW',
      return_url: returnUrl,
      cancel_url: cancelUrl,
    },
  });

  const approvalUrl = data.links?.find((l) => l.rel === 'approve')?.href;
  if (!approvalUrl) throw new Error('PayPal order missing approval URL');
  return { id: data.id, approvalUrl };
}

export async function capturePayPalOrder(orderId: string): Promise<PayPalOrder> {
  return paypalRequest<PayPalOrder>('POST', `/v2/checkout/orders/${orderId}/capture`, {});
}

export async function getPayPalSubscription(subscriptionId: string): Promise<PayPalSubscription> {
  return paypalRequest<PayPalSubscription>('GET', `/v1/billing/subscriptions/${subscriptionId}`);
}

export async function verifyPayPalWebhook(
  headers: Record<string, string | string[] | undefined>,
  body: string
): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID?.trim();
  if (!webhookId) return false;

  const transmissionId = String(headers['paypal-transmission-id'] ?? '');
  const transmissionTime = String(headers['paypal-transmission-time'] ?? '');
  const certUrl = String(headers['paypal-cert-url'] ?? '');
  const authAlgo = String(headers['paypal-auth-algo'] ?? '');
  const transmissionSig = String(headers['paypal-transmission-sig'] ?? '');

  if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
    return false;
  }

  try {
    const result = await paypalRequest<{ verification_status: string }>(
      'POST',
      '/v1/notifications/verify-webhook-signature',
      {
        auth_algo: authAlgo,
        cert_url: certUrl,
        transmission_id: transmissionId,
        transmission_sig: transmissionSig,
        transmission_time: transmissionTime,
        webhook_id: webhookId,
        webhook_event: JSON.parse(body),
      }
    );
    return result.verification_status === 'SUCCESS';
  } catch (e) {
    console.error('[paypal] webhook verification failed', e);
    return false;
  }
}

export function ilsToAgorot(value: string | undefined): number {
  if (!value) return 0;
  const n = parseFloat(value);
  if (Number.isNaN(n)) return 0;
  return Math.round(n * 100);
}

/** Map PayPal / config errors to a safe client message and HTTP status. */
export function formatBillingCheckoutError(e: unknown): { message: string; status: number } {
  const fallback = {
    message: 'Could not start checkout',
    status: 500,
  };

  if (!(e instanceof Error)) return fallback;

  const msg = e.message;

  if (msg.includes('PayPal auth failed')) {
    const statusMatch = msg.match(/PayPal auth failed: (\d+)/);
    const status = statusMatch ? Number(statusMatch[1]) : 401;
    const body = msg.includes('{') ? msg.slice(msg.indexOf('{')) : '';
    return {
      message: authFailureHint(status, body, getPayPalMode()),
      status: 503,
    };
  }

  if (msg.includes('PayPal POST') || msg.includes('PayPal GET')) {
    const jsonStart = msg.indexOf('{');
    if (jsonStart >= 0) {
      try {
        const parsed = JSON.parse(msg.slice(jsonStart)) as {
          message?: string;
          name?: string;
          details?: Array<{ issue?: string; description?: string }>;
        };
        const detail = parsed.details?.[0]?.description ?? parsed.details?.[0]?.issue;
        const paypalMessage = detail || parsed.message || parsed.name;
        if (paypalMessage) {
          const lower = paypalMessage.toLowerCase();
          const status =
            lower.includes('plan') ||
            lower.includes('return_url') ||
            lower.includes('return url') ||
            lower.includes('not found') ||
            lower.includes('invalid')
              ? 503
              : 500;
          return { message: paypalMessage, status };
        }
      } catch {
        /* ignore parse errors */
      }
    }
  }

  if (msg.includes('missing approval URL')) {
    return {
      message: 'PayPal did not return a checkout URL. Verify subscription plans are active in PayPal.',
      status: 503,
    };
  }

  return { message: msg || fallback.message, status: fallback.status };
}

export function getPayPalBillingReadiness(): {
  configured: boolean;
  mode: 'sandbox' | 'live' | null;
  plans: { monthly: boolean; yearly: boolean };
  frontendOrigin: string;
  clientIdPrefix: string | null;
  secretLength: number;
} {
  const clientId = readPayPalEnv('PAYPAL_CLIENT_ID');
  const secret = readPayPalEnv('PAYPAL_CLIENT_SECRET');
  return {
    configured: !!(clientId && secret),
    mode: clientId ? getPayPalMode() : null,
    plans: {
      monthly: !!process.env.PAYPAL_PLAN_MONTHLY?.trim(),
      yearly: !!process.env.PAYPAL_PLAN_YEARLY?.trim(),
    },
    frontendOrigin: getFrontendOrigin(),
    clientIdPrefix: clientId ? clientId.slice(0, 8) : null,
    secretLength: secret.length,
  };
}

export async function probePayPalAuth(): Promise<{
  ok: boolean;
  hint?: string;
}> {
  if (!isPayPalConfigured()) {
    return { ok: false, hint: 'PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET is missing or empty.' };
  }
  try {
    tokenCache = null;
    await getAccessToken();
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const statusMatch = msg.match(/PayPal auth failed: (\d+)/);
    const status = statusMatch ? Number(statusMatch[1]) : 401;
    const body = msg.includes('{') ? msg.slice(msg.indexOf('{')) : msg;
    return { ok: false, hint: authFailureHint(status, body, getPayPalMode()) };
  }
}
