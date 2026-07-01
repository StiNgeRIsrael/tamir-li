import {
  getAdRuntimeConfig,
  hasAdsConsent,
  isPremiumUser,
  AD_IFRAME_LOAD_TIMEOUT_MS,
  AD_IFRAME_STRETCH_CSS,
  AD_IFRAME_STRETCH_SCRIPT,
} from "@/lib/ads/adsterra";
import type { AdPlacementType } from "@/lib/ads/adsterra";

export type HilltopBannerSize = "leaderboard" | "mobile";

/** Built-in Hilltopads zone scripts (override via admin or VITE_HILLTOP_*). */
export const HILLTOP_DEFAULT_SCRIPTS = {
  banner:
    "//massivesalad.com/b.X/Vas_d/Grl/0HYvWMcj/zeFmz9ouyZBUdlQkRPlTEc-x/OjDaQs5eMSjCEBtANKzKEa4wNKDbkvyzNrQi",
  sidebar:
    "//massivesalad.com/bhX.V/sYdBGPlE0fYhWKcp/Beem/9Uu/ZNUqlokRP_Thc/xbOLD/QY5eMzzScstANjzTEC4XNfDDkx0sMIQZ",
  mobileBanner:
    "//massivesalad.com/bNX/Ves.dvGslg0DY/WMcv/le_mF9/u/ZzUvlRkGP/TOc/xrOkDCQU5cNjTxMStZNIz_Eg4/NHDTkv1nN/wY",
  popunder:
    "https://fluffy-machine.com/bQ3/Vf0.PN3-pGvqbWm/VrJSZQDB0A3/MmTFg/0XOaTxE/z/LLTscOxNOwDTQk5CMMTNcK",
} as const;

export type HilltopRuntimeConfig = {
  hilltopBannerScriptUrl?: string | null;
  hilltopSidebarScriptUrl?: string | null;
  hilltopMobileBannerScriptUrl?: string | null;
  hilltopPopunderUrl?: string | null;
  hilltopBannerInvocationCode?: string | null;
  hilltopSidebarInvocationCode?: string | null;
  hilltopMobileBannerInvocationCode?: string | null;
};

type HilltopScriptKey = keyof Pick<
  HilltopRuntimeConfig,
  "hilltopBannerScriptUrl" | "hilltopSidebarScriptUrl" | "hilltopMobileBannerScriptUrl"
>;

type HilltopInvocationKey = keyof Pick<
  HilltopRuntimeConfig,
  | "hilltopBannerInvocationCode"
  | "hilltopSidebarInvocationCode"
  | "hilltopMobileBannerInvocationCode"
>;

const SCRIPT_ENV_MAP: Record<HilltopScriptKey, string> = {
  hilltopBannerScriptUrl: "VITE_HILLTOP_BANNER_SCRIPT_URL",
  hilltopSidebarScriptUrl: "VITE_HILLTOP_SIDEBAR_SCRIPT_URL",
  hilltopMobileBannerScriptUrl: "VITE_HILLTOP_MOBILE_BANNER_SCRIPT_URL",
};

const DEFAULT_SCRIPT_BY_KEY: Record<HilltopScriptKey, string> = {
  hilltopBannerScriptUrl: HILLTOP_DEFAULT_SCRIPTS.banner,
  hilltopSidebarScriptUrl: HILLTOP_DEFAULT_SCRIPTS.sidebar,
  hilltopMobileBannerScriptUrl: HILLTOP_DEFAULT_SCRIPTS.mobileBanner,
};

function readEnv(key: string): string | undefined {
  return (import.meta.env as Record<string, string | undefined>)[key]?.trim() || undefined;
}

function resolveHilltopScriptValue(
  key: HilltopScriptKey,
  useDefault: boolean
): string | undefined {
  const fromRuntime = getAdRuntimeConfig()?.[key];
  if (typeof fromRuntime === "string" && fromRuntime.trim()) {
    return fromRuntime.trim();
  }
  const env = readEnv(SCRIPT_ENV_MAP[key]);
  if (env) return env;
  return useDefault ? DEFAULT_SCRIPT_BY_KEY[key] : undefined;
}

function resolveHilltopInvocationValue(key: HilltopInvocationKey): string | undefined {
  const fromRuntime = getAdRuntimeConfig()?.[key];
  if (typeof fromRuntime === "string" && fromRuntime.trim()) {
    return fromRuntime.trim();
  }
  return undefined;
}

function scriptKeyForPlacement(
  type: AdPlacementType,
  bannerSize: HilltopBannerSize
): HilltopScriptKey | null {
  if (type === "banner" && bannerSize === "mobile") return "hilltopMobileBannerScriptUrl";
  if (type === "sidebar") return "hilltopSidebarScriptUrl";
  if (type === "banner" || type === "inline") return "hilltopBannerScriptUrl";
  return null;
}

function invocationKeyForPlacement(
  type: AdPlacementType,
  bannerSize: HilltopBannerSize
): HilltopInvocationKey | null {
  if (type === "banner" && bannerSize === "mobile") return "hilltopMobileBannerInvocationCode";
  if (type === "sidebar") return "hilltopSidebarInvocationCode";
  if (type === "banner" || type === "inline") return "hilltopBannerInvocationCode";
  return null;
}

export function isHilltopAdsConfigured(): boolean {
  return (
    !!getHilltopInvocationCode("banner") ||
    !!getHilltopInvocationCode("sidebar") ||
    !!getHilltopInvocationCode("banner", "mobile") ||
    !!getHilltopScriptUrl("banner") ||
    !!getHilltopScriptUrl("sidebar") ||
    !!getHilltopScriptUrl("banner", "mobile") ||
    !!getHilltopPopunderUrl()
  );
}

export function getHilltopPopunderUrl(): string | undefined {
  const fromRuntime = getAdRuntimeConfig()?.hilltopPopunderUrl;
  if (typeof fromRuntime === "string" && fromRuntime.trim()) {
    return fromRuntime.trim();
  }
  const env = readEnv("VITE_HILLTOP_POPUNDER_URL");
  if (env) return env;
  return HILLTOP_DEFAULT_SCRIPTS.popunder;
}

export function getHilltopLayout(
  type: AdPlacementType,
  bannerSize: HilltopBannerSize = "leaderboard"
): { width: number; height: number } {
  if (type === "banner" && bannerSize === "mobile") {
    return { width: 300, height: 100 };
  }
  if (type === "sidebar") {
    return { width: 300, height: 250 };
  }
  if (type === "banner") {
    return { width: 728, height: 90 };
  }
  return { width: 468, height: 60 };
}

/** API anti-adblock code (primary) for a placement. */
export function getHilltopInvocationCode(
  type: AdPlacementType,
  bannerSize: HilltopBannerSize = "leaderboard"
): string | undefined {
  const key = invocationKeyForPlacement(type, bannerSize);
  if (!key) return undefined;
  return resolveHilltopInvocationValue(key);
}

/** Static/script URL fallback when API code is unavailable. */
export function getHilltopScriptUrl(
  type: AdPlacementType,
  bannerSize: HilltopBannerSize = "leaderboard"
): string | undefined {
  const key = scriptKeyForPlacement(type, bannerSize);
  if (!key) return undefined;
  return resolveHilltopScriptValue(key, true);
}

export function hasHilltopAd(
  type: AdPlacementType,
  bannerSize?: HilltopBannerSize
): boolean {
  return !!getHilltopInvocationCode(type, bannerSize) || !!getHilltopScriptUrl(type, bannerSize);
}

/** @deprecated Use hasHilltopAd */
export function hasHilltopScript(type: AdPlacementType, bannerSize?: HilltopBannerSize): boolean {
  return hasHilltopAd(type, bannerSize);
}

function scriptUrlForPrefetch(src: string): string {
  return src.startsWith("//") ? `https:${src}` : src;
}

/** Preload Hilltop zone scripts after consent (static URLs only). */
export function prefetchHilltopScripts(): void {
  if (isPremiumUser() || !hasAdsConsent()) return;

  const urls = new Set<string>();
  for (const key of Object.keys(DEFAULT_SCRIPT_BY_KEY) as HilltopScriptKey[]) {
    const url = resolveHilltopScriptValue(key, true);
    if (url && !url.endsWith(".js")) urls.add(scriptUrlForPrefetch(url));
  }

  for (const url of urls) {
    const id = `hilltop-prefetch-${btoa(url).slice(0, 16)}`;
    if (document.getElementById(id)) continue;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "preload";
    link.as = "script";
    link.href = url;
    document.head.appendChild(link);
  }
}

const HILLTOP_LOAD_POLL_SCRIPT = `(function(){var checks=0;var poll=setInterval(function(){checks++;if(hasCreative()){clearInterval(poll);notify('loaded');}else if(checks>40){clearInterval(poll);if(!loaded)notify('timeout');}},500);})();`;

function hilltopIframeBody(
  slotJson: string,
  timeoutMs: number,
  injectScript: string
): string {
  return `(function(){var slot=${slotJson};var loaded=false;function notify(status){if(loaded&&status!=='loaded')return;try{parent.postMessage({tamirAdSlot:slot,status:status},'*');}catch(e){}if(status==='loaded')loaded=true;}function hasCreative(){for(var i=0;i<document.body.children.length;i++){var el=document.body.children[i];if(el.tagName==='SCRIPT')continue;if(el.tagName==='IFRAME'||(el.offsetHeight>0&&el.offsetWidth>0))return true;}return false;}notify('loading');${injectScript}setTimeout(function(){if(!loaded)notify('timeout');},${timeoutMs});})();`;
}

/** Build isolated iframe HTML using Hilltopads API invocation code (anti-adblock). */
export function buildHilltopInvocationIframeSrcdoc(
  invocationCode: string,
  width: number,
  height: number,
  slotId?: string
): string {
  const codeJson = JSON.stringify(invocationCode);
  const slotJson = JSON.stringify(slotId ?? "");
  const timeoutMs = AD_IFRAME_LOAD_TIMEOUT_MS;
  const inject = `try{(0,eval)(${codeJson});${HILLTOP_LOAD_POLL_SCRIPT}}catch(e){notify('error');}`;
  return `<!DOCTYPE html><html><head><meta name="referrer" content="no-referrer-when-downgrade"><meta charset="utf-8"><style>${AD_IFRAME_STRETCH_CSS}</style></head><body><script type="text/javascript">${AD_IFRAME_STRETCH_SCRIPT}</script><script type="text/javascript">${hilltopIframeBody(slotJson, timeoutMs, inject)}</script></body></html>`;
}

/** Build isolated iframe HTML for a Hilltopads script URL (static fallback). */
export function buildHilltopIframeSrcdoc(
  scriptSrc: string,
  width: number,
  height: number,
  slotId?: string
): string {
  const srcJson = JSON.stringify(scriptSrc);
  const slotJson = JSON.stringify(slotId ?? "");
  const timeoutMs = AD_IFRAME_LOAD_TIMEOUT_MS;
  const inject = `var src=${srcJson};var s=document.createElement('script');s.async=true;s.referrerPolicy='no-referrer-when-downgrade';s.src=src.indexOf('//')===0?'https:'+src:src;s.onload=function(){${HILLTOP_LOAD_POLL_SCRIPT}};s.onerror=function(){if(!loaded)notify('error');};document.body.appendChild(s);`;
  return `<!DOCTYPE html><html><head><meta name="referrer" content="no-referrer-when-downgrade"><meta charset="utf-8"><style>${AD_IFRAME_STRETCH_CSS}</style></head><body><script type="text/javascript">${AD_IFRAME_STRETCH_SCRIPT}</script><script type="text/javascript">${hilltopIframeBody(slotJson, timeoutMs, inject)}</script></body></html>`;
}

/** Prefer API invocation code, then static script URL. */
export function buildHilltopAdIframeSrcdoc(
  type: AdPlacementType,
  bannerSize: HilltopBannerSize,
  width: number,
  height: number,
  slotId?: string
): string | undefined {
  const invocation = getHilltopInvocationCode(type, bannerSize);
  if (invocation) {
    return buildHilltopInvocationIframeSrcdoc(invocation, width, height, slotId);
  }
  const script = getHilltopScriptUrl(type, bannerSize);
  if (script) {
    return buildHilltopIframeSrcdoc(script, width, height, slotId);
  }
  return undefined;
}
