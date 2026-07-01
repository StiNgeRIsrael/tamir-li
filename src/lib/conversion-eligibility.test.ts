import { describe, expect, it, vi } from "vitest";
import type { Tool } from "@/lib/tools-data";
import { isConversionBlockedOnNative } from "@/lib/conversion-eligibility";

vi.mock("@/lib/platform", () => ({
  isNativeApp: vi.fn(() => true),
}));

vi.mock("@/lib/feature-flags", () => ({
  allowMockFileConversion: vi.fn(() => false),
}));

const imagePairTool: Tool = {
  id: "jpg-to-png",
  slug: "jpg-to-png",
  category: "image",
  fromFormats: ["JPG"],
  toFormats: ["PNG"],
  premium: false,
};

const audioTool: Tool = {
  id: "mp3-to-wav",
  slug: "mp3-to-wav",
  category: "audio",
  fromFormats: ["MP3"],
  toFormats: ["WAV"],
  premium: false,
};

const customTool: Tool = {
  id: "image-compressor",
  slug: "image-compressor",
  category: "image",
  fromFormats: ["JPG", "PNG"],
  toFormats: ["JPG", "PNG"],
  premium: false,
  customComponent: "image-compressor",
};

describe("isConversionBlockedOnNative", () => {
  it("allows client-side image pair tools (jpg-to-png)", () => {
    expect(isConversionBlockedOnNative(imagePairTool)).toBe(false);
  });

  it("allows custom component tools", () => {
    expect(isConversionBlockedOnNative(customTool)).toBe(false);
  });

  it("allows server-queue tools (same API as web)", () => {
    expect(isConversionBlockedOnNative(audioTool)).toBe(false);
  });

  it("allows word/pdf document tools", () => {
    const docTool: Tool = {
      id: "word-to-pdf",
      slug: "word-to-pdf",
      category: "document",
      fromFormats: ["DOCX"],
      toFormats: ["PDF"],
      premium: false,
    };
    expect(isConversionBlockedOnNative(docTool)).toBe(false);
  });
});
