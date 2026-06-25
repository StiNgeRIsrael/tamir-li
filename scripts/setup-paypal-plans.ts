/**
 * Create Tamir.li Premium subscription product + monthly/yearly ILS plans on PayPal.
 *
 * Usage (from repo root):
 *   npx tsx scripts/setup-paypal-plans.ts
 *   npx tsx scripts/setup-paypal-plans.ts --dry-run
 *   npx tsx scripts/setup-paypal-plans.ts --mode live
 *
 * Requires in backend/.env (or process env):
 *   PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET
 *   PAYPAL_MODE=sandbox|live  (default: sandbox)
 */
import crypto from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../backend/.env") });

const PRODUCT_NAME = "Tamir.li Premium";
const PRODUCT_DESCRIPTION =
  "Tamir.li Premium — unlimited conversions, no ads, premium tools";

const PLANS = {
  monthly: {
    name: "Tamir.li Premium — Monthly",
    description: "Monthly Tamir.li Premium subscription",
    envVar: "PAYPAL_PLAN_MONTHLY",
    price: "19.90",
    intervalUnit: "MONTH" as const,
    intervalCount: 1,
  },
  yearly: {
    name: "Tamir.li Premium — Yearly",
    description: "Yearly Tamir.li Premium subscription (20% off monthly)",
    envVar: "PAYPAL_PLAN_YEARLY",
    price: "191.04",
    intervalUnit: "YEAR" as const,
    intervalCount: 1,
  },
} as const;

const SANDBOX_BASE = "https://api-m.sandbox.paypal.com";
const LIVE_BASE = "https://api-m.paypal.com";

type PayPalList<T> = { products?: T[]; plans?: T[]; total_items?: number };
type PayPalProduct = { id: string; name: string };
type PayPalPlan = { id: string; name: string; status: string; product_id?: string };

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes("--dry-run"),
    mode:
      args.find((a) => a.startsWith("--mode="))?.split("=")[1] ??
      process.env.PAYPAL_MODE ??
      "sandbox",
  };
}

function getBaseUrl(mode: string): string {
  return mode === "live" ? LIVE_BASE : SANDBOX_BASE;
}

async function getAccessToken(baseUrl: string): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID?.trim();
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET. Add them to backend/.env (see backend/.env.example)."
    );
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw new Error(`PayPal auth failed (${res.status}): ${await res.text()}`);
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

async function paypalRequest<T>(
  baseUrl: string,
  token: string,
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(body ? { "PayPal-Request-Id": crypto.randomUUID() } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  const parsed = text ? (JSON.parse(text) as T) : ({} as T);
  if (!res.ok) {
    throw new Error(`PayPal ${method} ${path} failed (${res.status}): ${text}`);
  }
  return parsed;
}

async function listProducts(
  baseUrl: string,
  token: string
): Promise<PayPalProduct[]> {
  const data = await paypalRequest<PayPalList<PayPalProduct>>(
    baseUrl,
    token,
    "GET",
    "/v1/catalogs/products?page_size=20&total_required=true"
  );
  return data.products ?? [];
}

async function listPlans(
  baseUrl: string,
  token: string,
  productId: string
): Promise<PayPalPlan[]> {
  const data = await paypalRequest<PayPalList<PayPalPlan>>(
    baseUrl,
    token,
    "GET",
    `/v1/billing/plans?product_id=${encodeURIComponent(productId)}&page_size=20&total_required=true`
  );
  return data.plans ?? [];
}

async function createProduct(
  baseUrl: string,
  token: string,
  dryRun: boolean
): Promise<string> {
  const existing = (await listProducts(baseUrl, token)).find(
    (p) => p.name === PRODUCT_NAME
  );
  if (existing) {
    console.log(`Product already exists: ${existing.id} (${PRODUCT_NAME})`);
    return existing.id;
  }

  if (dryRun) {
    console.log(`[dry-run] Would create product: ${PRODUCT_NAME}`);
    return "PROD-DRY-RUN";
  }

  const created = await paypalRequest<PayPalProduct>(
    baseUrl,
    token,
    "POST",
    "/v1/catalogs/products",
    {
      name: PRODUCT_NAME,
      description: PRODUCT_DESCRIPTION,
      type: "SERVICE",
      category: "SOFTWARE",
    }
  );
  console.log(`Created product: ${created.id} (${PRODUCT_NAME})`);
  return created.id;
}

async function ensurePlan(
  baseUrl: string,
  token: string,
  productId: string,
  planKey: keyof typeof PLANS,
  dryRun: boolean
): Promise<string> {
  const spec = PLANS[planKey];
  const existing = (await listPlans(baseUrl, token, productId)).find(
    (p) => p.name === spec.name
  );

  if (existing) {
    console.log(`Plan already exists: ${existing.id} (${spec.name}) [${existing.status}]`);
    if (existing.status === "CREATED" || existing.status === "INACTIVE") {
      if (!dryRun) {
        await activatePlan(baseUrl, token, existing.id, spec.name);
      }
    }
    return existing.id;
  }

  if (dryRun) {
    console.log(
      `[dry-run] Would create plan: ${spec.name} — ₪${spec.price}/${spec.intervalUnit.toLowerCase()} ILS`
    );
    return `P-DRY-RUN-${planKey.toUpperCase()}`;
  }

  const created = await paypalRequest<PayPalPlan>(
    baseUrl,
    token,
    "POST",
    "/v1/billing/plans",
    {
      product_id: productId,
      name: spec.name,
      description: spec.description,
      billing_cycles: [
        {
          frequency: {
            interval_unit: spec.intervalUnit,
            interval_count: spec.intervalCount,
          },
          tenure_type: "REGULAR",
          sequence: 1,
          total_cycles: 0,
          pricing_scheme: {
            fixed_price: {
              value: spec.price,
              currency_code: "ILS",
            },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee_failure_action: "CONTINUE",
        payment_failure_threshold: 3,
      },
    }
  );

  console.log(`Created plan: ${created.id} (${spec.name}) [${created.status}]`);
  if (created.status === "CREATED" || created.status === "INACTIVE") {
    await activatePlan(baseUrl, token, created.id, spec.name);
  }
  return created.id;
}

async function activatePlan(
  baseUrl: string,
  token: string,
  planId: string,
  planName: string
): Promise<void> {
  await paypalRequest(baseUrl, token, "POST", `/v1/billing/plans/${planId}/activate`, {});
  console.log(`Activated plan: ${planId} (${planName})`);
}

async function main() {
  const { dryRun, mode } = parseArgs();
  const baseUrl = getBaseUrl(mode);

  console.log(`PayPal mode: ${mode} (${baseUrl})`);
  if (dryRun) console.log("Dry run — no changes will be made.\n");

  const token = await getAccessToken(baseUrl);
  const productId = await createProduct(baseUrl, token, dryRun);
  const monthlyId = await ensurePlan(baseUrl, token, productId, "monthly", dryRun);
  const yearlyId = await ensurePlan(baseUrl, token, productId, "yearly", dryRun);

  console.log("\n--- Paste into backend/.env and Plesk ---");
  console.log(`PAYPAL_MODE="${mode}"`);
  console.log(`${PLANS.monthly.envVar}="${monthlyId}"`);
  console.log(`${PLANS.yearly.envVar}="${yearlyId}"`);
  console.log("\nNext: register webhook at /api/billing/paypal/webhook (see docs/paypal-setup.md).");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
