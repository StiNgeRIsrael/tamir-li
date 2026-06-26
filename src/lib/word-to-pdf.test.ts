import { describe, it, expect } from "vitest";
import { isLegacyDocFile, splitTextIntoLines } from "./word-to-pdf";
import { usesClientDocumentConversion } from "./document-convert";
import { PDFDocument, StandardFonts } from "pdf-lib";

describe("document-convert", () => {
  it("routes document tools through client conversion", () => {
    expect(usesClientDocumentConversion("word-to-pdf")).toBe(true);
    expect(usesClientDocumentConversion("pdf-to-word")).toBe(true);
  });
});

describe("word-to-pdf helpers", () => {
  it("detects legacy .doc files", () => {
    expect(isLegacyDocFile(new File([], "report.doc", { type: "application/msword" }))).toBe(true);
    expect(isLegacyDocFile(new File([], "report.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }))).toBe(false);
  });

  it("wraps long lines for PDF layout", async () => {
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const lines = splitTextIntoLines("one two three four five six seven", font, 12, 60);
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.join(" ")).toContain("one");
  });
});
