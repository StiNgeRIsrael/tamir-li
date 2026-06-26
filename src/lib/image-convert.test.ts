import { describe, it, expect } from "vitest";
import {
  normalizeFormat,
  formatToExtension,
  isOutputFormatSupported,
  isInputFormatSupported,
  canConvertClientSide,
  usesClientImageConversion,
  encodeRgbaAsBmp,
  encodeRgbaAsBmpBuffer,
} from "./image-convert";
import { isToolFunctional, getFunctionalToolIds } from "./tool-availability";
import { getToolByFormatSlug } from "./tools-data";

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

  it("supports JPG to BMP client-side conversion", () => {
    expect(canConvertClientSide("JPG", "BMP")).toBe(true);
    expect(usesClientImageConversion("image-converter", ["JPG"], ["BMP"])).toBe(true);
  });

  it("writes a valid 24-bit BMP header and pixel data", () => {
    // 2×2: red + blue top row, green + white bottom row
    const rgba = new Uint8ClampedArray([
      255, 0, 0, 255, 0, 0, 255, 255,
      0, 255, 0, 255, 255, 255, 255, 255,
    ]);
    const bytes = new Uint8Array(encodeRgbaAsBmpBuffer(2, 2, rgba));
    const blob = encodeRgbaAsBmp(2, 2, rgba);

    expect(String.fromCharCode(bytes[0], bytes[1])).toBe("BM");
    expect(blob.type).toBe("image/bmp");
    expect(bytes.length).toBe(70); // 54 header + 2 rows × 8 bytes (6 pixels + 2 pad)

    const dataView = new DataView(bytes.buffer);
    expect(dataView.getInt32(18, true)).toBe(2);
    expect(dataView.getInt32(22, true)).toBe(2);
    // bottom row starts at offset 54: BGR for green
    expect(bytes[54]).toBe(0);
    expect(bytes[55]).toBe(255);
    expect(bytes[56]).toBe(0);
  });

  it("resolves jpg-to-bmp and jpeg-to-bmp slugs to image-converter", () => {
    const jpg = getToolByFormatSlug("jpg-to-bmp");
    expect(jpg?.tool.id).toBe("image-converter");
    expect(jpg?.from).toBe("JPG");
    expect(jpg?.to).toBe("BMP");

    const jpeg = getToolByFormatSlug("jpeg-to-bmp");
    expect(jpeg?.tool.id).toBe("image-converter");
    expect(jpeg?.from).toBe("JPG");
    expect(jpeg?.to).toBe("BMP");
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
    expect(isToolFunctional("hebrew-ocr")).toBe(true);
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
    expect(ids).toContain("hebrew-ocr");
    expect(ids.length).toBe(10);
  });
});
