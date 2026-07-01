import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getAdsterraZoneKey,
  isAdsterraOnlyConfigured,
  setAdRuntimeConfig,
  getNativeAdConfig,
} from "@/lib/ads/adsterra";

describe("adsterra runtime config", () => {
  beforeEach(() => {
    setAdRuntimeConfig(null);
    vi.stubEnv("VITE_ADSTERRA_ZONE_BANNER", "");
    vi.stubEnv("VITE_ADSTERRA_ZONE_SIDEBAR", "");
    vi.stubEnv("VITE_ADSTERRA_ZONE_SIDEBAR_2", "");
    vi.stubEnv("VITE_ADSTERRA_ZONE_INLINE", "");
  });

  it("prefers runtime config over env fallback", () => {
    vi.stubEnv("VITE_ADSTERRA_ZONE_BANNER", "env-key");
    setAdRuntimeConfig({ zoneBanner: "db-key" });
    expect(getAdsterraZoneKey("banner")).toBe("db-key");
  });

  it("falls back to env when runtime config is empty", () => {
    vi.stubEnv("VITE_ADSTERRA_ZONE_BANNER", "env-key");
    setAdRuntimeConfig({ zoneBanner: null });
    expect(getAdsterraZoneKey("banner")).toBe("env-key");
  });

  it("detects configured state from runtime config", () => {
    setAdRuntimeConfig({ zoneInline: "abc123" });
    expect(isAdsterraOnlyConfigured()).toBe(true);
  });

  it("uses zoneSidebar2 for second sidebar rail", () => {
    setAdRuntimeConfig({ zoneSidebar: "rail1", zoneSidebar2: "rail2" });
    expect(getAdsterraZoneKey("sidebar", "sidebar-left-2")).toBe("rail2");
    expect(getAdsterraZoneKey("sidebar", "sidebar-left")).toBe("rail1");
  });

  it("returns native config when both fields set", () => {
    setAdRuntimeConfig({
      nativeScriptUrl: "https://cdn.example/invoke.js",
      nativeContainerId: "container-abc",
    });
    expect(getNativeAdConfig()).toEqual({
      scriptUrl: "https://cdn.example/invoke.js",
      containerId: "container-abc",
    });
  });
});

describe("buildAdIframeSrcdoc", () => {
  it("uses 20s timeout and error status instead of blocked on script failure", async () => {
    const { buildAdIframeSrcdoc, AD_IFRAME_LOAD_TIMEOUT_MS } = await import("@/lib/ads/adsterra");
    const srcdoc = buildAdIframeSrcdoc("test-key", 728, 90, "home-banner");
    expect(AD_IFRAME_LOAD_TIMEOUT_MS).toBe(20_000);
    expect(srcdoc).toContain("notify('error')");
    expect(srcdoc).not.toContain("notify('blocked')");
    expect(srcdoc).toContain("20000");
  });

  it("includes stretch CSS and bounded observer for full-width creatives", async () => {
    const { buildAdIframeSrcdoc, AD_IFRAME_STRETCH_CSS, AD_IFRAME_STRETCH_SCRIPT } = await import(
      "@/lib/ads/adsterra"
    );
    const srcdoc = buildAdIframeSrcdoc("test-key", 728, 90, "home-banner");
    expect(srcdoc).toContain(AD_IFRAME_STRETCH_CSS);
    expect(srcdoc).toContain(AD_IFRAME_STRETCH_SCRIPT);
    expect(srcdoc).toContain("MutationObserver");
    expect(srcdoc).toContain("obs.disconnect()");
    expect(srcdoc).not.toContain("subtree:true");
    expect(srcdoc).not.toContain("querySelectorAll");
    expect(srcdoc).toContain("min-width:100%");
  });
});
