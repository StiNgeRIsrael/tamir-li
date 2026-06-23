import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getAdsterraZoneKey,
  isAdsterraConfigured,
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
    expect(isAdsterraConfigured()).toBe(true);
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
