import { getStoredConsent } from "@/lib/ads/consent";

const CLICK_IDS_KEY = "tamir_ads_click_ids";

export type AdsClickIds = {
  gclid?: string;
  wbraid?: string;
  gbraid?: string;
};

/** Persist Google Ads click IDs from landing URL for conversion attribution. */
export function captureAdsClickIds(): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const gclid = params.get("gclid") ?? undefined;
  const wbraid = params.get("wbraid") ?? undefined;
  const gbraid = params.get("gbraid") ?? undefined;
  if (!gclid && !wbraid && !gbraid) return;

  try {
    sessionStorage.setItem(
      CLICK_IDS_KEY,
      JSON.stringify({ gclid, wbraid, gbraid, captured_at: Date.now() })
    );
  } catch {
    /* private mode */
  }
}

export function getStoredAdsClickIds(): AdsClickIds {
  try {
    const raw = sessionStorage.getItem(CLICK_IDS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as AdsClickIds;
    return {
      gclid: parsed.gclid,
      wbraid: parsed.wbraid,
      gbraid: parsed.gbraid,
    };
  } catch {
    return {};
  }
}

/** Google Ads conversion labels — comma-separated `AW-xxx/label` values from Ads UI. */
export function getGoogleAdsConversionLabels(): string[] {
  const raw = import.meta.env.VITE_GOOGLE_ADS_CONVERSION_ID?.trim();
  if (!raw) return [];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export function getGoogleAdsAccountId(): string | undefined {
  const raw = import.meta.env.VITE_GOOGLE_ADS_ID?.trim();
  return raw || undefined;
}

/** Fire Google Ads conversion tag(s) after a sale (requires ads cookie consent). */
export function reportGoogleAdsConversion(params: {
  value?: number;
  currency: string;
  transaction_id?: string;
}): void {
  if (getStoredConsent()?.ads !== true) return;
  if (typeof window.gtag !== "function") return;

  const labels = getGoogleAdsConversionLabels();
  if (!labels.length) return;

  for (const send_to of labels) {
    window.gtag("event", "conversion", {
      send_to,
      value: params.value,
      currency: params.currency,
      transaction_id: params.transaction_id,
    });
  }
}

/** Load Google Ads gtag config alongside GA4 (optional VITE_GOOGLE_ADS_ID=AW-…). */
export function initGoogleAdsTag(): void {
  const adsId = getGoogleAdsAccountId();
  if (!adsId || typeof window.gtag !== "function") return;
  window.gtag("config", adsId);
}
