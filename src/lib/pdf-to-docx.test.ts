import { describe, it, expect } from "vitest";
import { convertExtractedTextToDocx, createDocxFromText, extractPdfText } from "./pdf-to-docx";

describe("pdf-to-docx", () => {
  it("creates a DOCX blob from plain text", async () => {
    const blob = await createDocxFromText("Hello\n\nSecond paragraph");
    expect(blob.type).toBe(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    expect(blob.size).toBeGreaterThan(100);
  });

  it("converts extracted text to DOCX", async () => {
    const blob = await convertExtractedTextToDocx("Sample paragraph for DOCX export.");
    expect(blob.size).toBeGreaterThan(100);
  });

  it("rejects empty extracted text", async () => {
    await expect(convertExtractedTextToDocx("   ")).rejects.toThrow("EMPTY_PDF");
  });
});

describe("extractPdfText", () => {
  it("is exported for browser-side PDF parsing", () => {
    expect(typeof extractPdfText).toBe("function");
  });
});
