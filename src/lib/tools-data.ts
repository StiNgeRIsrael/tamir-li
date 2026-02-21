import { Image, FileVideo, FileAudio, FileText, ArrowLeftRight, Minimize2, Hash, Palette, Type, FileArchive } from "lucide-react";

export interface Tool {
  id: string;
  slug: string;
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
}

export type ToolCategory = "image" | "video" | "audio" | "document";

export const categoryLabels: Record<ToolCategory, string> = {
  image: "תמונות",
  video: "וידאו",
  audio: "אודיו",
  document: "מסמכים",
};

export const categoryIcons: Record<ToolCategory, React.ComponentType<{ className?: string }>> = {
  image: Image,
  video: FileVideo,
  audio: FileAudio,
  document: FileText,
};

export const tools: Tool[] = [
  {
    id: "image-converter",
    slug: "hemrat-tmonot",
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
    slug: "dhisat-tmonot",
    name: "דחיסת תמונה",
    description: "הקטנת משקל תמונות בלי לפגוע באיכות",
    longDescription: "דחסו את התמונות שלכם וחסכו מקום אחסון ונתונים. הכלי שלנו מקטין את גודל הקובץ תוך שמירה על איכות מקסימלית, מושלם לאתרי אינטרנט, מיילים ורשתות חברתיות.",
    category: "image",
    fromFormats: ["JPG", "PNG", "WEBP"],
    toFormats: ["JPG", "PNG", "WEBP"],
    icon: Minimize2,
    popular: true,
    keywords: ["דחיסת תמונות", "הקטנת תמונה", "כיווץ תמונה", "הקטנת משקל תמונה"],
  },
  {
    id: "image-resizer",
    slug: "shinui-godl-tmona",
    name: "שינוי גודל תמונה",
    description: "שנה את הרזולוציה של התמונה בקלות",
    longDescription: "שנו את גודל התמונות שלכם לכל רזולוציה רצויה. מתאים להתאמת תמונות לרשתות חברתיות, אתרי אינטרנט, מצגות ועוד — בלי לפגוע באיכות.",
    category: "image",
    fromFormats: ["JPG", "PNG", "WEBP"],
    toFormats: ["JPG", "PNG", "WEBP"],
    icon: Hash,
    keywords: ["שינוי גודל תמונה", "שינוי רזולוציה", "הקטנת תמונה", "הגדלת תמונה"],
  },
  {
    id: "png-to-ico",
    slug: "png-le-ico",
    name: "PNG ל-ICO",
    description: "צור אייקונים לאתר או לאפליקציה",
    longDescription: "המירו תמונות PNG לפורמט ICO ליצירת אייקונים לאתרי אינטרנט (favicon) או לאפליקציות. הכלי תומך במגוון גדלים ויוצר אייקון מותאם בקלות.",
    category: "image",
    fromFormats: ["PNG"],
    toFormats: ["ICO"],
    icon: Palette,
    keywords: ["PNG ל-ICO", "יצירת favicon", "אייקון לאתר", "המרת PNG"],
  },
  {
    id: "svg-to-png",
    slug: "svg-le-png",
    name: "SVG ל-PNG",
    description: "המר קבצי SVG לתמונות PNG",
    longDescription: "המירו גרפיקה וקטורית בפורמט SVG לתמונות PNG באיכות גבוהה. מושלם למעצבים ומפתחים שצריכים גרסת רסטר של גרפיקה וקטורית.",
    category: "image",
    fromFormats: ["SVG"],
    toFormats: ["PNG"],
    icon: Image,
    keywords: ["SVG ל-PNG", "המרת SVG", "וקטור לתמונה", "המרת גרפיקה"],
  },
  {
    id: "video-converter",
    slug: "hemrat-video",
    name: "המרת פורמט וידאו",
    description: "המרה בין MP4, AVI, MOV, MKV, WEBM",
    longDescription: "המירו סרטונים בין כל הפורמטים הנפוצים. תומך ב-MP4, AVI, MOV, MKV ו-WEBM. מושלם להתאמת סרטונים לפלטפורמות שונות כמו YouTube, Instagram ו-TikTok.",
    category: "video",
    fromFormats: ["MP4", "AVI", "MOV", "MKV", "WEBM"],
    toFormats: ["MP4", "AVI", "MOV", "MKV", "WEBM"],
    icon: ArrowLeftRight,
    popular: true,
    premium: true,
    keywords: ["המרת וידאו", "MP4 ל-AVI", "MOV ל-MP4", "המרת סרטונים"],
  },
  {
    id: "video-compressor",
    slug: "dhisat-video",
    name: "דחיסת וידאו",
    description: "הקטנת משקל וידאו לשליחה קלה",
    longDescription: "דחסו סרטונים לגודל קטן יותר לשליחה ב-WhatsApp, מייל או העלאה לרשתות חברתיות. הכלי שומר על איכות מקסימלית תוך הפחתה משמעותית בגודל הקובץ.",
    category: "video",
    fromFormats: ["MP4", "MOV"],
    toFormats: ["MP4"],
    icon: Minimize2,
    premium: true,
    keywords: ["דחיסת וידאו", "הקטנת סרטון", "כיווץ וידאו", "הקטנת משקל סרטון"],
  },
  {
    id: "audio-converter",
    slug: "hemrat-audio",
    name: "המרת פורמט אודיו",
    description: "המרה בין MP3, WAV, AAC, OGG, FLAC",
    longDescription: "המירו קבצי שמע בין כל הפורמטים הנפוצים. מ-MP3 ל-WAV, מ-FLAC ל-MP3, ועוד. מושלם למוזיקאים, פודקאסטרים וכל מי שעובד עם קבצי אודיו.",
    category: "audio",
    fromFormats: ["MP3", "WAV", "AAC", "OGG", "FLAC"],
    toFormats: ["MP3", "WAV", "AAC", "OGG", "FLAC"],
    icon: ArrowLeftRight,
    popular: true,
    keywords: ["המרת אודיו", "MP3 ל-WAV", "WAV ל-MP3", "המרת קבצי שמע"],
  },
  {
    id: "pdf-to-word",
    slug: "pdf-le-word",
    name: "PDF ל-Word",
    description: "המר מסמכי PDF לקבצי Word לעריכה",
    longDescription: "המירו מסמכי PDF לקבצי Word (DOCX) לעריכה נוחה. הכלי שומר על העיצוב המקורי, כולל טבלאות, תמונות ועיצוב טקסט, ומאפשר לכם לערוך את המסמך בקלות.",
    category: "document",
    fromFormats: ["PDF"],
    toFormats: ["DOCX"],
    icon: FileText,
    popular: true,
    keywords: ["PDF ל-Word", "המרת PDF", "PDF לוורד", "עריכת PDF"],
  },
  {
    id: "word-to-pdf",
    slug: "word-le-pdf",
    name: "Word ל-PDF",
    description: "המר מסמכי Word לפורמט PDF",
    longDescription: "המירו מסמכי Word (DOC, DOCX) לפורמט PDF אוניברסלי. מושלם לשליחת מסמכים רשמיים, קורות חיים, חוזים ומסמכים שצריכים להישמר בפורמט קבוע.",
    category: "document",
    fromFormats: ["DOCX", "DOC"],
    toFormats: ["PDF"],
    icon: FileText,
    keywords: ["Word ל-PDF", "המרת Word", "DOCX ל-PDF", "המרת מסמכים"],
  },
  {
    id: "merge-pdf",
    slug: "mizug-pdf",
    name: "מיזוג PDF",
    description: "חבר מספר קבצי PDF לקובץ אחד",
    longDescription: "חברו מספר קבצי PDF לקובץ אחד בסדר שתבחרו. מושלם לאיחוד מסמכים, דוחות, חשבוניות ועוד לקובץ PDF אחד מסודר.",
    category: "document",
    fromFormats: ["PDF"],
    toFormats: ["PDF"],
    icon: FileArchive,
    keywords: ["מיזוג PDF", "חיבור PDF", "איחוד PDF", "צירוף קבצי PDF"],
  },
  {
    id: "text-tools",
    slug: "kley-text",
    name: "כלי טקסט",
    description: "המרת אותיות, ספירת מילים, ועוד",
    longDescription: "כלי טקסט שימושיים הכוללים המרת אותיות גדולות/קטנות, ספירת מילים ותווים, הסרת רווחים כפולים ועוד. מושלם לעורכי תוכן, כותבים ומתרגמים.",
    category: "document",
    fromFormats: ["TXT"],
    toFormats: ["TXT"],
    icon: Type,
    keywords: ["כלי טקסט", "ספירת מילים", "המרת אותיות", "עריכת טקסט"],
  },
];

export function getToolById(id: string): Tool | undefined {
  return tools.find((t) => t.id === id);
}

export function getToolBySlug(slug: string): Tool | undefined {
  return tools.find((t) => t.slug === slug);
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
