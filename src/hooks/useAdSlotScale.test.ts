import { describe, it, expect } from "vitest";
import { computeAdSlotScale, scaleModeForPlacement } from "@/hooks/useAdSlotScale";

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

  it("returns 1 for invalid dimensions", () => {
    expect(computeAdSlotScale(0, 728, "fill")).toBe(1);
    expect(computeAdSlotScale(500, 0, "fill")).toBe(1);
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
