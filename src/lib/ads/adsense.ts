import { getStoredConsent } from "@/lib/ads/consent";

declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[];
  }
}

let adsenseLoaded = false;
let premiumUser = false;

export function setPremiumUser(isPremium: boolean): void {
  premiumUser = isPremium;
}

export function isPremiumUser(): boolean {
  return premiumUser;
}

export function isAdSenseConfigured(): boolean {
  return !!import.meta.env.VITE_ADSENSE_CLIENT?.trim();
}

export function hasAdsConsent(): boolean {
  return getStoredConsent()?.ads === true;
}

/** Lazy-load AdSense script after ad consent is granted; skip for premium users. */
export function loadAdSenseScript(): void {
  const client = import.meta.env.VITE_ADSENSE_CLIENT?.trim();
  if (!client || premiumUser || adsenseLoaded || document.getElementById("adsense-script")) return;

  const script = document.createElement("script");
  script.id = "adsense-script";
  script.async = true;
  script.crossOrigin = "anonymous";
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
  document.head.appendChild(script);
  adsenseLoaded = true;
}

export function hasAdSenseSlot(type: "banner" | "sidebar" | "inline"): boolean {
  return !!getAdSenseSlotId(type);
}

export function getAdSenseSlotId(type: "banner" | "sidebar" | "inline"): string | undefined {
  const map = {
    banner: import.meta.env.VITE_ADSENSE_SLOT_BANNER,
    sidebar: import.meta.env.VITE_ADSENSE_SLOT_SIDEBAR,
    inline: import.meta.env.VITE_ADSENSE_SLOT_INLINE,
  };
  return map[type]?.trim() || undefined;
}

/** Push a single AdSense unit after its `<ins>` is in the DOM. */
export function pushAdSlot(_element?: HTMLElement): void {
  if (premiumUser || !isAdSenseConfigured() || !hasAdsConsent()) return;
  loadAdSenseScript();
  try {
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  } catch {
    // Ad blockers or script not ready
  }
}

/** Show vignette/interstitial or anchor ad on conversion success when configured. */
export function triggerInterstitialAd(): void {
  if (premiumUser || !hasAdsConsent()) return;

  const client = import.meta.env.VITE_ADSENSE_CLIENT?.trim();
  const interstitialSlot = import.meta.env.VITE_ADSENSE_SLOT_INTERSTITIAL?.trim();
  const anchorSlot = import.meta.env.VITE_ADSENSE_SLOT_ANCHOR?.trim();
  const slot = interstitialSlot || anchorSlot;
  if (!client || !slot) return;

  loadAdSenseScript();

  const ins = document.createElement("ins");
  ins.className = "adsbygoogle";
  ins.style.display = "block";
  ins.setAttribute("data-ad-client", client);
  ins.setAttribute("data-ad-slot", slot);
  ins.setAttribute("data-full-width-responsive", "true");
  if (interstitialSlot) {
    ins.setAttribute("data-ad-format", "interstitial");
  } else {
    ins.setAttribute("data-ad-format", "auto");
  }

  const host = document.createElement("div");
  host.setAttribute("data-ad-interstitial", "true");
  host.style.cssText = "position:fixed;inset:0;z-index:9999;pointer-events:none;";
  host.appendChild(ins);
  document.body.appendChild(host);

  pushAdSlot(ins);

  if (import.meta.env.DEV) {
    console.debug("[ads] Interstitial/anchor pushed", { slot, interstitial: !!interstitialSlot });
  }
}
