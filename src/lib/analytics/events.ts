import { getStoredConsent } from "@/lib/ads/consent";
import { pushDataLayer } from "@/lib/analytics/gtm";
export type AnalyticsEventParams = Record<string, string | number | boolean | undefined>;

/** Funnel and site events — keep in sync with docs/google-analytics-setup.md */
export const ANALYTICS_EVENTS = {
  PAGE_VIEW: "page_view",
  TOOL_VIEW: "tool_view",
  FILE_UPLOAD: "file_upload",
  CONVERT_START: "convert_start",
  CONVERT_SUCCESS: "convert_success",
  PAYWALL_HIT: "paywall_hit",
  UPGRADE_CLICK: "upgrade_click",
  BEGIN_CHECKOUT: "begin_checkout",
  /** GA4 recommended — pricing / promo impression */
  VIEW_PROMOTION: "view_promotion",
  PURCHASE: "purchase",
  FILE_DOWNLOAD: "file_download",
  FILE_DOWNLOAD_ALL: "file_download_all",
  AD_CLICK_DOWNLOAD: "ad_click_download",
  /** GA4 recommended — first account creation */
  SIGN_UP: "sign_up",
  /** GA4 recommended — returning user sign-in */
  LOGIN: "login",
  SIGN_OUT: "sign_out",
  COOKIE_CONSENT: "cookie_consent",
  AI_GENERATE_START: "ai_generate_start",
  AI_GENERATE_SUCCESS: "ai_generate_success",
  SELECT_CONTENT: "select_content",
} as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS] | string;

/** True when the user accepted analytics cookies. */
export function hasAnalyticsConsent(): boolean {
  return getStoredConsent()?.analytics === true;
}

/**
 * Push a GA4/GTM custom event (no-op until analytics consent is granted and tags load).
 */
export function trackEvent(name: AnalyticsEventName, params: AnalyticsEventParams = {}): void {
  if (!hasAnalyticsConsent()) return;

  const payload = { event: name, ...params };
  pushDataLayer(payload);

  if (typeof window.gtag === "function") {
    window.gtag("event", name, params);
  }
}

/** SPA page_view — fired on route changes after analytics consent. */
export function trackPageView(params: AnalyticsEventParams = {}): void {
  trackEvent(ANALYTICS_EVENTS.PAGE_VIEW, params);
}

/** Set GA4 user_id for cross-session stitching (after consent + sign-in). */
export function setAnalyticsUserId(userId: string | null): void {
  if (!hasAnalyticsConsent() || typeof window.gtag !== "function") return;
  window.gtag("set", { user_id: userId ?? undefined });
}
