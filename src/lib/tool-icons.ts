/** Theme-aware accent groups for ToolIconGrid cards (icon well + border tint). */
export type ToolIconAccent =
  | "document"
  | "spreadsheet"
  | "presentation"
  | "image"
  | "security"
  | "utility"
  | "neutral";

export type ToolIconStyle = {
  icon: string;
  accent: ToolIconAccent;
};

const ICON_BASE = "/tool-icons";

/** Style groups keyed by icon slug (filename without .svg). */
const STYLE_BY_ICON: Record<string, ToolIconAccent> = {
  "word-to-pdf": "document",
  "pdf-to-word": "document",
  "file-docx": "document",
  "excel-to-pdf": "spreadsheet",
  "pdf-to-excel": "spreadsheet",
  "file-xlsx": "spreadsheet",
  "powerpoint-to-pdf": "presentation",
  "pdf-to-powerpoint": "presentation",
  "file-pptx": "presentation",
  "jpg-to-pdf": "image",
  "pdf-to-jpg": "image",
  "pdf-to-png": "image",
  "extract-pdf-images": "image",
  "file-tiff": "image",
  "openoffice-to-pdf": "utility",
  "autocad-to-pdf": "image",
  "ebook-to-pdf": "document",
  "iworks-to-pdf": "utility",
  "pdf-merge": "document",
  "pdf-split": "document",
  "pdf-protect": "security",
  "unlock-pdf": "security",
  "pdf-redact": "security",
  "pdf-converter": "document",
  "pdf-compress": "utility",
  "pdf-delete-pages": "utility",
  "rotate-pdf": "utility",
  "repair-pdf": "utility",
  "pdf-flatten": "utility",
  "pdf-print": "utility",
  "pdf-to-pdfa": "document",
  "file-pdf": "document",
  dots: "neutral",
};

const DEFAULT_ACCENT: ToolIconAccent = "document";

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

export const TOOL_ICON_ACCENT_CLASSES: Record<
  ToolIconAccent,
  { well: string; border: string; hoverBorder: string }
> = {
  document: {
    well: "bg-[hsl(var(--tool-document)/0.14)] dark:bg-[hsl(var(--tool-document)/0.2)]",
    border: "border-[hsl(var(--tool-document)/0.32)] dark:border-[hsl(var(--tool-document)/0.38)]",
    hoverBorder: "hover:border-[hsl(var(--tool-document)/0.55)]",
  },
  spreadsheet: {
    well: "bg-[hsl(var(--success)/0.12)] dark:bg-[hsl(var(--success)/0.18)]",
    border: "border-[hsl(var(--success)/0.28)] dark:border-[hsl(var(--success)/0.34)]",
    hoverBorder: "hover:border-[hsl(var(--success)/0.5)]",
  },
  presentation: {
    well: "bg-[hsl(var(--accent)/0.12)] dark:bg-[hsl(var(--accent)/0.18)]",
    border: "border-[hsl(var(--accent)/0.3)] dark:border-[hsl(var(--accent)/0.36)]",
    hoverBorder: "hover:border-[hsl(var(--accent)/0.52)]",
  },
  image: {
    well: "bg-[hsl(var(--tool-image)/0.14)] dark:bg-[hsl(var(--tool-image)/0.2)]",
    border: "border-[hsl(var(--tool-image)/0.32)] dark:border-[hsl(var(--tool-image)/0.38)]",
    hoverBorder: "hover:border-[hsl(var(--tool-image)/0.55)]",
  },
  security: {
    well: "bg-[hsl(var(--primary)/0.1)] dark:bg-[hsl(var(--primary)/0.16)]",
    border: "border-[hsl(var(--primary)/0.28)] dark:border-[hsl(var(--primary)/0.34)]",
    hoverBorder: "hover:border-[hsl(var(--primary)/0.5)]",
  },
  utility: {
    well: "bg-muted/70 dark:bg-muted/50",
    border: "border-border",
    hoverBorder: "hover:border-primary/40",
  },
  neutral: {
    well: "bg-muted/60 dark:bg-muted/40",
    border: "border-border",
    hoverBorder: "hover:border-primary/35",
  },
};

export function getToolIconStyle(toolId: string): ToolIconStyle {
  const slug = TOOL_ICON_SLUG[toolId] ?? "dots";
  const accent = STYLE_BY_ICON[slug] ?? DEFAULT_ACCENT;
  return {
    icon: `${ICON_BASE}/${slug}.svg`,
    accent,
  };
}
