/** Pastel card styles — light tints on dark page bg; labels use slate-800 (see ToolIconGrid). */
export type ToolIconStyle = {
  icon: string;
  /** Card fill — always a light pastel for icon contrast on tamir.li dark theme */
  bg: string;
  /** Visible border on dark backgrounds */
  border: string;
};

const ICON_BASE = "/tool-icons";

/** Style groups keyed by icon slug (filename without .svg). */
const STYLE_BY_ICON: Record<string, Omit<ToolIconStyle, "icon">> = {
  "word-to-pdf": { bg: "#f2f9fe", border: "#d7e3ec" },
  "pdf-to-word": { bg: "#f2f9fe", border: "#d7e3ec" },
  "file-docx": { bg: "#f2f9fe", border: "#d7e3ec" },
  "excel-to-pdf": { bg: "#f9fefb", border: "#d9efe2" },
  "pdf-to-excel": { bg: "#f9fefb", border: "#d9efe2" },
  "file-xlsx": { bg: "#f9fefb", border: "#d9efe2" },
  "powerpoint-to-pdf": { bg: "#fffcfa", border: "#f0e3db" },
  "pdf-to-powerpoint": { bg: "#fffcfa", border: "#f0e3db" },
  "file-pptx": { bg: "#fffcfa", border: "#f0e3db" },
  "jpg-to-pdf": { bg: "#fdf8ff", border: "#eee2f3" },
  "pdf-to-jpg": { bg: "#fdf8ff", border: "#eee2f3" },
  "pdf-to-png": { bg: "#fdf8ff", border: "#eee2f3" },
  "extract-pdf-images": { bg: "#fdf8ff", border: "#eee2f3" },
  "file-tiff": { bg: "#fdf8ff", border: "#eee2f3" },
  "openoffice-to-pdf": { bg: "#f8fcff", border: "#d9e6ee" },
  "autocad-to-pdf": { bg: "#fff5f8", border: "#f4e4e9" },
  "ebook-to-pdf": { bg: "#fffdfa", border: "#f3efeb" },
  "iworks-to-pdf": { bg: "#f7f9fb", border: "#e9edf1" },
  "pdf-merge": { bg: "#fffcf9", border: "#f3efeb" },
  "pdf-split": { bg: "#fffcf9", border: "#f3efeb" },
  "pdf-protect": { bg: "#fafffe", border: "#daeae7" },
  "unlock-pdf": { bg: "#fafffe", border: "#daeae7" },
  "pdf-redact": { bg: "#fafffe", border: "#daeae7" },
  "pdf-converter": { bg: "#faf6f6", border: "#f7ecec" },
  "pdf-compress": { bg: "#faf6f6", border: "#f7ecec" },
  "pdf-delete-pages": { bg: "#faf6f6", border: "#f7ecec" },
  "rotate-pdf": { bg: "#faf6f6", border: "#f7ecec" },
  "repair-pdf": { bg: "#faf6f6", border: "#f7ecec" },
  "pdf-flatten": { bg: "#faf6f6", border: "#f7ecec" },
  "pdf-print": { bg: "#faf6f6", border: "#f7ecec" },
  "pdf-to-pdfa": { bg: "#f7fcff", border: "#d3dfe7" },
  "file-pdf": { bg: "#faf6f6", border: "#f7ecec" },
  dots: { bg: "#f7f9fb", border: "#e9edf1" },
};

const DEFAULT_STYLE = STYLE_BY_ICON["pdf-converter"];

/** Maps each tool id in tools-data.ts to the best matching extracted icon. */
const TOOL_ICON_SLUG: Record<string, string> = {
  "image-converter": "pdf-converter",
  "image-compressor": "pdf-compress",
  "image-resizer": "rotate-pdf",
  "png-to-ico": "jpg-to-pdf",
  "svg-to-png": "pdf-to-png",
  "video-converter": "pdf-converter",
  "video-compressor": "pdf-compress",
  "audio-converter": "pdf-converter",
  "pdf-to-word": "pdf-to-word",
  "word-to-pdf": "word-to-pdf",
  "merge-pdf": "pdf-merge",
  "text-tools": "file-docx",
  "ai-image-generator": "extract-pdf-images",
};

export function getToolIconStyle(toolId: string): ToolIconStyle {
  const slug = TOOL_ICON_SLUG[toolId] ?? "dots";
  const style = STYLE_BY_ICON[slug] ?? DEFAULT_STYLE;
  return {
    icon: `${ICON_BASE}/${slug}.svg`,
    ...style,
  };
}
