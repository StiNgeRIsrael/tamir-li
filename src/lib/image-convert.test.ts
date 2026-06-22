import { describe, it, expect } from "vitest";
import {
  normalizeFormat,
  formatToExtension,
  isOutputFormatSupported,
  isInputFormatSupported,
  canConvertClientSide,
  usesClientImageConversion,
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
    expect(isOutputFormatSupported("WEBP")).toBe(true);
    expect(isOutputFormatSupported("BMP")).toBe(true);
    expect(isOutputFormatSupported("ICO")).toBe(true);
    expect(isOutputFormatSupported("TIFF")).toBe(false);
    expect(isOutputFormatSupported("SVG")).toBe(false);
  });

  it("supports WEBP client-side pairs", () => {
    expect(canConvertClientSide("WEBP", "JPG")).toBe(true);
    expect(canConvertClientSide("JPG", "WEBP")).toBe(true);
    expect(canConvertClientSide("PNG", "WEBP")).toBe(true);
    expect(usesClientImageConversion("webp-to-jpg", ["WEBP"], ["JPG"])).toBe(true);
    expect(usesClientImageConversion("jpg-to-webp", ["JPG"], ["WEBP"])).toBe(true);
  });

  it("detects client-side conversion pairs", () => {
    expect(canConvertClientSide("SVG", "PNG")).toBe(true);
    expect(canConvertClientSide("PNG", "ICO")).toBe(true);
    expect(canConvertClientSide("PNG", "TIFF")).toBe(false);
  });

  it("routes dedicated image slugs through client conversion", () => {
    expect(usesClientImageConversion("svg-to-png", ["SVG"], ["PNG"])).toBe(true);
    expect(usesClientImageConversion("png-to-ico", ["PNG"], ["ICO"])).toBe(true);
    expect(usesClientImageConversion("pdf-to-word", ["PDF"], ["DOCX"])).toBe(false);
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
    expect(isToolFunctional("svg-to-png")).toBe(true);
    expect(isToolFunctional("png-to-ico")).toBe(true);
    expect(isToolFunctional("merge-pdf")).toBe(true);
    expect(isToolFunctional("text-tools")).toBe(true);
    expect(isToolFunctional("audio-converter")).toBe(true);
    expect(isToolFunctional("word-to-pdf")).toBe(true);
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
    expect(ids).toContain("word-to-pdf");
    expect(ids.length).toBe(9);
  });
});
