import { describe, it, expect } from "vitest";
import {
  normalizeFormat,
  formatToExtension,
  isOutputFormatSupported,
  isInputFormatSupported,
} from "./image-convert";
import { isToolFunctional, getFunctionalToolIds } from "./tool-availability";

describe("image-convert format helpers", () => {
  it("normalizes JPEG to JPG", () => {
    expect(normalizeFormat("jpeg")).toBe("JPG");
    expect(normalizeFormat("JPEG")).toBe("JPG");
  });

  it("maps formats to file extensions", () => {
    expect(formatToExtension("PNG")).toBe("png");
    expect(formatToExtension("WEBP")).toBe("webp");
  });

  it("knows browser-exportable output formats", () => {
    expect(isOutputFormatSupported("PNG")).toBe(true);
    expect(isOutputFormatSupported("BMP")).toBe(true);
    expect(isOutputFormatSupported("TIFF")).toBe(false);
    expect(isOutputFormatSupported("SVG")).toBe(false);
  });

  it("accepts common raster inputs including SVG", () => {
    expect(isInputFormatSupported("JPG")).toBe(true);
    expect(isInputFormatSupported("SVG")).toBe(true);
    expect(isInputFormatSupported("XYZ")).toBe(false);
  });
});

describe("tool-availability", () => {
  it("marks shipped tools as functional", () => {
    expect(isToolFunctional("image-converter")).toBe(true);
    expect(isToolFunctional("merge-pdf")).toBe(true);
    expect(isToolFunctional("text-tools")).toBe(true);
    expect(isToolFunctional("audio-converter")).toBe(true);
  });

  it("keeps mock/stub tools non-functional", () => {
    expect(isToolFunctional("pdf-to-word")).toBe(false);
    expect(isToolFunctional("video-converter")).toBe(false);
    expect(isToolFunctional("ai-image-generator")).toBe(false);
  });

  it("functional list matches expectations", () => {
    const ids = getFunctionalToolIds();
    expect(ids).toContain("image-compressor");
    expect(ids).toContain("audio-converter");
    expect(ids.length).toBe(6);
  });
});
