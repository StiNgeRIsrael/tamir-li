import { Image, FileVideo, FileAudio, FileText, ArrowLeftRight, Minimize2, Hash, Palette, Type, FileArchive, Sparkles, Wand2 } from "lucide-react";
import { normalizeFormat } from "./image-convert";

export interface Tool {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  category: ToolCategory;
  fromFormats: string[];
  toFormats: string[];
  icon: React.ComponentType<{ className?: string }>;
  popular?: boolean;
  premium?: boolean;
  keywords: string[];
  customComponent?: string;
}

export type ToolCategory = "image" | "video" | "audio" | "document" | "ai";

export const CATEGORY_HUB_CATEGORIES: ToolCategory[] = ["image", "video", "audio", "document", "ai"];

/** Popular image-converter pairs for sitemap (not full cartesian product). */
export const IMAGE_CONVERTER_SITEMAP_PAIRS: { from: string; to: string }[] = [
  { from: "JPG", to: "PNG" },
  { from: "PNG", to: "JPG" },
  { from: "WEBP", to: "JPG" },
  { from: "JPG", to: "WEBP" },
  { from: "PNG", to: "WEBP" },
  { from: "SVG", to: "PNG" },
];

export function getCategoryHubPath(category: ToolCategory): string {
  return `/tools/${category}`;
}

export const categoryLabels: Record<ToolCategory, string> = {
  image: "תמונות",
  video: "וידאו",
  audio: "אודיו",
  document: "מסמכים",
  ai: "יצירה עם AI",
};

export const categoryIcons: Record<ToolCategory, React.ComponentType<{ className?: string }>> = {
  image: Image,
  video: FileVideo,
  audio: FileAudio,
  document: FileText,
  ai: Sparkles,
};

export const tools: Tool[] = [
  {
    id: "image-converter",
    name: "המרת פורמט תמונה",
    description: "המרה בין JPG, PNG, WEBP, GIF, BMP, TIFF ועוד",
    longDescription: "כלי המרת תמונות מקוון שמאפשר לכם להמיר בין כל פורמטי התמונה הנפוצים. העלו תמונה בפורמט JPG, PNG, WEBP, GIF, BMP, TIFF או SVG והמירו אותה לכל פורמט אחר תוך שניות, ישירות בדפדפן וללא הורדת תוכנה.",
    category: "image",
    fromFormats: ["JPG", "PNG", "WEBP", "GIF", "BMP", "TIFF", "SVG"],
    toFormats: ["JPG", "PNG", "WEBP", "GIF", "BMP", "TIFF"],
    icon: ArrowLeftRight,
    popular: true,
    keywords: ["המרת תמונות", "JPG ל-PNG", "PNG ל-JPG", "WEBP ל-JPG", "המרת פורמט תמונה"],
  },
  {
    id: "image-compressor",
    name: "דחיסת תמונה",
    description: "הקטנת משקל תמונות בלי לפגוע באיכות",
    longDescription: "דחסו את התמונות שלכם וחסכו מקום אחסון ונתונים. הכלי שלנו מקטין את גודל הקובץ תוך שמירה על איכות מקסימלית.",
    category: "image",
    fromFormats: ["JPG", "PNG", "WEBP"],
    toFormats: ["JPG", "PNG", "WEBP"],
    icon: Minimize2,
    popular: true,
    keywords: ["דחיסת תמונות", "הקטנת תמונה", "כיווץ תמונה"],
    customComponent: "image-compressor",
  },
  {
    id: "image-resizer",
    name: "שינוי גודל תמונה",
    description: "שנה את הרזולוציה של התמונה בקלות",
    longDescription: "שנו את גודל התמונות שלכם לכל רזולוציה רצויה. מתאים להתאמת תמונות לרשתות חברתיות, אתרי אינטרנט, מצגות ועוד.",
    category: "image",
    fromFormats: ["JPG", "PNG", "WEBP"],
    toFormats: ["JPG", "PNG", "WEBP"],
    icon: Hash,
    keywords: ["שינוי גודל תמונה", "שינוי רזולוציה"],
    customComponent: "image-resizer",
  },
  {
    id: "png-to-ico",
    name: "PNG ל-ICO",
    description: "צור אייקונים לאתר או לאפליקציה",
    longDescription: "המירו תמונות PNG לפורמט ICO ליצירת אייקונים לאתרי אינטרנט (favicon) או לאפליקציות.",
    category: "image",
    fromFormats: ["PNG"],
    toFormats: ["ICO"],
    icon: Palette,
    keywords: ["PNG ל-ICO", "יצירת favicon", "אייקון לאתר"],
  },
  {
    id: "svg-to-png",
    name: "SVG ל-PNG",
    description: "המר קבצי SVG לתמונות PNG",
    longDescription: "המירו גרפיקה וקטורית בפורמט SVG לתמונות PNG באיכות גבוהה.",
    category: "image",
    fromFormats: ["SVG"],
    toFormats: ["PNG"],
    icon: Image,
    keywords: ["SVG ל-PNG", "המרת SVG", "וקטור לתמונה"],
  },
  {
    id: "video-converter",
    name: "המרת פורמט וידאו",
    description: "המרה בין MP4, AVI, MOV, MKV, WEBM",
    longDescription: "המירו סרטונים בין כל הפורמטים הנפוצים. תומך ב-MP4, AVI, MOV, MKV ו-WEBM.",
    category: "video",
    fromFormats: ["MP4", "AVI", "MOV", "MKV", "WEBM"],
    toFormats: ["MP4", "AVI", "MOV", "MKV", "WEBM"],
    icon: ArrowLeftRight,
    popular: true,
    premium: true,
    keywords: ["המרת וידאו", "MP4 ל-AVI", "MOV ל-MP4"],
  },
  {
    id: "video-compressor",
    name: "דחיסת וידאו",
    description: "הקטנת משקל וידאו לשליחה קלה",
    longDescription: "דחסו סרטונים לגודל קטן יותר לשליחה ב-WhatsApp, מייל או העלאה לרשתות חברתיות.",
    category: "video",
    fromFormats: ["MP4", "MOV"],
    toFormats: ["MP4"],
    icon: Minimize2,
    premium: true,
    keywords: ["דחיסת וידאו", "הקטנת סרטון"],
    customComponent: "video-compressor",
  },
  {
    id: "audio-converter",
    name: "המרת פורמט אודיו",
    description: "המרה בין MP3, WAV, AAC, OGG, FLAC",
    longDescription: "המירו קבצי שמע בין כל הפורמטים הנפוצים. מ-MP3 ל-WAV, מ-FLAC ל-MP3, ועוד.",
    category: "audio",
    fromFormats: ["MP3", "WAV", "AAC", "OGG", "FLAC"],
    toFormats: ["MP3", "WAV", "AAC", "OGG", "FLAC"],
    icon: ArrowLeftRight,
    popular: true,
    keywords: ["המרת אודיו", "MP3 ל-WAV", "WAV ל-MP3"],
  },
  {
    id: "pdf-to-word",
    name: "PDF ל-Word",
    description: "המר מסמכי PDF לקבצי Word לעריכה",
    longDescription: "המירו מסמכי PDF לקבצי Word (DOCX) לעריכה נוחה. הכלי שומר על העיצוב המקורי.",
    category: "document",
    fromFormats: ["PDF"],
    toFormats: ["DOCX"],
    icon: FileText,
    popular: true,
    keywords: ["PDF ל-Word", "המרת PDF", "PDF לוורד"],
  },
  {
    id: "word-to-pdf",
    name: "Word ל-PDF",
    description: "המר מסמכי Word לפורמט PDF",
    longDescription: "המירו מסמכי Word (DOC, DOCX) לפורמט PDF אוניברסלי.",
    category: "document",
    fromFormats: ["DOCX", "DOC"],
    toFormats: ["PDF"],
    icon: FileText,
    keywords: ["Word ל-PDF", "המרת Word", "DOCX ל-PDF"],
  },
  {
    id: "merge-pdf",
    name: "מנהל PDF",
    description: "מזג, סדר מחדש, סובב והורד קבצי PDF",
    longDescription: "מנהל PDF מתקדם — העלו מספר קבצי PDF, סדרו את העמודים מחדש בגרירה, סובבו עמודים בודדים, ומזגו הכל לקובץ PDF אחד מסודר. מושלם לחוזים, דוחות וחשבוניות.",
    category: "document",
    fromFormats: ["PDF"],
    toFormats: ["PDF"],
    icon: FileArchive,
    keywords: ["מיזוג PDF", "סידור עמודים", "סיבוב PDF", "מנהל PDF"],
    customComponent: "pdf-manager",
  },
  {
    id: "text-tools",
    name: "כלי טקסט",
    description: "המרה בין טקסט, Markdown ו-HTML, ספירת מילים ועוד",
    longDescription: "כלי טקסט מתקדם: המירו בין פורמט טקסט רגיל, Markdown ו-HTML. כולל ספירת מילים ותווים, המרת אותיות, ניקוי רווחים ועוד.",
    category: "document",
    fromFormats: ["TXT", "MD", "HTML"],
    toFormats: ["TXT", "MD", "HTML"],
    icon: Type,
    keywords: ["כלי טקסט", "Markdown ל-HTML", "HTML ל-Markdown", "ספירת מילים"],
    customComponent: "text-tools",
  },
  {
    id: "ai-image-generator",
    name: "יצירת תמונות AI",
    description: "צרו תמונות מדהימות מטקסט באמצעות בינה מלאכותית",
    longDescription: "כלי יצירת תמונות מתקדם עם בינה מלאכותית. תארו את התמונה שאתם רוצים בטקסט חופשי, בחרו סגנון ויחס תמונה, וה-AI ייצור תמונה מקורית תוך שניות. זמין למנויי פרימיום בלבד.",
    category: "ai",
    fromFormats: [],
    toFormats: [],
    icon: Wand2,
    popular: true,
    premium: true,
    keywords: ["יצירת תמונות", "AI", "בינה מלאכותית", "תמונה מטקסט", "text to image"],
    customComponent: "ai-image-generator",
  },
];

/** Build a slug like "jpg-to-png" from format pair */
export function buildFormatSlug(from: string, to: string): string {
  return `${from.toLowerCase()}-to-${to.toLowerCase()}`;
}

/** Parse a slug like "jpg-to-png" into { from, to } */
export function parseFormatSlug(slug: string): { from: string; to: string } | null {
  const match = slug.match(/^(.+)-to-(.+)$/);
  if (!match) return null;
  return { from: normalizeFormat(match[1]), to: normalizeFormat(match[2]) };
}

/** Find a tool that supports a given from→to conversion */
export function getToolByFormatSlug(slug: string): { tool: Tool; from: string; to: string } | null {
  const parsed = parseFormatSlug(slug);
  if (!parsed) return null;

  const tool = tools.find(
    (t) =>
      t.fromFormats.includes(parsed.from) &&
      t.toFormats.includes(parsed.to) &&
      parsed.from !== parsed.to
  );

  if (!tool) return null;
  return { tool, from: parsed.from, to: parsed.to };
}

/** Get default slug for a tool (custom tools use their ID, conversion tools use from-to format) */
export function getDefaultSlug(tool: Tool): string {
  if (tool.customComponent) return tool.id;
  const from = tool.fromFormats[0];
  const to = tool.toFormats.find((f) => f !== from) || tool.toFormats[0];
  return buildFormatSlug(from, to);
}

/** Generate all valid from→to slugs for a tool */
export function getAllSlugsForTool(tool: Tool): string[] {
  const slugs: string[] = [];
  for (const from of tool.fromFormats) {
    for (const to of tool.toFormats) {
      if (from !== to) {
        slugs.push(buildFormatSlug(from, to));
      }
    }
  }
  return slugs;
}

export function getToolById(id: string): Tool | undefined {
  return tools.find((t) => t.id === id);
}

export function getToolsByCategory(category: ToolCategory): Tool[] {
  return tools.filter((t) => t.category === category);
}

export function getPopularTools(): Tool[] {
  return tools.filter((t) => t.popular);
}

export function getRelatedTools(tool: Tool): Tool[] {
  return tools.filter((t) => t.category === tool.category && t.id !== tool.id).slice(0, 3);
}
