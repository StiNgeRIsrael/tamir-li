/** ידועים לשרת — חייבים להתאים ל־src/lib/tools-data.ts (שדה id) */
export const KNOWN_TOOL_IDS = [
  'image-converter',
  'image-compressor',
  'image-resizer',
  'png-to-ico',
  'svg-to-png',
  'video-converter',
  'video-compressor',
  'audio-converter',
  'pdf-to-word',
  'word-to-pdf',
  'merge-pdf',
  'text-tools',
  'ai-image-generator',
] as const;

export type KnownToolId = (typeof KNOWN_TOOL_IDS)[number];

/** תוויות באנגלית ללוח הניהול בלבד */
export const TOOL_CATALOG_META: Record<
  KnownToolId,
  { category: string; label: string; defaultPremium: boolean }
> = {
  'image-converter': { category: 'image', label: 'Image format converter', defaultPremium: false },
  'image-compressor': { category: 'image', label: 'Image compressor', defaultPremium: false },
  'image-resizer': { category: 'image', label: 'Image resizer', defaultPremium: false },
  'png-to-ico': { category: 'image', label: 'PNG to ICO', defaultPremium: false },
  'svg-to-png': { category: 'image', label: 'SVG to PNG', defaultPremium: false },
  'video-converter': { category: 'video', label: 'Video converter', defaultPremium: true },
  'video-compressor': { category: 'video', label: 'Video compressor', defaultPremium: true },
  'audio-converter': { category: 'audio', label: 'Audio converter', defaultPremium: false },
  'pdf-to-word': { category: 'document', label: 'PDF to Word', defaultPremium: false },
  'word-to-pdf': { category: 'document', label: 'Word to PDF', defaultPremium: false },
  'merge-pdf': { category: 'document', label: 'PDF manager', defaultPremium: false },
  'text-tools': { category: 'document', label: 'Text tools', defaultPremium: false },
  'ai-image-generator': { category: 'ai', label: 'AI image generator', defaultPremium: true },
};
