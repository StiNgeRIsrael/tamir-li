import { getStoredConsent } from "@/lib/ads/consent";

export type AdPlacementType = "banner" | "sidebar" | "inline";

const PLACEMENT_LAYOUT: Record<
  AdPlacementType,
  { width: number; height: number; envKey: string; envKeyAlt?: string }
> = {
  banner: { width: 728, height: 90, envKey: "VITE_ADSTERRA_ZONE_BANNER" },
  sidebar: {
    width: 300,
    height: 250,
    envKey: "VITE_ADSTERRA_ZONE_SIDEBAR",
    envKeyAlt: "VITE_ADSTERRA_ZONE_SIDEBAR_2",
  },
  inline: { width: 468, height: 60, envKey: "VITE_ADSTERRA_ZONE_INLINE" },
};

let premiumUser = false;
let popunderLoaded = false;

export function setPremiumUser(isPremium: boolean): void {
  premiumUser = isPremium;
}

export function isPremiumUser(): boolean {
  return premiumUser;
}

export function hasAdsConsent(): boolean {
  return getStoredConsent()?.ads === true;
}

/** True when at least one Adsterra zone key is configured. */
export function isAdsterraConfigured(): boolean {
  return (
    !!import.meta.env.VITE_ADSTERRA_ZONE_BANNER?.trim() ||
    !!import.meta.env.VITE_ADSTERRA_ZONE_SIDEBAR?.trim() ||
    !!import.meta.env.VITE_ADSTERRA_ZONE_SIDEBAR_2?.trim() ||
    !!import.meta.env.VITE_ADSTERRA_ZONE_INLINE?.trim() ||
    !!import.meta.env.VITE_ADSTERRA_POPUNDER_SCRIPT_URL?.trim()
  );
}

export function getPlacementLayout(type: AdPlacementType) {
  return PLACEMENT_LAYOUT[type];
}

function readEnv(key: string): string | undefined {
  return (import.meta.env as Record<string, string | undefined>)[key]?.trim() || undefined;
}

/** Resolve zone key for a placement; second sidebar rail uses *_SIDEBAR_2 when slotId ends with -2. */
export function getAdsterraZoneKey(
  type: AdPlacementType,
  slotId?: string
): string | undefined {
  const layout = PLACEMENT_LAYOUT[type];
  if (type === "sidebar" && slotId?.endsWith("-2") && layout.envKeyAlt) {
    const alt = readEnv(layout.envKeyAlt);
    if (alt) return alt;
  }
  return readEnv(layout.envKey);
}

export function hasAdsterraZone(type: AdPlacementType, slotId?: string): boolean {
  return !!getAdsterraZoneKey(type, slotId);
}

function getInvokeHost(): string {
  return import.meta.env.VITE_ADSTERRA_INVOKE_HOST?.trim() || "www.highperformanceformat.com";
}

/** Build isolated iframe HTML so multiple Adsterra units do not clash on `atOptions`. */
export function buildAdIframeSrcdoc(key: string, width: number, height: number): string {
  const host = getInvokeHost();
  const atOptions = JSON.stringify({
    key,
    format: "iframe",
    height,
    width,
    params: {},
  });
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;overflow:hidden;background:transparent;}</style></head><body><script type="text/javascript">atOptions = ${atOptions};</script><script type="text/javascript" src="https://${host}/${key}/invoke.js"></script></body></html>`;
}

/** Load popunder / social-bar script once after ad consent (paste full URL from Adsterra dashboard). */
export function loadPopunderScript(): void {
  const src = import.meta.env.VITE_ADSTERRA_POPUNDER_SCRIPT_URL?.trim();
  if (!src || premiumUser || popunderLoaded || !hasAdsConsent()) return;
  if (document.getElementById("adsterra-popunder-script")) return;

  const script = document.createElement("script");
  script.id = "adsterra-popunder-script";
  script.async = true;
  script.src = src.startsWith("//") ? `https:${src}` : src;
  document.head.appendChild(script);
  popunderLoaded = true;
}

/** Optional popunder on conversion milestones when configured in env. */
export function triggerPopunderAd(): void {
  if (premiumUser || !hasAdsConsent()) return;
  loadPopunderScript();
}
