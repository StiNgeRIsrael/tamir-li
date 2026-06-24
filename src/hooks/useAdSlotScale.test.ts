import { describe, it, expect } from "vitest";
import { computeAdSlotScale, scaleModeForPlacement, MIN_CREDIBLE_AD_SLOT_WIDTH } from "@/hooks/useAdSlotScale";

describe("computeAdSlotScale", () => {
  it("scales up banner slots when container is wider than native width", () => {
    expect(computeAdSlotScale(1200, 728, "fill")).toBeCloseTo(1200 / 728);
  });

  it("scales down banner slots on narrow viewports", () => {
    expect(computeAdSlotScale(360, 728, "fill")).toBeCloseTo(360 / 728);
  });

  it("caps sidebar scale at 1 when container is wider than native width", () => {
    expect(computeAdSlotScale(400, 300, "native-max")).toBe(1);
  });

  it("shrinks sidebar when container is narrower than native width", () => {
    expect(computeAdSlotScale(250, 300, "native-max")).toBeCloseTo(250 / 300);
  });

  it("returns fallback for invalid or transient dimensions", () => {
    expect(computeAdSlotScale(0, 728, "fill", 0.8)).toBe(0.8);
    expect(computeAdSlotScale(MIN_CREDIBLE_AD_SLOT_WIDTH - 1, 728, "fill", 0.8)).toBe(0.8);
    expect(computeAdSlotScale(500, 0, "fill", 0.6)).toBe(0.6);
  });

  it("keeps last scale when width briefly collapses during layout", () => {
    const stable = computeAdSlotScale(360, 728, "fill", 1);
    expect(computeAdSlotScale(4, 728, "fill", stable)).toBe(stable);
  });
});

describe("scaleModeForPlacement", () => {
  it("uses fill for banner and inline", () => {
    expect(scaleModeForPlacement("banner")).toBe("fill");
    expect(scaleModeForPlacement("inline")).toBe("fill");
  });

  it("uses native-max for sidebar", () => {
    expect(scaleModeForPlacement("sidebar")).toBe("native-max");
  });
});
