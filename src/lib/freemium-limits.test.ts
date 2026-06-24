import { describe, expect, it } from "vitest";
import {
  MAX_FILE_BYTES_FREE,
  MAX_FILE_BYTES_PREMIUM,
  filterFilesForTier,
  maxBatchFiles,
  maxFileSizeMb,
} from "./freemium-limits";

function file(name: string, sizeBytes: number): File {
  return new File([new Uint8Array(sizeBytes)], name);
}

describe("freemium-limits", () => {
  it("returns tier file size caps", () => {
    expect(maxFileSizeMb(false)).toBe(50);
    expect(maxFileSizeMb(true)).toBe(200);
    expect(maxBatchFiles(false)).toBe(1);
    expect(maxBatchFiles(true)).toBe(10);
  });

  it("rejects oversized files on free tier", () => {
    const big = file("big.jpg", MAX_FILE_BYTES_FREE + 1);
    const ok = file("ok.jpg", 1024);
    const { accepted, rejected } = filterFilesForTier([ok, big], { isPremium: false });
    expect(accepted).toHaveLength(1);
    expect(accepted[0].name).toBe("ok.jpg");
    expect(rejected).toEqual([{ reason: "file_too_large", fileName: "big.jpg" }]);
  });

  it("allows larger files for premium", () => {
    const mid = file("mid.jpg", MAX_FILE_BYTES_FREE + 1);
    const { accepted, rejected } = filterFilesForTier([mid], { isPremium: true });
    expect(accepted).toHaveLength(1);
    expect(rejected).toHaveLength(0);
  });

  it("enforces batch limit of 1 for free tier", () => {
    const a = file("a.jpg", 100);
    const b = file("b.jpg", 100);
    const { accepted, rejected } = filterFilesForTier([a, b], { isPremium: false });
    expect(accepted).toHaveLength(1);
    expect(rejected).toEqual([{ reason: "batch_limit" }]);
  });

  it("respects existing queue count", () => {
    const a = file("a.jpg", 100);
    const { accepted, rejected } = filterFilesForTier([a], { isPremium: false, existingCount: 1 });
    expect(accepted).toHaveLength(0);
    expect(rejected).toEqual([{ reason: "batch_limit" }]);
  });

  it("rejects files above premium cap", () => {
    const huge = file("huge.mp4", MAX_FILE_BYTES_PREMIUM + 1);
    const { accepted, rejected } = filterFilesForTier([huge], { isPremium: true });
    expect(accepted).toHaveLength(0);
    expect(rejected[0]?.reason).toBe("file_too_large");
  });
});
