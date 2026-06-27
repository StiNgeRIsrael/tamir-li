import { describe, it, expect, beforeEach, vi } from "vitest";
import { saveConsent } from "@/lib/ads/consent";
import { captureAdsClickIds, getStoredAdsClickIds, reportGoogleAdsConversion } from "@/lib/analytics/google-ads";

describe("google-ads", () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.gtag = vi.fn();
  });

  it("captures gclid from landing URL", () => {
    window.history.replaceState({}, "", "/?gclid=test-click-id");
    captureAdsClickIds();
    expect(getStoredAdsClickIds().gclid).toBe("test-click-id");
  });

  it("fires conversion when ads consent granted", () => {
    saveConsent(true, true);
    vi.stubEnv("VITE_GOOGLE_ADS_CONVERSION_ID", "AW-123456789/AbCdEfGh");
    reportGoogleAdsConversion({ value: 19.9, currency: "ILS", transaction_id: "tx-1" });
    expect(window.gtag).toHaveBeenCalledWith(
      "event",
      "conversion",
      expect.objectContaining({
        send_to: "AW-123456789/AbCdEfGh",
        value: 19.9,
        currency: "ILS",
        transaction_id: "tx-1",
      })
    );
    vi.unstubAllEnvs();
  });

  it("skips conversion without ads consent", () => {
    saveConsent(true, false);
    vi.stubEnv("VITE_GOOGLE_ADS_CONVERSION_ID", "AW-123456789/AbCdEfGh");
    reportGoogleAdsConversion({ value: 19.9, currency: "ILS" });
    const conversionCalls = (window.gtag as ReturnType<typeof vi.fn>).mock.calls.filter(
      (c) => c[0] === "event" && c[1] === "conversion"
    );
    expect(conversionCalls).toHaveLength(0);
    vi.unstubAllEnvs();
  });
});
