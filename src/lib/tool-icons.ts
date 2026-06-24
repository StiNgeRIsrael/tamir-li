import type { ToolCategory } from "@/lib/tools-data";

export type ToolIconMeta = {
  icon: string;
  /** Pastel card background — FPC-style tinted tiles */
  cardClass: string;
};

const ICON = (file: string) => `/icons/tools/${file}`;

/** Per-tool icon + card tint (icons from public/icons/tools/). */
export const TOOL_ICON_MAP: Record<string, ToolIconMeta> = {
  "image-converter": { icon: ICON("pdf-to-png.svg"), cardClass: "bg-violet-50 dark:bg-violet-950/25" },
  "image-compressor": { icon: ICON("pdf-compress.svg"), cardClass: "bg-rose-50 dark:bg-rose-950/25" },
  "image-resizer": { icon: ICON("file-tiff.svg"), cardClass: "bg-fuchsia-50 dark:bg-fuchsia-950/25" },
  "png-to-ico": { icon: ICON("pdf-to-png.svg"), cardClass: "bg-purple-50 dark:bg-purple-950/25" },
  "svg-to-png": { icon: ICON("pdf-to-png.svg"), cardClass: "bg-indigo-50 dark:bg-indigo-950/25" },
  "video-converter": { icon: ICON("pdf-converter.svg"), cardClass: "bg-red-50 dark:bg-red-950/25" },
  "video-compressor": { icon: ICON("pdf-compress.svg"), cardClass: "bg-orange-50 dark:bg-orange-950/25" },
  "audio-converter": { icon: ICON("dots.svg"), cardClass: "bg-sky-50 dark:bg-sky-950/25" },
  "pdf-to-word": { icon: ICON("pdf-to-word.svg"), cardClass: "bg-blue-50 dark:bg-blue-950/25" },
  "word-to-pdf": { icon: ICON("word-to-pdf.svg"), cardClass: "bg-blue-50 dark:bg-blue-950/25" },
  "merge-pdf": { icon: ICON("pdf-merge.svg"), cardClass: "bg-amber-50 dark:bg-amber-950/25" },
  "text-tools": { icon: ICON("file-docx.svg"), cardClass: "bg-slate-50 dark:bg-slate-900/40" },
  "ai-image-generator": { icon: ICON("extract-pdf-images.svg"), cardClass: "bg-yellow-50 dark:bg-yellow-950/25" },
};

const CATEGORY_FALLBACK: Record<ToolCategory, ToolIconMeta> = {
  image: { icon: ICON("file-tiff.svg"), cardClass: "bg-violet-50 dark:bg-violet-950/25" },
  video: { icon: ICON("pdf-converter.svg"), cardClass: "bg-red-50 dark:bg-red-950/25" },
  audio: { icon: ICON("dots.svg"), cardClass: "bg-sky-50 dark:bg-sky-950/25" },
  document: { icon: ICON("file-pdf.svg"), cardClass: "bg-blue-50 dark:bg-blue-950/25" },
  ai: { icon: ICON("dots.svg"), cardClass: "bg-yellow-50 dark:bg-yellow-950/25" },
};

export function getToolIconMeta(toolId: string, category: ToolCategory): ToolIconMeta {
  return TOOL_ICON_MAP[toolId] ?? CATEGORY_FALLBACK[category];
}
