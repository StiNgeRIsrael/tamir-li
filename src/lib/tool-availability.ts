/**
 * Single source of truth for which tools are fully functional vs "SOON".
 * Update this list as tools ship; UI and ToolPage read from here.
 */
const FUNCTIONAL_TOOL_IDS = new Set([
  "image-converter",
  "image-compressor",
  "image-resizer",
  "svg-to-png",
  "png-to-ico",
  "merge-pdf",
  "text-tools",
  "hebrew-ocr",
  "audio-converter",
  "video-converter",
  "word-to-pdf",
  "pdf-to-word",
  "ai-image-generator",
]);

export function isToolFunctional(toolId: string): boolean {
  return FUNCTIONAL_TOOL_IDS.has(toolId);
}

export function getFunctionalToolIds(): readonly string[] {
  return [...FUNCTIONAL_TOOL_IDS];
}
