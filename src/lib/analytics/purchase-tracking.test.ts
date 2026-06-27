import { describe, it, expect, beforeEach, vi } from "vitest";
import { saveConsent } from "@/lib/ads/consent";
import { trackPurchase } from "@/lib/analytics/purchase-tracking";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";

describe("purchase-tracking", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    window.dataLayer = [];
    window.gtag = vi.fn();
  });

  it("dedupes purchase by transaction_id", () => {
    saveConsent(true, true);
    trackPurchase({
      plan: "monthly",
      source: "test",
      transactionId: "TX-123",
      provider: "paypal",
    });
    trackPurchase({
      plan: "monthly",
      source: "test",
      transactionId: "TX-123",
      provider: "paypal",
    });
    const purchaseCalls = (window.gtag as ReturnType<typeof vi.fn>).mock.calls.filter(
      (c) => c[1] === ANALYTICS_EVENTS.PURCHASE
    );
    expect(purchaseCalls).toHaveLength(1);
  });

  it("includes ecommerce fields on purchase", () => {
    saveConsent(true, false);
    trackPurchase({ plan: "yearly", source: "paypal_return", transactionId: "sub-1" });
    expect(window.gtag).toHaveBeenCalledWith(
      "event",
      ANALYTICS_EVENTS.PURCHASE,
      expect.objectContaining({
        plan: "yearly",
        currency: "ILS",
        value: 191.04,
        transaction_id: "sub-1",
      })
    );
  });
});
