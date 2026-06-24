declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
    gtag?: (...args: unknown[]) => void;
  }
}

export type ConsentFlags = {
  analytics: boolean;
  ads: boolean;
};

function ensureDataLayer(): void {
  window.dataLayer = window.dataLayer || [];
}

/** Ensure gtag stub exists (index.html sets it for Consent Mode defaults). */
export function ensureGtag(): void {
  ensureDataLayer();
  if (typeof window.gtag !== "function") {
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer.push(args as unknown as Record<string, unknown>);
    };
  }
}

export function pushDataLayer(payload: Record<string, unknown>): void {
  ensureDataLayer();
  window.dataLayer.push(payload);
}

/** Consent Mode v2 update — call after user choice or when restoring stored consent. */
export function updateConsentMode(consent: ConsentFlags): void {
  ensureGtag();
  const gtag = window.gtag;
  if (typeof gtag !== "function") return;

  gtag("consent", "update", {
    analytics_storage: consent.analytics ? "granted" : "denied",
    ad_storage: consent.ads ? "granted" : "denied",
    ad_user_data: consent.ads ? "granted" : "denied",
    ad_personalization: consent.ads ? "granted" : "denied",
    functionality_storage: consent.analytics ? "granted" : "denied",
    personalization_storage: consent.ads ? "granted" : "denied",
  });
}

let gtmInjected = false;

/** Inject GTM container script when VITE_GTM_ID is configured. */
export function initGTM(): void {
  const gtmId = getGtmContainerId();
  if (!gtmId || gtmInjected || document.getElementById("gtm-script")) return;

  ensureGtag();
  pushDataLayer({ "gtm.start": Date.now(), event: "gtm.js" });

  const script = document.createElement("script");
  script.id = "gtm-script";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`;
  document.head.appendChild(script);

  if (!document.getElementById("gtm-noscript")) {
    const noscript = document.createElement("noscript");
    noscript.id = "gtm-noscript";
    const iframe = document.createElement("iframe");
    iframe.src = `https://www.googletagmanager.com/ns.html?id=${gtmId}`;
    iframe.height = "0";
    iframe.width = "0";
    iframe.style.display = "none";
    iframe.style.visibility = "hidden";
    noscript.appendChild(iframe);
    document.body.prepend(noscript);
  }

  gtmInjected = true;
}

let ga4Injected = false;

/** True when direct GA4 gtag.js has been injected (not GTM path). */
export function isGa4Booted(): boolean {
  return ga4Injected;
}

/** True when GTM container script has been injected. */
export function isGtmBooted(): boolean {
  return gtmInjected;
}

/** GA4 measurement ID from build-time env (direct gtag.js mode). */
export function getGa4MeasurementId(): string | undefined {
  return import.meta.env.VITE_GA4_ID?.trim() || undefined;
}

function getGtmContainerId(): string | undefined {
  return import.meta.env.VITE_GTM_ID?.trim() || undefined;
}

/** Whether analytics tags are loaded and events can be sent. */
export function isAnalyticsActive(): boolean {
  if (typeof window.gtag !== "function") return false;
  const ga4Id = getGa4MeasurementId();
  const gtmId = getGtmContainerId();
  if (ga4Id && gtmId) return false;
  if (ga4Id) return ga4Injected;
  if (gtmId) return gtmInjected;
  return false;
}

/**
 * @deprecated GA4 loads after analytics consent via `initGA4()` in consent.ts — not on boot.
 */
export function bootAnalytics(): void {
  /* no-op — gtag loads only after cookie consent (see src/lib/ads/consent.ts) */
}

/**
 * Direct GA4 via gtag.js when VITE_GA4_ID is set.
 * Skip when VITE_GTM_ID is also set — configure GA4 inside GTM instead to avoid double counting.
 */
export function initGA4(): void {
  const ga4Id = getGa4MeasurementId();
  const gtmId = getGtmContainerId();
  if (!ga4Id || gtmId || ga4Injected || document.getElementById("ga4-script")) return;

  ensureGtag();

  const script = document.createElement("script");
  script.id = "ga4-script";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${ga4Id}`;
  document.head.appendChild(script);

  window.gtag!("js", new Date());
  window.gtag!("set", "allow_google_signals", true);
  window.gtag!("set", "allow_ad_personalization_signals", true);
  window.gtag!("config", ga4Id, {
    send_page_view: false,
    allow_google_signals: true,
    allow_ad_personalization_signals: true,
    cookie_flags: "SameSite=None;Secure",
    // Enhanced measurement toggles: GA4 Admin → Data stream → Enhanced measurement.
  });

  ga4Injected = true;
}
