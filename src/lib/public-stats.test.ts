import { describe, it, expect } from "vitest";
import { getDerivedHomeStatsFromTools, formatPublicStatCount } from "./public-stats";
import { tools } from "./tools-data";
import { getFunctionalToolIds } from "./tool-availability";

describe("public-stats", () => {
  it("counts live tools separately from catalog total", () => {
    const stats = getDerivedHomeStatsFromTools(tools);
    expect(stats.toolCount).toBe(tools.length);
    expect(stats.functionalToolCount).toBe(getFunctionalToolIds().length);
    expect(stats.functionalToolCount).toBeLessThanOrEqual(stats.toolCount);
  });

  it("shows all catalog tools as live", () => {
    const stats = getDerivedHomeStatsFromTools(tools);
    expect(stats.functionalToolCount).toBe(14);
    expect(stats.toolCount).toBe(14);
  });

  describe("formatPublicStatCount", () => {
    it("shows em dash for zero or missing counts", () => {
      expect(formatPublicStatCount(0)).toBe("—");
      expect(formatPublicStatCount(null)).toBe("—");
      expect(formatPublicStatCount(undefined)).toBe("—");
    });

    it("shows exact numbers below 1000", () => {
      expect(formatPublicStatCount(42, "en")).toBe("42");
      expect(formatPublicStatCount(999, "en")).toBe("999");
    });

    it("rounds large counts with plus suffix", () => {
      expect(formatPublicStatCount(12437, "en")).toBe("12,000+");
      expect(formatPublicStatCount(5432, "en")).toBe("5,400+");
    });
  });
});
