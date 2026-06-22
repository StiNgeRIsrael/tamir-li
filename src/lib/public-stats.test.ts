import { describe, it, expect } from "vitest";
import { getDerivedHomeStatsFromTools } from "./public-stats";
import { tools } from "./tools-data";
import { getFunctionalToolIds } from "./tool-availability";

describe("public-stats", () => {
  it("counts live tools separately from catalog total", () => {
    const stats = getDerivedHomeStatsFromTools(tools);
    expect(stats.toolCount).toBe(tools.length);
    expect(stats.functionalToolCount).toBe(getFunctionalToolIds().length);
    expect(stats.functionalToolCount).toBeLessThanOrEqual(stats.toolCount);
  });

  it("shows 9 live tools out of 13 in catalog", () => {
    const stats = getDerivedHomeStatsFromTools(tools);
    expect(stats.functionalToolCount).toBe(9);
    expect(stats.toolCount).toBe(13);
  });
});
