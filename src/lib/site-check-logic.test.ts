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

  it("keeps stub tools non-functional", () => {
    const functional = new Set(getFunctionalToolIds());
    expect(functional.has("pdf-to-word")).toBe(false);
    expect(functional.has("video-converter")).toBe(false);
  });

  it("routes word-to-pdf through client document conversion", () => {
    expect(usesClientDocumentConversion("word-to-pdf")).toBe(true);
    expect(usesClientDocumentConversion("pdf-to-word")).toBe(false);
  });

  it("tracks nine functional tools including word-to-pdf", () => {
    const ids = getFunctionalToolIds();
    expect(ids).toContain("word-to-pdf");
    expect(ids.length).toBe(9);
  });
});
