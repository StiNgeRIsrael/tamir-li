import { pushDataLayer } from "@/lib/analytics/gtm";

export type AnalyticsEventParams = Record<string, string | number | boolean | undefined>;

/** Funnel and site events — keep in sync with GTM Custom Event triggers. */
export const ANALYTICS_EVENTS = {
  PAGE_VIEW: "page_view",
  TOOL_VIEW: "tool_view",
  FILE_UPLOAD: "file_upload",
  CONVERT_START: "convert_start",
  CONVERT_SUCCESS: "convert_success",
  PAYWALL_HIT: "paywall_hit",
  UPGRADE_CLICK: "upgrade_click",
  BEGIN_CHECKOUT: "begin_checkout",
  PURCHASE: "purchase",
  FILE_DOWNLOAD: "file_download",
  FILE_DOWNLOAD_ALL: "file_download_all",
  AD_CLICK_DOWNLOAD: "ad_click_download",
} as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS] | string;

/** Push a GA4/GTM custom event via dataLayer (and gtag when loaded). */
export function trackEvent(name: AnalyticsEventName, params: AnalyticsEventParams = {}): void {
  const payload = { event: name, ...params };
  pushDataLayer(payload);

  if (typeof window.gtag === "function") {
    window.gtag("event", name, params);
  }
}

/** SPA page_view — use on route changes; GTM should map this to GA4 page_view. */
export function trackPageView(params: AnalyticsEventParams = {}): void {
  trackEvent(ANALYTICS_EVENTS.PAGE_VIEW, params);
}
