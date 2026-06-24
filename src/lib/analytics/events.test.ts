import { describe, it, expect, beforeEach, vi } from "vitest";
import { saveConsent } from "@/lib/ads/consent";
import { trackEvent, hasAnalyticsConsent, ANALYTICS_EVENTS } from "@/lib/analytics/events";

describe("analytics events", () => {
  beforeEach(() => {
    localStorage.clear();
    window.dataLayer = [];
    window.gtag = vi.fn();
  });

  it("does not track before analytics consent", () => {
    expect(hasAnalyticsConsent()).toBe(false);
    trackEvent(ANALYTICS_EVENTS.TOOL_VIEW, { tool_id: "jpg-to-png" });
    expect(window.dataLayer).toHaveLength(0);
    expect(window.gtag).not.toHaveBeenCalled();
  });

  it("tracks after analytics consent is stored", () => {
    saveConsent(true, false);
    expect(hasAnalyticsConsent()).toBe(true);
    trackEvent(ANALYTICS_EVENTS.PAGE_VIEW, { page_path: "/" });
    expect(window.gtag).toHaveBeenCalledWith("event", "page_view", { page_path: "/" });
    expect(window.dataLayer.length).toBeGreaterThan(0);
  });
});
