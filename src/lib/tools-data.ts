import { Image, FileVideo, FileAudio, FileText, ArrowLeftRight, Minimize2, Hash, Palette, Type, FileArchive } from "lucide-react";

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  fromFormats: string[];
  toFormats: string[];
  icon: React.ComponentType<{ className?: string }>;
  popular?: boolean;
  premium?: boolean;
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
    name: "המרת פורמט תמונה",
    description: "המרה בין JPG, PNG, WEBP, GIF, BMP, TIFF ועוד",
    category: "image",
    fromFormats: ["JPG", "PNG", "WEBP", "GIF", "BMP", "TIFF", "SVG"],
    toFormats: ["JPG", "PNG", "WEBP", "GIF", "BMP", "TIFF"],
    icon: ArrowLeftRight,
    popular: true,
  },
  {
    id: "image-compressor",
    name: "דחיסת תמונה",
    description: "הקטנת משקל תמונות בלי לפגוע באיכות",
    category: "image",
    fromFormats: ["JPG", "PNG", "WEBP"],
    toFormats: ["JPG", "PNG", "WEBP"],
    icon: Minimize2,
    popular: true,
  },
  {
    id: "image-resizer",
    name: "שינוי גודל תמונה",
    description: "שנה את הרזולוציה של התמונה בקלות",
    category: "image",
    fromFormats: ["JPG", "PNG", "WEBP"],
    toFormats: ["JPG", "PNG", "WEBP"],
    icon: Hash,
  },
  {
    id: "png-to-ico",
    name: "PNG ל-ICO",
    description: "צור אייקונים לאתר או לאפליקציה",
    category: "image",
    fromFormats: ["PNG"],
    toFormats: ["ICO"],
    icon: Palette,
  },
  {
    id: "svg-to-png",
    name: "SVG ל-PNG",
    description: "המר קבצי SVG לתמונות PNG",
    category: "image",
    fromFormats: ["SVG"],
    toFormats: ["PNG"],
    icon: Image,
  },
  {
    id: "video-converter",
    name: "המרת פורמט וידאו",
    description: "המרה בין MP4, AVI, MOV, MKV, WEBM",
    category: "video",
    fromFormats: ["MP4", "AVI", "MOV", "MKV", "WEBM"],
    toFormats: ["MP4", "AVI", "MOV", "MKV", "WEBM"],
    icon: ArrowLeftRight,
    popular: true,
    premium: true,
  },
  {
    id: "video-compressor",
    name: "דחיסת וידאו",
    description: "הקטנת משקל וידאו לשליחה קלה",
    category: "video",
    fromFormats: ["MP4", "MOV"],
    toFormats: ["MP4"],
    icon: Minimize2,
    premium: true,
  },
  {
    id: "audio-converter",
    name: "המרת פורמט אודיו",
    description: "המרה בין MP3, WAV, AAC, OGG, FLAC",
    category: "audio",
    fromFormats: ["MP3", "WAV", "AAC", "OGG", "FLAC"],
    toFormats: ["MP3", "WAV", "AAC", "OGG", "FLAC"],
    icon: ArrowLeftRight,
    popular: true,
  },
  {
    id: "pdf-to-word",
    name: "PDF ל-Word",
    description: "המר מסמכי PDF לקבצי Word לעריכה",
    category: "document",
    fromFormats: ["PDF"],
    toFormats: ["DOCX"],
    icon: FileText,
    popular: true,
  },
  {
    id: "word-to-pdf",
    name: "Word ל-PDF",
    description: "המר מסמכי Word לפורמט PDF",
    category: "document",
    fromFormats: ["DOCX", "DOC"],
    toFormats: ["PDF"],
    icon: FileText,
  },
  {
    id: "merge-pdf",
    name: "מיזוג PDF",
    description: "חבר מספר קבצי PDF לקובץ אחד",
    category: "document",
    fromFormats: ["PDF"],
    toFormats: ["PDF"],
    icon: FileArchive,
  },
  {
    id: "text-tools",
    name: "כלי טקסט",
    description: "המרת אותיות, ספירת מילים, ועוד",
    category: "document",
    fromFormats: ["TXT"],
    toFormats: ["TXT"],
    icon: Type,
  },
];

export function getToolById(id: string): Tool | undefined {
  return tools.find((t) => t.id === id);
}

export function getToolsByCategory(category: ToolCategory): Tool[] {
  return tools.filter((t) => t.category === category);
}

export function getPopularTools(): Tool[] {
  return tools.filter((t) => t.popular);
}
