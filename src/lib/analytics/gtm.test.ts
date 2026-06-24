import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  initGA4,
  isGa4Booted,
  updateConsentMode,
} from "@/lib/analytics/gtm";

describe("GA4 / Consent Mode", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_GA4_ID", "G-TEST123");
    vi.stubEnv("VITE_GTM_ID", "");
    document.head.innerHTML = "";
    window.dataLayer = [];
    window.gtag = vi.fn((...args: unknown[]) => {
      window.dataLayer.push(args as unknown as Record<string, unknown>);
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    document.head.innerHTML = "";
  });

  it("does not load gtag.js until initGA4 is called (after consent)", () => {
    expect(document.getElementById("ga4-script")).toBeNull();
    expect(isGa4Booted()).toBe(false);
    initGA4();
    expect(document.getElementById("ga4-script")).not.toBeNull();
    expect(isGa4Booted()).toBe(true);
  });

  it("updateConsentMode grants analytics_storage on accept", () => {
    updateConsentMode({ analytics: true, ads: true });
    expect(window.gtag).toHaveBeenCalledWith("consent", "update", {
      analytics_storage: "granted",
      ad_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted",
      functionality_storage: "granted",
      personalization_storage: "granted",
    });
  });

  it("updateConsentMode keeps denied on reject", () => {
    updateConsentMode({ analytics: false, ads: false });
    expect(window.gtag).toHaveBeenCalledWith("consent", "update", {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      functionality_storage: "denied",
      personalization_storage: "denied",
    });
  });
});
