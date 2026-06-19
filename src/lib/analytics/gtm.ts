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
  const gtmId = import.meta.env.VITE_GTM_ID?.trim();
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

/**
 * Direct GA4 via gtag.js when VITE_GA4_ID is set.
 * Skip when VITE_GTM_ID is also set — configure GA4 inside GTM instead to avoid double counting.
 */
export function initGA4(): void {
  const ga4Id = import.meta.env.VITE_GA4_ID?.trim();
  const gtmId = import.meta.env.VITE_GTM_ID?.trim();
  if (!ga4Id || gtmId || ga4Injected || document.getElementById("ga4-script")) return;

  ensureGtag();

  const script = document.createElement("script");
  script.id = "ga4-script";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${ga4Id}`;
  document.head.appendChild(script);

  window.gtag!("js", new Date());
  window.gtag!("config", ga4Id, { send_page_view: false });

  ga4Injected = true;
}
