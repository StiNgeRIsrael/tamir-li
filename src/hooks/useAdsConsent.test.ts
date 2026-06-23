import { act, renderHook } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { useAdsConsent } from "@/hooks/useAdsConsent";
import { saveConsent } from "@/lib/ads/consent";

describe("useAdsConsent", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts false without stored consent", () => {
    const { result } = renderHook(() => useAdsConsent());
    expect(result.current).toBe(false);
  });

  it("updates when tamir:consent fires after accept", () => {
    const { result } = renderHook(() => useAdsConsent());
    expect(result.current).toBe(false);

    act(() => {
      saveConsent(true, true);
    });

    expect(result.current).toBe(true);
  });
});
