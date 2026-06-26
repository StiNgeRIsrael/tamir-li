import { describe, it, expect } from "vitest";
import { getFunctionalToolIds } from "./tool-availability";
import { tools, getDefaultSlug } from "./tools-data";
import { usesClientDocumentConversion } from "./document-convert";

/** Mirrors scripts/autonomous-site-check.ts logic-only checks. */
describe("site-check logic", () => {
  it("lists every functional tool in the catalog with a slug", () => {
    for (const id of getFunctionalToolIds()) {
      const tool = tools.find((t) => t.id === id);
      expect(tool, `functional tool ${id} missing from tools-data`).toBeDefined();
      expect(getDefaultSlug(tool!)).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("tracks fourteen functional tools including video compressor", () => {
    const ids = getFunctionalToolIds();
    expect(ids).toContain("word-to-pdf");
    expect(ids).toContain("pdf-to-word");
    expect(ids).toContain("video-converter");
    expect(ids).toContain("video-compressor");
    expect(ids).toContain("hebrew-ocr");
    expect(ids).toContain("ai-image-generator");
    expect(ids.length).toBe(14);
  });

  it("routes document tools through client conversion", () => {
    expect(usesClientDocumentConversion("word-to-pdf")).toBe(true);
    expect(usesClientDocumentConversion("pdf-to-word")).toBe(true);
  });
});
