import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getHilltopScriptUrl,
  getHilltopInvocationCode,
  buildHilltopIframeSrcdoc,
  buildHilltopInvocationIframeSrcdoc,
  buildHilltopAdIframeSrcdoc,
  getHilltopPopunderUrl,
  HILLTOP_DEFAULT_SCRIPTS,
} from "@/lib/ads/hilltopads";
import { setAdRuntimeConfig } from "@/lib/ads/adsterra";

describe("hilltopads", () => {
  beforeEach(() => {
    setAdRuntimeConfig(null);
    vi.stubEnv("VITE_HILLTOP_BANNER_SCRIPT_URL", "");
    vi.stubEnv("VITE_HILLTOP_SIDEBAR_SCRIPT_URL", "");
    vi.stubEnv("VITE_HILLTOP_MOBILE_BANNER_SCRIPT_URL", "");
    vi.stubEnv("VITE_HILLTOP_POPUNDER_URL", "");
  });

  it("uses built-in script defaults when env and runtime are empty", () => {
    expect(getHilltopScriptUrl("banner")).toBe(HILLTOP_DEFAULT_SCRIPTS.banner);
    expect(getHilltopScriptUrl("sidebar")).toBe(HILLTOP_DEFAULT_SCRIPTS.sidebar);
    expect(getHilltopScriptUrl("banner", "mobile")).toBe(HILLTOP_DEFAULT_SCRIPTS.mobileBanner);
    expect(getHilltopPopunderUrl()).toBe(HILLTOP_DEFAULT_SCRIPTS.popunder);
  });

  it("prefers API invocation code over static script URL", () => {
    setAdRuntimeConfig({
      hilltopBannerInvocationCode: "(function(){})()",
      hilltopBannerScriptUrl: "//static.example/banner",
    });
    expect(getHilltopInvocationCode("banner")).toBe("(function(){})()");
    const srcdoc = buildHilltopAdIframeSrcdoc("banner", "leaderboard", 728, 90, "slot");
    expect(srcdoc).toContain("(0,eval)");
    expect(srcdoc).not.toContain("static.example");
  });

  it("builds script iframe srcdoc with referrer policy", () => {
    const srcdoc = buildHilltopIframeSrcdoc(HILLTOP_DEFAULT_SCRIPTS.banner, 728, 90, "test-slot");
    expect(srcdoc).toContain('content="no-referrer-when-downgrade"');
    expect(srcdoc).toContain(HILLTOP_DEFAULT_SCRIPTS.banner);
  });

  it("builds invocation iframe srcdoc with load detection", () => {
    const srcdoc = buildHilltopInvocationIframeSrcdoc("(function(){})()", 300, 250, "rail");
    expect(srcdoc).toContain("tamirAdSlot");
    expect(srcdoc).toContain("hasCreative");
  });
});
