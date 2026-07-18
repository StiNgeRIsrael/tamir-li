#!/usr/bin/env node
/**
 * Ensure / verify Google Play subscription catalog for com.tamir.li.
 *
 * Auth: GOOGLE_APPLICATION_CREDENTIALS (path) or GOOGLE_PLAY_SERVICE_ACCOUNT_JSON (inline).
 *
 * Usage:
 *   node scripts/play-console-catalog.mjs
 *   node scripts/play-console-catalog.mjs --ensure   # create+activate if missing
 *   npm run play:catalog
 *   npm run play:catalog:ensure
 */

import { createRequire } from "node:module";
import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const ensure = process.argv.includes("--ensure");
const PKG = process.env.GOOGLE_PLAY_PACKAGE_NAME?.trim() || "com.tamir.li";
const REGIONS = "2025/03";

const CATALOG = [
  {
    productId: "tamir_premium_monthly",
    basePlanId: "monthly",
    period: "P1M",
    ils: { units: "19", nanos: 900000000 },
    usd: { units: "5", nanos: 490000000 },
    eur: { units: "4", nanos: 990000000 },
    titleEn: "Tamir.li Premium Monthly",
    titleHe: "תמיר לי פרימיום חודשי",
  },
  {
    productId: "tamir_premium_yearly",
    basePlanId: "yearly",
    period: "P1Y",
    ils: { units: "191", nanos: 40000000 },
    usd: { units: "52", nanos: 990000000 },
    eur: { units: "49", nanos: 990000000 },
    titleEn: "Tamir.li Premium Yearly",
    titleHe: "תמיר לי פרימיום שנתי",
  },
];

function loadCredentials() {
  const inline = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON?.trim();
  if (inline) return JSON.parse(inline);

  const path =
    process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim() ||
    join(homedir(), ".config/tamir-li/play-console-sa.json");
  if (!existsSync(path)) {
    throw new Error(
      `No Play credentials. Set GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_PLAY_SERVICE_ACCOUNT_JSON (tried ${path}).`
    );
  }
  return JSON.parse(readFileSync(path, "utf8"));
}

async function getAccessToken(creds) {
  const { GoogleAuth } = require(
    join(process.cwd(), "backend/node_modules/google-auth-library")
  );
  const auth = new GoogleAuth({
    credentials: creds,
    scopes: ["https://www.googleapis.com/auth/androidpublisher"],
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  if (!token.token) throw new Error("Failed to obtain Google access token");
  return token.token;
}

async function api(token, method, path, body) {
  const url = new URL(`https://androidpublisher.googleapis.com/androidpublisher/v3${path}`);
  if (method === "POST" || method === "PATCH") {
    url.searchParams.set("regionsVersion.version", REGIONS);
  }
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(`Play API ${res.status}: ${text.slice(0, 400)}`);
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json;
}

function money(units, nanos, currencyCode) {
  return { currencyCode, units: String(units), nanos };
}

function subBody(item) {
  const descEn = "Unlimited conversions, no ads, larger files, and AI credits.";
  const descHe = "המרות ללא הגבלה, בלי פרסומות, קבצים גדולים יותר ויצירות AI.";
  return {
    packageName: PKG,
    productId: item.productId,
    listings: [
      { languageCode: "en-US", title: item.titleEn, description: descEn },
      { languageCode: "he-IL", title: item.titleHe, description: descHe },
    ],
    basePlans: [
      {
        basePlanId: item.basePlanId,
        autoRenewingBasePlanType: {
          billingPeriodDuration: item.period,
          gracePeriodDuration: "P3D",
          resubscribeState: "RESUBSCRIBE_STATE_ACTIVE",
        },
        regionalConfigs: [
          {
            regionCode: "IL",
            newSubscriberAvailability: true,
            price: money(item.ils.units, item.ils.nanos, "ILS"),
          },
        ],
        otherRegionsConfig: {
          usdPrice: money(item.usd.units, item.usd.nanos, "USD"),
          eurPrice: money(item.eur.units, item.eur.nanos, "EUR"),
          newSubscriberAvailability: true,
        },
      },
    ],
  };
}

async function listSubscriptions(token) {
  const data = await api(token, "GET", `/applications/${PKG}/subscriptions`);
  return data.subscriptions || [];
}

async function ensureSubscription(token, item) {
  try {
    await api(
      token,
      "POST",
      `/applications/${PKG}/subscriptions?productId=${encodeURIComponent(item.productId)}`,
      subBody(item)
    );
    console.log(`created ${item.productId}`);
  } catch (e) {
    if (e.status === 409 || /already exists/i.test(String(e.message))) {
      console.log(`exists ${item.productId}`);
    } else {
      throw e;
    }
  }
  try {
    await api(
      token,
      "POST",
      `/applications/${PKG}/subscriptions/${encodeURIComponent(item.productId)}/basePlans/${encodeURIComponent(item.basePlanId)}:activate`,
      {}
    );
    console.log(`activated ${item.productId}/${item.basePlanId}`);
  } catch (e) {
    console.log(`activate ${item.productId}: ${String(e.message).slice(0, 200)}`);
  }
}

async function main() {
  const creds = loadCredentials();
  console.log(`SA: ${creds.client_email}`);
  console.log(`package: ${PKG}`);
  const token = await getAccessToken(creds);

  if (ensure) {
    for (const item of CATALOG) {
      await ensureSubscription(token, item);
    }
  }

  const subs = await listSubscriptions(token);
  const byId = new Map(subs.map((s) => [s.productId, s]));
  let ok = true;
  for (const item of CATALOG) {
    const sub = byId.get(item.productId);
    const bp = (sub?.basePlans || []).find((b) => b.basePlanId === item.basePlanId);
    const state = bp?.state || "MISSING";
    const il = (bp?.regionalConfigs || []).find((r) => r.regionCode === "IL");
    const price = il?.price
      ? `${il.price.currencyCode} ${il.price.units}.${String(Math.floor((il.price.nanos || 0) / 1e7)).padStart(2, "0")}`
      : "?";
    const line = `${item.productId}/${item.basePlanId}: ${state} (${price})`;
    if (state !== "ACTIVE") {
      ok = false;
      console.log(`FAIL ${line}`);
    } else {
      console.log(`OK   ${line}`);
    }
  }

  if (!ok) {
    console.error("\nCatalog incomplete. Re-run with --ensure or check Play Console permissions.");
    process.exit(1);
  }
  console.log("\nPlay catalog OK.");
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
