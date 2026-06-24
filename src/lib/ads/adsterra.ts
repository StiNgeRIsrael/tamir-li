import { getStoredConsent } from "@/lib/ads/consent";

export type AdPlacementType = "banner" | "sidebar" | "inline";

export type AdRuntimeConfig = {
  zoneBanner?: string | null;
  zoneSidebar?: string | null;
  zoneSidebar2?: string | null;
  zoneInline?: string | null;
  popunderScriptUrl?: string | null;
  nativeScriptUrl?: string | null;
  nativeContainerId?: string | null;
  invokeHost?: string | null;
};

const PLACEMENT_LAYOUT: Record<
  AdPlacementType,
  { width: number; height: number; configKey: keyof AdRuntimeConfig; envKey: string; envKeyAlt?: keyof AdRuntimeConfig }
> = {
  banner: { width: 728, height: 90, configKey: "zoneBanner", envKey: "VITE_ADSTERRA_ZONE_BANNER" },
  sidebar: {
    width: 300,
    height: 250,
    configKey: "zoneSidebar",
    envKey: "VITE_ADSTERRA_ZONE_SIDEBAR",
    envKeyAlt: "zoneSidebar2",
  },
  inline: { width: 468, height: 60, configKey: "zoneInline", envKey: "VITE_ADSTERRA_ZONE_INLINE" },
};

const ENV_MAP: Record<keyof AdRuntimeConfig, string> = {
  zoneBanner: "VITE_ADSTERRA_ZONE_BANNER",
  zoneSidebar: "VITE_ADSTERRA_ZONE_SIDEBAR",
  zoneSidebar2: "VITE_ADSTERRA_ZONE_SIDEBAR_2",
  zoneInline: "VITE_ADSTERRA_ZONE_INLINE",
  popunderScriptUrl: "VITE_ADSTERRA_POPUNDER_SCRIPT_URL",
  nativeScriptUrl: "VITE_ADSTERRA_NATIVE_SCRIPT_URL",
  nativeContainerId: "VITE_ADSTERRA_NATIVE_CONTAINER_ID",
  invokeHost: "VITE_ADSTERRA_INVOKE_HOST",
};

let premiumUser = false;
let popunderLoaded = false;
let runtimeConfig: AdRuntimeConfig | null = null;

export function setAdRuntimeConfig(config: AdRuntimeConfig | null): void {
  runtimeConfig = config;
}

export function getAdRuntimeConfig(): AdRuntimeConfig | null {
  return runtimeConfig;
}

export function setPremiumUser(isPremium: boolean): void {
  premiumUser = isPremium;
}

export function isPremiumUser(): boolean {
  return premiumUser;
}

export function hasAdsConsent(): boolean {
  return getStoredConsent()?.ads === true;
}

function readEnv(key: string): string | undefined {
  return (import.meta.env as Record<string, string | undefined>)[key]?.trim() || undefined;
}

function resolveConfigValue(key: keyof AdRuntimeConfig): string | undefined {
  const fromRuntime = runtimeConfig?.[key];
  if (typeof fromRuntime === "string" && fromRuntime.trim()) {
    return fromRuntime.trim();
  }
  const envKey = ENV_MAP[key];
  return envKey ? readEnv(envKey) : undefined;
}

/** True when at least one Adsterra zone key is configured. */
export function isAdsterraConfigured(): boolean {
  return (
    !!resolveConfigValue("zoneBanner") ||
    !!resolveConfigValue("zoneSidebar") ||
    !!resolveConfigValue("zoneSidebar2") ||
    !!resolveConfigValue("zoneInline") ||
    !!resolveConfigValue("popunderScriptUrl") ||
    hasNativeAdConfigured()
  );
}

export type NativeAdConfig = {
  scriptUrl: string;
  containerId: string;
};

/** True when both native script URL and container id are set. */
export function hasNativeAdConfigured(): boolean {
  return !!getNativeAdConfig();
}

export function getNativeAdConfig(): NativeAdConfig | null {
  const scriptUrl = resolveConfigValue("nativeScriptUrl");
  const containerId = resolveConfigValue("nativeContainerId");
  if (!scriptUrl || !containerId) return null;
  return { scriptUrl, containerId };
}

export function getPlacementLayout(type: AdPlacementType) {
  return PLACEMENT_LAYOUT[type];
}

/** Resolve zone key for a placement; second sidebar rail uses zoneSidebar2 when slotId ends with -2. */
export function getAdsterraZoneKey(
  type: AdPlacementType,
  slotId?: string
): string | undefined {
  const layout = PLACEMENT_LAYOUT[type];
  if (type === "sidebar" && slotId?.endsWith("-2") && layout.envKeyAlt) {
    const alt = resolveConfigValue(layout.envKeyAlt);
    if (alt) return alt;
  }
  return resolveConfigValue(layout.configKey);
}

export function hasAdsterraZone(type: AdPlacementType, slotId?: string): boolean {
  return !!getAdsterraZoneKey(type, slotId);
}

function getInvokeHost(): string {
  return resolveConfigValue("invokeHost") || "www.highperformanceformat.com";
}

/** Milliseconds before iframe reports load failure to parent (parent retries once). */
export const AD_IFRAME_LOAD_TIMEOUT_MS = 20_000;

/** Build isolated iframe HTML so multiple Adsterra units do not clash on `atOptions`. */
export function buildAdIframeSrcdoc(
  key: string,
  width: number,
  height: number,
  slotId?: string
): string {
  const host = getInvokeHost();
  const atOptions = JSON.stringify({
    key,
    format: "iframe",
    height,
    width,
    params: {},
  });
  const slotJson = JSON.stringify(slotId ?? "");
  const timeoutMs = AD_IFRAME_LOAD_TIMEOUT_MS;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;overflow:hidden;background:transparent;width:100%;height:100%;}body>*{max-width:100%!important;}</style></head><body><script type="text/javascript">atOptions = ${atOptions};</script><script type="text/javascript">(function(){var slot=${slotJson};var loaded=false;function notify(status){if(loaded&&status!=='loaded')return;try{parent.postMessage({tamirAdSlot:slot,status:status},'*');}catch(e){}if(status==='loaded')loaded=true;}notify('loading');var s=document.createElement('script');s.type='text/javascript';s.src='https://${host}/${key}/invoke.js';s.onload=function(){notify('loaded');};s.onerror=function(){if(!loaded)notify('error');};document.body.appendChild(s);setTimeout(function(){if(!loaded)notify('timeout');},${timeoutMs});})();</script></body></html>`;
}

function scriptUrlForPrefetch(src: string): string {
  return src.startsWith("//") ? `https:${src}` : src;
}

/** Preload invoke.js for configured zones after consent (warms CDN cache before iframes mount). */
export function prefetchAdZoneScripts(): void {
  if (premiumUser || !hasAdsConsent()) return;

  const host = getInvokeHost();
  const keys = new Set<string>();
  for (const type of ["banner", "sidebar", "inline"] as AdPlacementType[]) {
    const key = getAdsterraZoneKey(type);
    if (key) keys.add(key);
    if (type === "sidebar") {
      const alt = resolveConfigValue("zoneSidebar2");
      if (alt) keys.add(alt);
    }
  }

  for (const key of keys) {
    const id = `adsterra-prefetch-${key}`;
    if (document.getElementById(id)) continue;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "preload";
    link.as = "script";
    link.href = `https://${host}/${key}/invoke.js`;
    document.head.appendChild(link);
  }

  const native = getNativeAdConfig();
  if (native) {
    const id = "adsterra-prefetch-native";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "preload";
      link.as = "script";
      link.href = scriptUrlForPrefetch(native.scriptUrl);
      document.head.appendChild(link);
    }
  }
}

/** Load popunder / social-bar script once after ad consent (paste full URL from Adsterra dashboard). */
export function loadPopunderScript(): void {
  const src = resolveConfigValue("popunderScriptUrl");
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

/** Load native ad invoke script after consent; re-injects on SPA navigation when container remounts. */
export function loadNativeAdScript(): void {
  const config = getNativeAdConfig();
  if (!config || premiumUser || !hasAdsConsent()) return;
  if (!document.getElementById(config.containerId)) return;

  const existing = document.getElementById("adsterra-native-script");
  if (existing) existing.remove();

  const script = document.createElement("script");
  script.id = "adsterra-native-script";
  script.async = true;
  script.setAttribute("data-cfasync", "false");
  script.src = config.scriptUrl.startsWith("//")
    ? `https:${config.scriptUrl}`
    : config.scriptUrl;
  document.head.appendChild(script);
}
