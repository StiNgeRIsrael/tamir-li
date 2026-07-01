import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getNativeAdExperience,
  getNativeCompletedConversions,
  recordNativeConversionComplete,
  shouldGateNativeDownload,
  shouldShowNativeBanner,
} from "@/lib/ads/native-ad-ramp";

vi.mock("@/lib/ads/admob", () => ({
  shouldUseAdMob: vi.fn(() => true),
  showAdMobInterstitial: vi.fn(),
}));

describe("native ad ramp", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("first conversion — no ad surfaces", () => {
    expect(getNativeAdExperience(0)).toMatchObject({
      showBanner: false,
      showInterstitialOnConvert: false,
      gateDownloadWithRewarded: false,
      showPremiumAdHint: false,
    });
    expect(shouldShowNativeBanner()).toBe(false);
    expect(shouldGateNativeDownload()).toBe(false);
  });

  it("second conversion — interstitial only", () => {
    const exp = getNativeAdExperience(1);
    expect(exp.showInterstitialOnConvert).toBe(true);
    expect(exp.showBanner).toBe(false);
    expect(exp.gateDownloadWithRewarded).toBe(false);
    expect(exp.showPremiumAdHint).toBe(true);
  });

  it("third and fourth — banner + interstitial", () => {
    expect(getNativeAdExperience(2).showBanner).toBe(true);
    expect(getNativeAdExperience(3).showBanner).toBe(true);
    expect(getNativeAdExperience(2).gateDownloadWithRewarded).toBe(false);
  });

  it("fifth onward — rewarded download gate", () => {
    expect(getNativeAdExperience(4).gateDownloadWithRewarded).toBe(true);
    expect(getNativeAdExperience(4).premiumHintTone).toBe("prominent");
  });

  it("persists completed count in localStorage", () => {
    expect(getNativeCompletedConversions()).toBe(0);
    expect(recordNativeConversionComplete()).toBe(1);
    expect(getNativeCompletedConversions()).toBe(1);
  });
});
