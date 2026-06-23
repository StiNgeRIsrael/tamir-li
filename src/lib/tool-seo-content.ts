import type { Locale } from "@/lib/i18n";

export interface ToolFaq {
  q: string;
  a: string;
}

export interface FormatComparisonRow {
  format: string;
  bestFor: string;
  size: string;
  quality: string;
}

export interface ToolSeoContent {
  faqs: ToolFaq[];
  formatComparison?: FormatComparisonRow[];
  comparisonHeaders?: { format: string; bestFor: string; size: string; quality: string };
}

type LocalizedContent = Record<string, ToolSeoContent>;

const he: LocalizedContent = {
  "image-converter": {
    comparisonHeaders: { format: "פורמט", bestFor: "מתאים ל", size: "גודל", quality: "איכות" },
    formatComparison: [
      { format: "JPG", bestFor: "תמונות, אתרים, מייל", size: "קטן", quality: "טובה (דחיסה עם אובדן)" },
      { format: "PNG", bestFor: "גרפיקה, שקיפות, לוגואים", size: "בינוני–גדול", quality: "מלאה (ללא אובדן)" },
      { format: "WEBP", bestFor: "אתרים מודרניים", size: "קטן מאוד", quality: "מצוינת" },
      { format: "GIF", bestFor: "אנימציות קצרות", size: "משתנה", quality: "256 צבעים" },
    ],
    faqs: [
      { q: "מה ההבדל בין JPG ל-PNG?", a: "JPG דוחס עם אובדן איכות ומתאים לתמונות. PNG שומר על איכות מלאה ותומך בשקיפות — מצוין ללוגואים וגרפיקה." },
      { q: "האם ההמרה פוגעת באיכות?", a: "המרה ל-PNG או TIFF שומרת על איכות מלאה. המרה ל-JPG או WEBP עשויה לדחוס מעט — אפשר לבחור פורמט לפי השימוש." },
      { q: "כמה קבצים אפשר להמיר בבת אחת?", a: "ניתן להעלות מספר קבצים ולהמיר אותם ברצף. בתוכנית החינמית — עד 5 המרות ביום." },
    ],
  },
  "image-compressor": {
    faqs: [
      { q: "כמה אפשר לדחוס תמונה?", a: "תלוי בפורמט המקורי. JPG ו-WEBP ניתנים לדחיסה משמעותית; PNG פחות — אך עדיין ניתן להקטין משקל." },
      { q: "האם הדחיסה פוגעת באיכות?", a: "הכלי מאזן בין גודל לאיכות. לרוב האתרים, דחיסה בינונית כמעט בלתי מורגשת לעין." },
      { q: "לאיזה פורמט כדאי לדחוס?", a: "לתמונות באתר — WEBP או JPG. לגרפיקה עם שקיפות — PNG דחוס." },
    ],
  },
  "image-resizer": {
    faqs: [
      { q: "האם שינוי גודל פוגע באיכות?", a: "הקטנה (downscale) שומרת על איכות טובה. הגדלה עלולה לטשטש — עדיף להתחיל מקובץ גדול יותר." },
      { q: "לאילו מידות אפשר לשנות?", a: "ניתן להזין רוחב וגובה בפיקסלים או לבחור יחס שמירה. מתאים לאייקונים, רשתות חברתיות ואתרים." },
      { q: "אילו פורמטים נתמכים?", a: "JPG, PNG ו-WEBP — הפלט בפורמט שתבחרו." },
    ],
  },
  "video-converter": {
    comparisonHeaders: { format: "פורמט", bestFor: "מתאים ל", size: "גודל", quality: "איכות" },
    formatComparison: [
      { format: "MP4", bestFor: "יוטיוב, רשתות, מכשירים", size: "בינוני", quality: "מצוינת (H.264/H.265)" },
      { format: "WEBM", bestFor: "אתרים, Chrome", size: "קטן", quality: "טובה" },
      { format: "MOV", bestFor: "עריכה ב-Mac", size: "גדול", quality: "מצוינת" },
      { format: "AVI", bestFor: "תאימות ישנה", size: "גדול", quality: "טובה" },
    ],
    faqs: [
      { q: "איזה פורמט וידאו הכי נפוץ?", a: "MP4 (H.264) הוא הסטנדרט לרוב הפלטפורמות — יוטיוב, וואטסאפ, אינסטגרם ומכשירים ניידים." },
      { q: "כמה זמן לוקחת המרת וידאו?", a: "תלוי באורך ובגודל הקובץ. סרטונים קצרים (עד דקה) מומרים תוך שניות עד דקות ספורות." },
      { q: "האם יש מגבלת גודל?", a: "בתוכנית החינמית — עד 50MB לקובץ. בפרימיום — עד 500MB." },
    ],
  },
  "audio-converter": {
    comparisonHeaders: { format: "פורמט", bestFor: "מתאים ל", size: "גודל", quality: "איכות" },
    formatComparison: [
      { format: "MP3", bestFor: "האזנה, שיתוף", size: "קטן", quality: "טובה (דחיסה עם אובדן)" },
      { format: "WAV", bestFor: "עריכה, אולפן", size: "גדול", quality: "מלאה (ללא אובדן)" },
      { format: "FLAC", bestFor: "אוספי מוזיקה", size: "בינוני", quality: "מלאה (דחיסה ללא אובדן)" },
      { format: "AAC", bestFor: "אייפון, סטרימינג", size: "קטן", quality: "טובה מאוד" },
    ],
    faqs: [
      { q: "MP3 או WAV — מה לבחור?", a: "WAV לאיכות מלאה בעריכה. MP3 לשיתוף והאזנה יומיומית — קובץ קטן יותר." },
      { q: "האם אפשר להמיר שירים מיוטיוב?", a: "יש להעלות קובץ שמע שכבר הורדתם. אנחנו לא מורידים תוכן מיוטיוב." },
      { q: "האם נשמרים מטא-דאטה (שם אמן, אלבום)?", a: "רוב המטא-דאטה נשמר בהמרה בין פורמטים נפוצים." },
    ],
  },
  "pdf-to-word": {
    faqs: [
      { q: "האם העיצוב נשמר בהמרה?", a: "הכלי שומר על מבנה המסמך, כותרות וטבלאות. עיצוב מורכב מאוד עשוי לדרוש התאמות קלות ב-Word." },
      { q: "איזה גרסת Word נתמכת?", a: "הפלט הוא DOCX — תואם ל-Microsoft Word 2007 ומעלה, Google Docs ו-LibreOffice." },
      { q: "האם אפשר להמיר PDF סרוק?", a: "PDF סרוק (תמונה) דורש OCR. לקבצים סרוקים בעברית — נסו את כלי ה-OCR שלנו." },
    ],
  },
  "word-to-pdf": {
    faqs: [
      { q: "למה להמיר Word ל-PDF?", a: "PDF שומר על עיצוב קבוע בכל מכשיר — מושלם לשליחה, הדפסה וחתימה דיגיטלית." },
      { q: "האם גופנים נשמרים?", a: "כן — הגופנים מוטמעים ב-PDF כך שהמסמך נראה זהה בכל מקום." },
      { q: "DOC או DOCX?", a: "שני הפורמטים נתמכים. DOCX מומלץ לתוצאה מיטבית." },
    ],
  },
  "merge-pdf": {
    faqs: [
      { q: "איך ממזגים כמה קבצי PDF?", a: "העלו את כל הקבצים, סדרו את העמודים בגרירה, ולחצו מיזוג — תקבלו PDF אחד." },
      { q: "האם אפשר לסובב עמודים?", a: "כן — ניתן לסובב עמודים בודדים לפני ההורדה." },
      { q: "האם יש מגבלת קבצים?", a: "בתוכנית החינמית — עד 5 פעולות ביום. בפרימיום — ללא הגבלה." },
    ],
  },
  "text-tools": {
    faqs: [
      { q: "אילו פורמטי טקסט נתמכים?", a: "TXT, Markdown ו-HTML — עם המרה דו-כיוונית ביניהם." },
      { q: "האם יש ספירת מילים?", a: "כן — הכלי מציג מספר מילים ותווים בזמן אמת." },
      { q: "האם העיצוב נשמר בהמרה?", a: "המרה ל-HTML שומרת על מבנה בסיסי; עיצוב מורכב עשוי לדרוש התאמות." },
    ],
  },
};

const en: LocalizedContent = {
  "image-converter": {
    comparisonHeaders: { format: "Format", bestFor: "Best for", size: "Size", quality: "Quality" },
    formatComparison: [
      { format: "JPG", bestFor: "Photos, web, email", size: "Small", quality: "Good (lossy)" },
      { format: "PNG", bestFor: "Graphics, transparency", size: "Medium–large", quality: "Lossless" },
      { format: "WEBP", bestFor: "Modern websites", size: "Very small", quality: "Excellent" },
      { format: "GIF", bestFor: "Short animations", size: "Varies", quality: "256 colors" },
    ],
    faqs: [
      { q: "What's the difference between JPG and PNG?", a: "JPG uses lossy compression — great for photos. PNG is lossless with transparency — ideal for logos and graphics." },
      { q: "Does conversion reduce quality?", a: "Converting to PNG or TIFF preserves full quality. JPG or WEBP may compress slightly — choose based on your use case." },
      { q: "How many files can I convert at once?", a: "Upload multiple files and convert in batch. Free plan: up to 5 conversions per day." },
    ],
  },
  "image-compressor": {
    faqs: [
      { q: "How much can I compress an image?", a: "Depends on the source format. JPG and WEBP compress significantly; PNG less so but can still be reduced." },
      { q: "Will compression hurt quality?", a: "The tool balances size and quality. For most websites, moderate compression is barely noticeable." },
      { q: "Which format should I compress to?", a: "For web photos — WEBP or JPG. For graphics with transparency — compressed PNG." },
    ],
  },
  "image-resizer": {
    faqs: [
      { q: "Does resizing reduce quality?", a: "Downscaling keeps good quality. Upscaling may blur — start from a larger source when possible." },
      { q: "What dimensions can I set?", a: "Enter width and height in pixels or keep aspect ratio. Great for icons, social posts and websites." },
      { q: "Which formats are supported?", a: "JPG, PNG and WEBP — output in your chosen format." },
    ],
  },
  "video-converter": {
    comparisonHeaders: { format: "Format", bestFor: "Best for", size: "Size", quality: "Quality" },
    formatComparison: [
      { format: "MP4", bestFor: "YouTube, social, devices", size: "Medium", quality: "Excellent (H.264/H.265)" },
      { format: "WEBM", bestFor: "Web, Chrome", size: "Small", quality: "Good" },
      { format: "MOV", bestFor: "Mac editing", size: "Large", quality: "Excellent" },
      { format: "AVI", bestFor: "Legacy compatibility", size: "Large", quality: "Good" },
    ],
    faqs: [
      { q: "Which video format is most common?", a: "MP4 (H.264) is the standard for YouTube, WhatsApp, Instagram and mobile devices." },
      { q: "How long does video conversion take?", a: "Depends on length and file size. Short clips (under a minute) convert in seconds to a few minutes." },
      { q: "Is there a file size limit?", a: "Free plan: up to 50MB per file. Premium: up to 500MB." },
    ],
  },
  "audio-converter": {
    comparisonHeaders: { format: "Format", bestFor: "Best for", size: "Size", quality: "Quality" },
    formatComparison: [
      { format: "MP3", bestFor: "Listening, sharing", size: "Small", quality: "Good (lossy)" },
      { format: "WAV", bestFor: "Editing, studio", size: "Large", quality: "Lossless" },
      { format: "FLAC", bestFor: "Music collections", size: "Medium", quality: "Lossless" },
      { format: "AAC", bestFor: "iPhone, streaming", size: "Small", quality: "Very good" },
    ],
    faqs: [
      { q: "MP3 or WAV — which to choose?", a: "WAV for full quality editing. MP3 for everyday sharing — smaller file size." },
      { q: "Can I convert songs from YouTube?", a: "Upload an audio file you already have. We don't download content from YouTube." },
      { q: "Is metadata (artist, album) preserved?", a: "Most metadata is preserved when converting between common formats." },
    ],
  },
  "pdf-to-word": {
    faqs: [
      { q: "Is formatting preserved?", a: "The tool keeps document structure, headings and tables. Very complex layouts may need minor tweaks in Word." },
      { q: "Which Word version is supported?", a: "Output is DOCX — compatible with Microsoft Word 2007+, Google Docs and LibreOffice." },
      { q: "Can I convert scanned PDFs?", a: "Scanned PDFs (images) need OCR. For Hebrew scanned documents, try our OCR tool." },
    ],
  },
  "word-to-pdf": {
    faqs: [
      { q: "Why convert Word to PDF?", a: "PDF locks layout on any device — perfect for sending, printing and digital signatures." },
      { q: "Are fonts preserved?", a: "Yes — fonts are embedded in the PDF so the document looks identical everywhere." },
      { q: "DOC or DOCX?", a: "Both formats are supported. DOCX is recommended for best results." },
    ],
  },
  "merge-pdf": {
    faqs: [
      { q: "How do I merge PDF files?", a: "Upload all files, reorder pages by drag-and-drop, then merge — you get one PDF." },
      { q: "Can I rotate pages?", a: "Yes — rotate individual pages before downloading." },
      { q: "Is there a file limit?", a: "Free plan: up to 5 operations per day. Premium: unlimited." },
    ],
  },
  "text-tools": {
    faqs: [
      { q: "Which text formats are supported?", a: "TXT, Markdown and HTML — with two-way conversion between them." },
      { q: "Is there a word count?", a: "Yes — the tool shows word and character counts in real time." },
      { q: "Is formatting preserved?", a: "HTML conversion keeps basic structure; complex styling may need tweaks." },
    ],
  },
};

const es: LocalizedContent = {
  "image-converter": {
    comparisonHeaders: { format: "Formato", bestFor: "Ideal para", size: "Tamaño", quality: "Calidad" },
    formatComparison: [
      { format: "JPG", bestFor: "Fotos, web, correo", size: "Pequeño", quality: "Buena (con pérdida)" },
      { format: "PNG", bestFor: "Gráficos, transparencia", size: "Mediano–grande", quality: "Sin pérdida" },
      { format: "WEBP", bestFor: "Sitios web modernos", size: "Muy pequeño", quality: "Excelente" },
      { format: "GIF", bestFor: "Animaciones cortas", size: "Variable", quality: "256 colores" },
    ],
    faqs: [
      { q: "¿Cuál es la diferencia entre JPG y PNG?", a: "JPG usa compresión con pérdida — ideal para fotos. PNG es sin pérdida y admite transparencia — perfecto para logotipos y gráficos." },
      { q: "¿La conversión reduce la calidad?", a: "Convertir a PNG o TIFF conserva la calidad completa. JPG o WEBP pueden comprimir ligeramente — elige según tu uso." },
      { q: "¿Cuántos archivos puedo convertir a la vez?", a: "Sube varios archivos y conviértelos en lote. Plan gratuito: hasta 5 conversiones al día." },
    ],
  },
  "image-compressor": {
    faqs: [
      { q: "¿Cuánto puedo comprimir una imagen?", a: "Depende del formato original. JPG y WEBP se comprimen significativamente; PNG menos, pero aún se puede reducir el peso." },
      { q: "¿La compresión afecta la calidad?", a: "La herramienta equilibra tamaño y calidad. Para la mayoría de sitios web, una compresión moderada apenas se nota." },
      { q: "¿A qué formato conviene comprimir?", a: "Para fotos web — WEBP o JPG. Para gráficos con transparencia — PNG comprimido." },
    ],
  },
};

const fr: LocalizedContent = {
  "image-converter": {
    comparisonHeaders: { format: "Format", bestFor: "Idéal pour", size: "Taille", quality: "Qualité" },
    formatComparison: [
      { format: "JPG", bestFor: "Photos, web, e-mail", size: "Petit", quality: "Bonne (avec perte)" },
      { format: "PNG", bestFor: "Graphiques, transparence", size: "Moyen–grand", quality: "Sans perte" },
      { format: "WEBP", bestFor: "Sites web modernes", size: "Très petit", quality: "Excellente" },
      { format: "GIF", bestFor: "Courtes animations", size: "Variable", quality: "256 couleurs" },
    ],
    faqs: [
      { q: "Quelle est la différence entre JPG et PNG ?", a: "JPG utilise une compression avec perte — idéal pour les photos. PNG est sans perte et prend en charge la transparence — parfait pour les logos et graphiques." },
      { q: "La conversion réduit-elle la qualité ?", a: "Convertir en PNG ou TIFF conserve la qualité complète. JPG ou WEBP peuvent compresser légèrement — choisissez selon votre usage." },
      { q: "Combien de fichiers puis-je convertir à la fois ?", a: "Téléversez plusieurs fichiers et convertissez-les par lot. Offre gratuite : jusqu'à 5 conversions par jour." },
    ],
  },
  "image-compressor": {
    faqs: [
      { q: "De combien puis-je compresser une image ?", a: "Cela dépend du format d'origine. JPG et WEBP se compressent nettement ; PNG moins, mais le poids peut quand même être réduit." },
      { q: "La compression affecte-t-elle la qualité ?", a: "L'outil équilibre taille et qualité. Pour la plupart des sites web, une compression modérée reste à peine visible." },
      { q: "Vers quel format compresser ?", a: "Pour les photos web — WEBP ou JPG. Pour les graphiques avec transparence — PNG compressé." },
    ],
  },
};

const ru: LocalizedContent = {
  "image-converter": {
    comparisonHeaders: { format: "Формат", bestFor: "Подходит для", size: "Размер", quality: "Качество" },
    formatComparison: [
      { format: "JPG", bestFor: "Фото, веб, почта", size: "Малый", quality: "Хорошее (с потерями)" },
      { format: "PNG", bestFor: "Графика, прозрачность", size: "Средний–большой", quality: "Без потерь" },
      { format: "WEBP", bestFor: "Современные сайты", size: "Очень малый", quality: "Отличное" },
      { format: "GIF", bestFor: "Короткие анимации", size: "Разный", quality: "256 цветов" },
    ],
    faqs: [
      { q: "В чём разница между JPG и PNG?", a: "JPG использует сжатие с потерями — идеально для фотографий. PNG без потерь и поддерживает прозрачность — отлично для логотипов и графики." },
      { q: "Снижает ли конвертация качество?", a: "Конвертация в PNG или TIFF сохраняет полное качество. JPG или WEBP могут немного сжать — выбирайте по задаче." },
      { q: "Сколько файлов можно конвертировать за раз?", a: "Загрузите несколько файлов и конвертируйте пакетом. Бесплатный план: до 5 конвертаций в день." },
    ],
  },
  "image-compressor": {
    faqs: [
      { q: "Насколько можно сжать изображение?", a: "Зависит от исходного формата. JPG и WEBP сжимаются значительно; PNG меньше, но размер всё равно можно уменьшить." },
      { q: "Влияет ли сжатие на качество?", a: "Инструмент балансирует размер и качество. Для большинства сайтов умеренное сжатие почти незаметно." },
      { q: "В какой формат сжимать?", a: "Для веб-фото — WEBP или JPG. Для графики с прозрачностью — сжатый PNG." },
    ],
  },
};

const de: LocalizedContent = {
  "image-converter": {
    comparisonHeaders: { format: "Format", bestFor: "Ideal für", size: "Größe", quality: "Qualität" },
    formatComparison: [
      { format: "JPG", bestFor: "Fotos, Web, E-Mail", size: "Klein", quality: "Gut (verlustbehaftet)" },
      { format: "PNG", bestFor: "Grafiken, Transparenz", size: "Mittel–groß", quality: "Verlustfrei" },
      { format: "WEBP", bestFor: "Moderne Websites", size: "Sehr klein", quality: "Ausgezeichnet" },
      { format: "GIF", bestFor: "Kurze Animationen", size: "Variiert", quality: "256 Farben" },
    ],
    faqs: [
      { q: "Was ist der Unterschied zwischen JPG und PNG?", a: "JPG verwendet verlustbehaftete Kompression — ideal für Fotos. PNG ist verlustfrei und unterstützt Transparenz — perfekt für Logos und Grafiken." },
      { q: "Reduziert die Konvertierung die Qualität?", a: "Die Konvertierung in PNG oder TIFF behält die volle Qualität. JPG oder WEBP können leicht komprimieren — wählen Sie je nach Verwendung." },
      { q: "Wie viele Dateien kann ich gleichzeitig konvertieren?", a: "Laden Sie mehrere Dateien hoch und konvertieren Sie sie im Stapel. Kostenloser Plan: bis zu 5 Konversionen pro Tag." },
    ],
  },
  "image-compressor": {
    faqs: [
      { q: "Wie stark kann ich ein Bild komprimieren?", a: "Hängt vom Quellformat ab. JPG und WEBP lassen sich deutlich komprimieren; PNG weniger, aber die Dateigröße kann trotzdem reduziert werden." },
      { q: "Beeinträchtigt die Kompression die Qualität?", a: "Das Tool balanciert Größe und Qualität. Für die meisten Websites ist moderate Kompression kaum sichtbar." },
      { q: "In welches Format soll ich komprimieren?", a: "Für Webfotos — WEBP oder JPG. Für Grafiken mit Transparenz — komprimiertes PNG." },
    ],
  },
};

const it: LocalizedContent = {
  "image-converter": {
    comparisonHeaders: { format: "Formato", bestFor: "Ideale per", size: "Dimensione", quality: "Qualità" },
    formatComparison: [
      { format: "JPG", bestFor: "Foto, web, e-mail", size: "Piccolo", quality: "Buona (con perdita)" },
      { format: "PNG", bestFor: "Grafica, trasparenza", size: "Medio–grande", quality: "Senza perdita" },
      { format: "WEBP", bestFor: "Siti web moderni", size: "Molto piccolo", quality: "Eccellente" },
      { format: "GIF", bestFor: "Animazioni brevi", size: "Variabile", quality: "256 colori" },
    ],
    faqs: [
      { q: "Qual è la differenza tra JPG e PNG?", a: "JPG usa la compressione con perdita — ideale per le foto. PNG è senza perdita e supporta la trasparenza — perfetto per loghi e grafica." },
      { q: "La conversione riduce la qualità?", a: "La conversione in PNG o TIFF conserva la qualità completa. JPG o WEBP possono comprimere leggermente — scegli in base all'uso." },
      { q: "Quanti file posso convertire contemporaneamente?", a: "Carica più file e convertili in batch. Piano gratuito: fino a 5 conversioni al giorno." },
    ],
  },
  "image-compressor": {
    faqs: [
      { q: "Quanto posso comprimere un'immagine?", a: "Dipende dal formato originale. JPG e WEBP si comprimono significativamente; PNG meno, ma il peso può comunque essere ridotto." },
      { q: "La compressione riduce la qualità?", a: "Lo strumento bilancia dimensione e qualità. Per la maggior parte dei siti web, una compressione moderata è appena percettibile." },
      { q: "In quale formato comprimere?", a: "Per foto web — WEBP o JPG. Per grafica con trasparenza — PNG compresso." },
    ],
  },
};

const byLocale: Partial<Record<Locale, LocalizedContent>> = { he, en, es, ru, fr, de, it };

/** Top-tool SEO blocks (FAQ + optional format comparison). Falls back to English. */
export function getToolSeoContent(toolId: string, locale: Locale): ToolSeoContent | null {
  const content = byLocale[locale]?.[toolId] ?? en[toolId];
  return content ?? null;
}

export const TOP_TOOL_IDS = Object.keys(en);
