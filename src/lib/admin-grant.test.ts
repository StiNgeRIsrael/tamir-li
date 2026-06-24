import { describe, expect, it } from "vitest";
import {
  computePremiumPeriodEnd,
  parseGrantCreditsAmount,
  parsePremiumGrantDuration,
} from "../../backend/src/lib/admin-grant";

describe("parsePremiumGrantDuration", () => {
  it("accepts known durations", () => {
    expect(parsePremiumGrantDuration("30d")).toBe("30d");
    expect(parsePremiumGrantDuration("lifetime")).toBe("lifetime");
  });

  it("rejects invalid values", () => {
    expect(parsePremiumGrantDuration("forever")).toBeNull();
    expect(parsePremiumGrantDuration(30)).toBeNull();
  });
});

describe("computePremiumPeriodEnd", () => {
  const base = new Date("2026-01-01T12:00:00.000Z");

  it("returns null for lifetime", () => {
    expect(computePremiumPeriodEnd("lifetime", base)).toBeNull();
  });

  it("adds correct days", () => {
    const end = computePremiumPeriodEnd("30d", base)!;
    expect(end.getTime() - base.getTime()).toBe(30 * 24 * 60 * 60 * 1000);
  });
});

describe("parseGrantCreditsAmount", () => {
  it("accepts integers in range", () => {
    expect(parseGrantCreditsAmount(10)).toBe(10);
    expect(parseGrantCreditsAmount("50")).toBe(50);
  });

  it("rejects out of range or non-integers", () => {
    expect(parseGrantCreditsAmount(0)).toBeNull();
    expect(parseGrantCreditsAmount(501)).toBeNull();
    expect(parseGrantCreditsAmount(1.5)).toBeNull();
  });
});
