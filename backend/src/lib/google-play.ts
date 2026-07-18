import fs from 'fs';
import { createHash, timingSafeEqual } from 'crypto';
import { JWT } from 'google-auth-library';

const ANDROID_PUBLISHER_SCOPE = 'https://www.googleapis.com/auth/androidpublisher';

export type GooglePlaySubscriptionPurchase = {
  startTimeMillis?: string;
  expiryTimeMillis?: string;
  autoRenewing?: boolean;
  paymentState?: number;
  cancelReason?: number;
  orderId?: string;
  acknowledgementState?: number;
};

export type GooglePlayProductPurchase = {
  purchaseState?: number;
  consumptionState?: number;
  orderId?: string;
  acknowledgementState?: number;
};

export type GooglePlayRtdnMessage = {
  version?: string;
  packageName?: string;
  eventTimeMillis?: string;
  subscriptionNotification?: {
    version?: string;
    notificationType?: number;
    purchaseToken?: string;
    subscriptionId?: string;
  };
  oneTimeProductNotification?: {
    version?: string;
    notificationType?: number;
    purchaseToken?: string;
    sku?: string;
  };
};

function getPackageName(): string {
  return process.env.GOOGLE_PLAY_PACKAGE_NAME?.trim() || 'com.tamir.li';
}

function parseServiceAccountObject(
  raw: string
): { client_email?: string; private_key?: string } | null {
  try {
    return JSON.parse(raw) as { client_email?: string; private_key?: string };
  } catch {
    return null;
  }
}

function loadServiceAccountJson(): { client_email?: string; private_key?: string } | null {
  // 1) Inline JSON (Play-specific or standard GCP name used as secret value)
  for (const key of ['GOOGLE_PLAY_SERVICE_ACCOUNT_JSON', 'GOOGLE_APPLICATION_CREDENTIALS'] as const) {
    const raw = process.env[key]?.trim();
    if (!raw) continue;
    if (raw.startsWith('{')) {
      const parsed = parseServiceAccountObject(raw);
      if (parsed?.client_email && parsed.private_key) return parsed;
    }
  }

  // 2) File path — GOOGLE_APPLICATION_CREDENTIALS (GCP convention), deploy sync file, or explicit file env
  const fileCandidates = [
    process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_FILE?.trim(),
    process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim(),
    // Deploy sync writes here (see .github/workflows/deploy-plesk.yml)
    `${process.cwd()}/backend/.google-play-sa.json`,
  ].filter((p): p is string => !!p && !p.startsWith('{'));

  for (const filePath of fileCandidates) {
    try {
      if (!fs.existsSync(filePath)) continue;
      const parsed = parseServiceAccountObject(fs.readFileSync(filePath, 'utf8'));
      if (parsed?.client_email && parsed.private_key) return parsed;
    } catch {
      /* try next */
    }
  }

  return null;
}

function getServiceAccountClient(): JWT | null {
  const creds = loadServiceAccountJson();
  if (!creds?.client_email || !creds.private_key) return null;

  return new JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: [ANDROID_PUBLISHER_SCOPE],
  });
}

export function isGooglePlayConfigured(): boolean {
  return getServiceAccountClient() !== null;
}

function getRtdnSecret(): string | null {
  return process.env.GOOGLE_PLAY_RTDN_SECRET?.trim() || null;
}

/** Whether a shared secret is configured to authenticate the RTDN (Pub/Sub push) webhook. */
export function isRtdnAuthConfigured(): boolean {
  return getRtdnSecret() !== null;
}

/**
 * Authorize an incoming Real-time Developer Notification (Pub/Sub push) request.
 *
 * Google Pub/Sub push subscriptions can carry a shared secret via a query param
 * (`?token=…`) or a custom header on the push endpoint URL. The `/api/billing/google/rtdn`
 * route is public (no user JWT), so without this check anyone could POST a crafted body.
 *
 * When `GOOGLE_PLAY_RTDN_SECRET` is unset the check is skipped for backward compatibility,
 * but a secret is strongly recommended in production. Comparison is constant-time.
 */
export function verifyRtdnToken(provided: string | null | undefined): boolean {
  const expected = getRtdnSecret();
  if (!expected) return true;
  if (!provided) return false;
  const providedHash = createHash('sha256').update(provided).digest();
  const expectedHash = createHash('sha256').update(expected).digest();
  return timingSafeEqual(providedHash, expectedHash);
}

/** Safe /health probe — never exposes the service account JSON. */
export function getGooglePlayBillingReadiness(): {
  configured: boolean;
  packageName: string;
  products: { monthly: boolean; yearly: boolean };
  serviceAccountEmailPrefix: string | null;
  rtdnAuthConfigured: boolean;
} {
  const creds = loadServiceAccountJson();
  const email = creds?.client_email;
  return {
    configured: isGooglePlayConfigured(),
    packageName: getPackageName(),
    products: {
      monthly: !!(process.env.GOOGLE_PLAY_PRODUCT_MONTHLY?.trim() || 'tamir_premium_monthly'),
      yearly: !!(process.env.GOOGLE_PLAY_PRODUCT_YEARLY?.trim() || 'tamir_premium_yearly'),
    },
    serviceAccountEmailPrefix: email ? email.split('@')[0] || null : null,
    rtdnAuthConfigured: isRtdnAuthConfigured(),
  };
}

async function publisherFetch<T>(path: string): Promise<T> {
  const client = getServiceAccountClient();
  if (!client) throw new Error('GOOGLE_PLAY_NOT_CONFIGURED');

  const token = await client.getAccessToken();
  if (!token.token) throw new Error('GOOGLE_PLAY_AUTH_FAILED');

  const res = await fetch(`https://androidpublisher.googleapis.com/androidpublisher/v3${path}`, {
    headers: { Authorization: `Bearer ${token.token}` },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google Play API ${res.status}: ${body.slice(0, 200)}`);
  }

  return res.json() as Promise<T>;
}

export async function verifyGooglePlaySubscription(
  subscriptionId: string,
  purchaseToken: string
): Promise<GooglePlaySubscriptionPurchase> {
  const pkg = getPackageName();
  return publisherFetch<GooglePlaySubscriptionPurchase>(
    `/applications/${pkg}/purchases/subscriptions/${subscriptionId}/tokens/${encodeURIComponent(purchaseToken)}`
  );
}

export async function verifyGooglePlayProduct(
  productId: string,
  purchaseToken: string
): Promise<GooglePlayProductPurchase> {
  const pkg = getPackageName();
  return publisherFetch<GooglePlayProductPurchase>(
    `/applications/${pkg}/purchases/products/${productId}/tokens/${encodeURIComponent(purchaseToken)}`
  );
}

export async function acknowledgeGooglePlaySubscription(
  subscriptionId: string,
  purchaseToken: string
): Promise<void> {
  const client = getServiceAccountClient();
  if (!client) throw new Error('GOOGLE_PLAY_NOT_CONFIGURED');

  const pkg = getPackageName();
  const token = await client.getAccessToken();
  if (!token.token) throw new Error('GOOGLE_PLAY_AUTH_FAILED');

  const res = await fetch(
    `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${pkg}/purchases/subscriptions/${subscriptionId}/tokens/${encodeURIComponent(purchaseToken)}:acknowledge`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    }
  );

  if (!res.ok && res.status !== 409) {
    const body = await res.text();
    throw new Error(`Google Play acknowledge ${res.status}: ${body.slice(0, 200)}`);
  }
}

export function parseGooglePlayRtdnBody(body: unknown): GooglePlayRtdnMessage | null {
  if (!body || typeof body !== 'object') return null;

  const pubsub = body as { message?: { data?: string } };
  const data = pubsub.message?.data;
  if (!data) return null;

  try {
    const decoded = Buffer.from(data, 'base64').toString('utf8');
    return JSON.parse(decoded) as GooglePlayRtdnMessage;
  } catch {
    return null;
  }
}

export function subscriptionIdToPlan(subscriptionId: string): 'MONTHLY' | 'YEARLY' {
  const yearly = process.env.GOOGLE_PLAY_PRODUCT_YEARLY?.trim() || 'tamir_premium_yearly';
  return subscriptionId === yearly ? 'YEARLY' : 'MONTHLY';
}

export const GOOGLE_PLAY_CREDIT_PRODUCTS: Record<string, number> = {
  credits_10: 10,
  credits_30: 30,
  credits_60: 60,
  credits_120: 120,
};

export const GOOGLE_PLAY_SUBSCRIPTION_PRODUCTS = new Set([
  process.env.GOOGLE_PLAY_PRODUCT_MONTHLY?.trim() || 'tamir_premium_monthly',
  process.env.GOOGLE_PLAY_PRODUCT_YEARLY?.trim() || 'tamir_premium_yearly',
]);
