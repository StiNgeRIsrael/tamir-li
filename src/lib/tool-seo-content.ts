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
  /** 40–60 word direct answer for featured snippets (optional; derived from FAQs if absent). */
  directAnswer?: string;
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
  "jpg-to-png": {
    directAnswer:
      "המרת JPG ל-PNG שומרת על איכות מלאה ומוסיפה תמיכה בשקיפות — אידיאלי ללוגואים, אייקונים וגרפיקה לאתר. העלו JPG, לחצו המרה והורידו PNG — בדפדפן, בלי שמירה בשרת.",
    faqs: [
      { q: "מתי כדאי להמיר JPG ל-PNG?", a: "כשצריך שקיפות, קווים חדים או גרפיקה עם טקסט. לתמונות צילום — JPG עדיין קטן יותר." },
      { q: "האם איכות התמונה נשמרת?", a: "כן — PNG הוא פורמט ללא אובדן. המרה מ-JPG לא תוסיף פרטים שאבדו בדחיסה המקורית." },
      { q: "האם הקובץ יגדל?", a: "בדרך כלל כן — PNG גדול מ-JPG. מומלץ לגרפיקה עם שקיפות, לא לגלריות צילום." },
    ],
  },
  "png-to-jpg": {
    directAnswer:
      "המרת PNG ל-JPG מקטינה משמעותית את גודל הקובץ — מצוין לשיתוף במייל, רשתות חברתיות ואתרים. שקיפות תוחלף ברקע לבן. העלו PNG והורידו JPG תוך שניות.",
    faqs: [
      { q: "האם השקיפות נשמרת?", a: "לא — JPG לא תומך בשקיפות. אזורים שקופים יהפכו לרקע לבן (או צבע אחיד)." },
      { q: "כמה הקובץ יקטן?", a: "לרוב 50%–80% — תלוי בתוכן התמונה. גרפיקה עם הרבה צבעים אחידים מתדחסת יותר." },
      { q: "האם מתאים ללוגו?", a: "רק אם אין צורך בשקיפות. ללוגואים — השאירו PNG או WEBP." },
    ],
  },
  "webp-to-jpg": {
    directAnswer:
      "WEBP חוסך משקל, אבל לא כל תוכנה תומכת בו. המרה ל-JPG מבטיחה תאימות מלאה — Outlook, תוכנות ישנות ומדפסות. העלו WEBP והורידו JPG מיד.",
    faqs: [
      { q: "למה להמיר WEBP ל-JPG?", a: "JPG נתמך בכל מכשיר ותוכנה — מושלם לשליחה ללקוחות, מערכות CRM או תוכנות שלא קוראות WEBP." },
      { q: "האם איכות נפגעת?", a: "JPG דוחס עם אובדן קל — לרוב בלתי מורגש לתמונות ולשיתוף יומיומי." },
      { q: "האם שקיפות נשמרת?", a: "לא — JPG לא תומך בשקיפות. אזורים שקופים ב-WEBP יקבלו רקע לבן." },
    ],
  },
  "jpg-to-webp": {
    directAnswer:
      "המרת JPG ל-WEBP מקטינה משמעותית את משקל התמונה תוך שמירה על איכות טובה — מצוינת לאתרים, בלוגים וטעינה מהירה. העלו JPG, לחצו המרה והורידו WEBP בדפדפן, בלי שמירה בשרת.",
    faqs: [
      { q: "מתי כדאי להמיר JPG ל-WEBP?", a: "לאתרים, אפליקציות וטעינה מהירה — WEBP קטן מ-JPG ב-25%–35% בממוצע. לשליחה ללקוחות ישנים — השאירו JPG." },
      { q: "האם איכות נפגעת?", a: "WEBP דוחס ביעילות — לרוב בלתי מורגש לתמונות web. לתמונות הדפסה — JPG או PNG עדיפים." },
      { q: "האם כל דפדפן תומך ב-WEBP?", a: "Chrome, Firefox, Edge ו-Safari מודרניים כן. דפדפנים ישנים מאוד — לא; השתמשו ב-JPG fallback." },
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
  "mp3-to-wav": {
    directAnswer:
      "המרת MP3 ל-WAV מחזירה איכות שמע מלאה ללא דחיסה — מצוינת לעריכה באולפן, DJ ומיקס. העלו MP3, לחצו המרה והורידו WAV. ההמרה מתבצעת בדפדפן, בלי שמירה בשרת.",
    faqs: [
      { q: "למה להמיר MP3 ל-WAV?", a: "WAV הוא פורמט ללא אובדן — מתאים לעריכה, מיקס ושמירת איכות מקסימלית. MP3 דחוס ומתאים להאזנה, לא לעריכה מקצועית." },
      { q: "האם הקובץ יגדל?", a: "כן — WAV גדול פי 5–10 מ-MP3. מומלץ לעריכה ואולפן, לא לשיתוף יומיומי." },
      { q: "האם איכות MP3 משתפרת?", a: "לא — פרטים שאבדו בדחיסת MP3 לא חוזרים. WAV שומר על מה שנשאר באיכות מלאה, ללא דחיסה נוספת." },
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
  "docx-to-pdf": {
    directAnswer:
      "המרת DOCX ל-PDF שומרת על עיצוב, גופנים וטבלאות בכל מכשיר — מושלמת לשליחה ללקוחות, הגשות וחתימה דיגיטלית. העלו DOCX, לחצו המרה והורידו PDF מיד — בדפדפן, בלי שמירה בשרת.",
    faqs: [
      { q: "למה להמיר DOCX ל-PDF?", a: "PDF נראה זהה בכל מחשב וטלפון — Word עלול לשנות עיצוב לפי גרסה וגופנים מותקנים." },
      { q: "האם גופנים וטבלאות נשמרים?", a: "כן — הגופנים מוטמעים ב-PDF והטבלאות נשארות במקום. מתאים למסמכים רשמיים וחוזים." },
      { q: "DOCX או DOC — מה עדיף?", a: "DOCX מומלץ לתוצאה מיטבית. DOC (Word ישן) נתמך גם כן." },
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
  "ai-image-generator": {
    faqs: [
      { q: "האם הכלי חינמי?", a: "זמין למנויי פרימיום בלבד. כל יצירת תמונה עולה קרדיט אחד; מנוי פרימיום כולל 6 קרדיטים בחודש, וניתן לרכוש חבילות נוספות." },
      { q: "איך כותבים פרומпт טוב?", a: "תארו את הנושא, הסגנון, האור והרקע בטקסט חופשי. ככל שהתיאור מפורט יותר, התוצאה מדויקת יותר." },
      { q: "אילו סגנונות ויחסי תמונה נתמכים?", a: "ניתן לבחור סגנון (ריאליסטי, אמנותי, קריקטורה, תלת מימד ועוד) ויחס תמונה (ריבוע, רחב, אורך). ההורדה ב-PNG." },
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
  "jpg-to-png": {
    directAnswer:
      "Converting JPG to PNG preserves full quality and adds transparency support — ideal for logos, icons and web graphics. Upload a JPG, click convert, download PNG — in your browser, with no server storage.",
    faqs: [
      { q: "When should I convert JPG to PNG?", a: "When you need transparency, sharp lines or graphics with text. For photos, JPG stays smaller." },
      { q: "Is quality preserved?", a: "Yes — PNG is lossless. Converting from JPG won't recover detail lost in the original compression." },
      { q: "Will the file get bigger?", a: "Usually yes — PNG is larger than JPG. Best for graphics with transparency, not photo galleries." },
    ],
  },
  "png-to-jpg": {
    directAnswer:
      "Converting PNG to JPG shrinks file size dramatically — great for email, social media and websites. Transparency becomes a white background. Upload PNG, download JPG in seconds.",
    faqs: [
      { q: "Is transparency kept?", a: "No — JPG has no transparency. Transparent areas become white (or a solid color)." },
      { q: "How much smaller?", a: "Often 50%–80% — depends on image content. Flat-color graphics compress more." },
      { q: "Good for logos?", a: "Only if you don't need transparency. For logos, keep PNG or WEBP." },
    ],
  },
  "webp-to-jpg": {
    directAnswer:
      "WEBP saves weight but not every app supports it. Converting to JPG ensures universal compatibility — Outlook, legacy software and printers. Upload WEBP, download JPG instantly.",
    faqs: [
      { q: "Why convert WEBP to JPG?", a: "JPG works on every device and app — perfect for clients, CRM systems or software that can't read WEBP." },
      { q: "Does quality suffer?", a: "JPG uses slight lossy compression — usually unnoticeable for photos and everyday sharing." },
      { q: "Is transparency preserved?", a: "No — JPG has no transparency. Transparent WEBP areas get a white background." },
    ],
  },
  "jpg-to-webp": {
    directAnswer:
      "Converting JPG to WEBP shrinks file size significantly while keeping good quality — ideal for websites, blogs and fast loading. Upload JPG, click convert, download WEBP in your browser with no server storage.",
    faqs: [
      { q: "When should I convert JPG to WEBP?", a: "For websites, apps and fast loading — WEBP is typically 25%–35% smaller than JPG. For legacy clients, keep JPG." },
      { q: "Does quality suffer?", a: "WEBP compresses efficiently — usually unnoticeable for web photos. For print, prefer JPG or PNG." },
      { q: "Do all browsers support WEBP?", a: "Modern Chrome, Firefox, Edge and Safari do. Very old browsers don't — use JPG as fallback." },
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
  "mp3-to-wav": {
    directAnswer:
      "Converting MP3 to WAV restores uncompressed, full-quality audio — ideal for studio editing, DJ sets and mixing. Upload MP3, click convert, download WAV. Processing happens in your browser with no server storage.",
    faqs: [
      { q: "Why convert MP3 to WAV?", a: "WAV is lossless — best for editing, mixing and maximum quality. MP3 is compressed and suited for listening, not pro editing." },
      { q: "Will the file get bigger?", a: "Yes — WAV is typically 5–10× larger than MP3. Best for studio work, not everyday sharing." },
      { q: "Does MP3 quality improve?", a: "No — detail lost in MP3 compression can't be recovered. WAV preserves what's left at full quality without further compression." },
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
  "docx-to-pdf": {
    directAnswer:
      "Converting DOCX to PDF locks layout, fonts and tables on any device — perfect for clients, submissions and e-signatures. Upload DOCX, click convert, download PDF instantly — in your browser, with no server storage.",
    faqs: [
      { q: "Why convert DOCX to PDF?", a: "PDF looks identical on every computer and phone — Word may shift layout depending on version and installed fonts." },
      { q: "Are fonts and tables preserved?", a: "Yes — fonts are embedded and tables stay in place. Ideal for official documents and contracts." },
      { q: "DOCX or DOC — which is better?", a: "DOCX is recommended for best results. Legacy DOC (old Word) is also supported." },
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
  "ai-image-generator": {
    faqs: [
      { q: "Is this tool free?", a: "Available for Premium subscribers only. Each image costs 1 credit; Premium includes 6 credits per month, and you can buy extra credit packs." },
      { q: "How do I write a good prompt?", a: "Describe the subject, style, lighting and background in free text. The more detailed the description, the better the result." },
      { q: "Which styles and aspect ratios are supported?", a: "Choose a style (realistic, artistic, cartoon, 3D and more) and aspect ratio (square, wide, portrait). Download as PNG." },
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
  "jpg-to-png": {
    directAnswer:
      "Convertir JPG a PNG conserva la calidad total y añade transparencia — ideal para logos, iconos y gráficos web. Sube un JPG, convierte y descarga PNG en el navegador, sin almacenamiento en servidor.",
    faqs: [
      { q: "¿Cuándo convertir JPG a PNG?", a: "Cuando necesitas transparencia, líneas nítidas o gráficos con texto. Para fotos, JPG sigue siendo más pequeño." },
      { q: "¿Se conserva la calidad?", a: "Sí — PNG es sin pérdida. Convertir desde JPG no recupera detalle ya perdido en la compresión original." },
      { q: "¿El archivo será más grande?", a: "Normalmente sí — PNG pesa más que JPG. Mejor para gráficos con transparencia, no para galerías de fotos." },
    ],
  },
  "png-to-jpg": {
    directAnswer:
      "Convertir PNG a JPG reduce mucho el tamaño — perfecto para email, redes sociales y sitios web. La transparencia pasa a fondo blanco. Sube PNG y descarga JPG en segundos.",
    faqs: [
      { q: "¿Se mantiene la transparencia?", a: "No — JPG no admite transparencia. Las zonas transparentes se vuelven blancas." },
      { q: "¿Cuánto se reduce?", a: "A menudo 50%–80% — depende del contenido. Gráficos con colores planos se comprimen más." },
      { q: "¿Sirve para logos?", a: "Solo si no necesitas transparencia. Para logos, mantén PNG o WEBP." },
    ],
  },
  "webp-to-jpg": {
    directAnswer:
      "WEBP ahorra peso pero no todas las apps lo soportan. Convertir a JPG garantiza compatibilidad universal — Outlook, software antiguo e impresoras. Sube WEBP y descarga JPG al instante.",
    faqs: [
      { q: "¿Por qué convertir WEBP a JPG?", a: "JPG funciona en todo dispositivo y app — ideal para clientes, CRM o software que no lee WEBP." },
      { q: "¿Pierde calidad?", a: "JPG usa compresión con pérdida leve — normalmente imperceptible para fotos y uso diario." },
      { q: "¿Se conserva la transparencia?", a: "No — JPG no tiene transparencia. Las zonas transparentes de WEBP quedan con fondo blanco." },
    ],
  },
  "jpg-to-webp": {
    directAnswer:
      "Convertir JPG a WEBP reduce mucho el tamaño manteniendo buena calidad — ideal para sitios web, blogs y carga rápida. Sube JPG, convierte y descarga WEBP en el navegador sin almacenamiento en servidor.",
    faqs: [
      { q: "¿Cuándo convertir JPG a WEBP?", a: "Para sitios web, apps y carga rápida — WEBP suele ser 25%–35% más pequeño que JPG. Para clientes antiguos, mantén JPG." },
      { q: "¿Pierde calidad?", a: "WEBP comprime con eficiencia — normalmente imperceptible en fotos web. Para impresión, prefiere JPG o PNG." },
      { q: "¿Todos los navegadores soportan WEBP?", a: "Chrome, Firefox, Edge y Safari modernos sí. Navegadores muy antiguos no — usa JPG como respaldo." },
    ],
  },
  "image-compressor": {
    faqs: [
      { q: "¿Cuánto puedo comprimir una imagen?", a: "Depende del formato original. JPG y WEBP se comprimen significativamente; PNG menos, pero aún se puede reducir el peso." },
      { q: "¿La compresión afecta la calidad?", a: "La herramienta equilibra tamaño y calidad. Para la mayoría de sitios web, una compresión moderada apenas se nota." },
      { q: "¿A qué formato conviene comprimir?", a: "Para fotos web — WEBP o JPG. Para gráficos con transparencia — PNG comprimido." },
    ],
  },
  "image-resizer": {
    faqs: [
      { q: "¿Cambiar el tamaño reduce la calidad?", a: "Reducir la imagen mantiene buena calidad. Ampliar puede difuminar — conviene empezar con un archivo más grande." },
      { q: "¿Qué dimensiones puedo establecer?", a: "Introduce ancho y alto en píxeles o mantén la proporción. Ideal para iconos, redes sociales y sitios web." },
      { q: "¿Qué formatos se admiten?", a: "JPG, PNG y WEBP — la salida en el formato que elijas." },
    ],
  },
  "video-converter": {
    comparisonHeaders: { format: "Formato", bestFor: "Ideal para", size: "Tamaño", quality: "Calidad" },
    formatComparison: [
      { format: "MP4", bestFor: "YouTube, redes sociales, dispositivos", size: "Mediano", quality: "Excelente (H.264/H.265)" },
      { format: "WEBM", bestFor: "Web, Chrome", size: "Pequeño", quality: "Buena" },
      { format: "MOV", bestFor: "Edición en Mac", size: "Grande", quality: "Excelente" },
      { format: "AVI", bestFor: "Compatibilidad antigua", size: "Grande", quality: "Buena" },
    ],
    faqs: [
      { q: "¿Qué formato de vídeo es el más común?", a: "MP4 (H.264) es el estándar para YouTube, WhatsApp, Instagram y dispositivos móviles." },
      { q: "¿Cuánto tarda la conversión de vídeo?", a: "Depende de la duración y el tamaño del archivo. Clips cortos (menos de un minuto) se convierten en segundos o pocos minutos." },
      { q: "¿Hay límite de tamaño de archivo?", a: "Plan gratuito: hasta 50 MB por archivo. Premium: hasta 500 MB." },
    ],
  },
  "audio-converter": {
    comparisonHeaders: { format: "Formato", bestFor: "Ideal para", size: "Tamaño", quality: "Calidad" },
    formatComparison: [
      { format: "MP3", bestFor: "Escuchar, compartir", size: "Pequeño", quality: "Buena (con pérdida)" },
      { format: "WAV", bestFor: "Edición, estudio", size: "Grande", quality: "Sin pérdida" },
      { format: "FLAC", bestFor: "Colecciones de música", size: "Mediano", quality: "Sin pérdida" },
      { format: "AAC", bestFor: "iPhone, streaming", size: "Pequeño", quality: "Muy buena" },
    ],
    faqs: [
      { q: "¿MP3 o WAV — cuál elegir?", a: "WAV para edición con calidad total. MP3 para compartir a diario — archivo más pequeño." },
      { q: "¿Puedo convertir canciones de YouTube?", a: "Sube un archivo de audio que ya tengas. No descargamos contenido de YouTube." },
      { q: "¿Se conservan los metadatos (artista, álbum)?", a: "La mayoría de los metadatos se conservan al convertir entre formatos comunes." },
    ],
  },
  "mp3-to-wav": {
    directAnswer:
      "Convertir MP3 a WAV devuelve audio sin comprimir y de calidad total — ideal para edición de estudio, DJ y mezcla. Sube MP3, pulsa convertir y descarga WAV. El procesamiento ocurre en tu navegador sin almacenamiento en servidor.",
    faqs: [
      { q: "¿Por qué convertir MP3 a WAV?", a: "WAV es sin pérdida — mejor para editar, mezclar y máxima calidad. MP3 está comprimido y sirve para escuchar, no para edición profesional." },
      { q: "¿El archivo será más grande?", a: "Sí — WAV suele ser 5–10 veces más grande que MP3. Mejor para estudio, no para compartir a diario." },
      { q: "¿Mejora la calidad del MP3?", a: "No — el detalle perdido en la compresión MP3 no se recupera. WAV preserva lo que queda a calidad plena sin más compresión." },
    ],
  },
  "pdf-to-word": {
    faqs: [
      { q: "¿Se conserva el formato?", a: "La herramienta mantiene la estructura del documento, encabezados y tablas. Diseños muy complejos pueden requerir pequeños ajustes en Word." },
      { q: "¿Qué versión de Word se admite?", a: "La salida es DOCX — compatible con Microsoft Word 2007 y superior, Google Docs y LibreOffice." },
      { q: "¿Puedo convertir PDF escaneados?", a: "Los PDF escaneados (imágenes) requieren OCR. Para documentos escaneados, prueba nuestra herramienta OCR." },
    ],
  },
  "word-to-pdf": {
    faqs: [
      { q: "¿Por qué convertir Word a PDF?", a: "PDF fija el diseño en cualquier dispositivo — perfecto para enviar, imprimir y firmas digitales." },
      { q: "¿Se conservan las fuentes?", a: "Sí — las fuentes se incrustan en el PDF para que el documento se vea igual en cualquier lugar." },
      { q: "¿DOC o DOCX?", a: "Ambos formatos son compatibles. DOCX se recomienda para mejores resultados." },
    ],
  },
  "docx-to-pdf": {
    directAnswer:
      "Convertir DOCX a PDF fija diseño, fuentes y tablas en cualquier dispositivo — perfecto para clientes, entregas y firmas digitales. Sube DOCX, pulsa convertir y descarga PDF al instante — en tu navegador, sin almacenamiento en servidor.",
    faqs: [
      { q: "¿Por qué convertir DOCX a PDF?", a: "PDF se ve igual en todo ordenador y móvil — Word puede cambiar el diseño según versión y fuentes instaladas." },
      { q: "¿Se conservan fuentes y tablas?", a: "Sí — las fuentes se incrustan y las tablas permanecen en su lugar. Ideal para documentos oficiales y contratos." },
      { q: "¿DOCX o DOC — cuál es mejor?", a: "DOCX se recomienda para mejores resultados. DOC antiguo también es compatible." },
    ],
  },
  "merge-pdf": {
    faqs: [
      { q: "¿Cómo fusiono archivos PDF?", a: "Sube todos los archivos, reordena las páginas arrastrándolas y fusiona — obtendrás un solo PDF." },
      { q: "¿Puedo rotar páginas?", a: "Sí — rota páginas individuales antes de descargar." },
      { q: "¿Hay límite de archivos?", a: "Plan gratuito: hasta 5 operaciones al día. Premium: ilimitado." },
    ],
  },
  "text-tools": {
    faqs: [
      { q: "¿Qué formatos de texto se admiten?", a: "TXT, Markdown y HTML — con conversión bidireccional entre ellos." },
      { q: "¿Hay contador de palabras?", a: "Sí — la herramienta muestra palabras y caracteres en tiempo real." },
      { q: "¿Se conserva el formato?", a: "La conversión a HTML mantiene la estructura básica; estilos complejos pueden requerir ajustes." },
    ],
  },
  "ai-image-generator": {
    faqs: [
      { q: "¿Es gratis esta herramienta?", a: "Disponible solo para suscriptores Premium. Cada imagen cuesta 1 crédito; Premium incluye 6 créditos al mes y puedes comprar paquetes adicionales." },
      { q: "¿Cómo escribir un buen prompt?", a: "Describe el tema, estilo, iluminación y fondo en texto libre. Cuanto más detallada sea la descripción, mejor será el resultado." },
      { q: "¿Qué estilos y proporciones se admiten?", a: "Elige estilo (realista, artístico, caricatura, 3D y más) y proporción (cuadrado, ancho, vertical). Descarga en PNG." },
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
  "jpg-to-png": {
    directAnswer:
      "Convertir JPG en PNG conserve une qualité maximale et ajoute la transparence — idéal pour logos, icônes et graphiques web. Téléversez un JPG, convertissez et téléchargez un PNG dans le navigateur, sans stockage serveur.",
    faqs: [
      { q: "Quand convertir JPG en PNG ?", a: "Quand vous avez besoin de transparence, de lignes nettes ou de graphiques avec texte. Pour les photos, JPG reste plus léger." },
      { q: "La qualité est-elle préservée ?", a: "Oui — PNG est sans perte. La conversion depuis JPG ne récupère pas le détail perdu à la compression d'origine." },
      { q: "Le fichier sera-t-il plus gros ?", a: "En général oui — PNG est plus volumineux que JPG. Mieux pour les graphiques transparents, pas les galeries photo." },
    ],
  },
  "png-to-jpg": {
    directAnswer:
      "Convertir PNG en JPG réduit fortement la taille — parfait pour e-mail, réseaux sociaux et sites. La transparence devient un fond blanc. Téléversez un PNG, téléchargez un JPG en secondes.",
    faqs: [
      { q: "La transparence est-elle conservée ?", a: "Non — JPG ne gère pas la transparence. Les zones transparentes deviennent blanches." },
      { q: "Quelle réduction de taille ?", a: "Souvent 50%–80% — selon le contenu. Les graphiques à aplats se compressent davantage." },
      { q: "Convient aux logos ?", a: "Seulement sans besoin de transparence. Pour les logos, gardez PNG ou WEBP." },
    ],
  },
  "webp-to-jpg": {
    directAnswer:
      "WEBP allège les fichiers mais toutes les apps ne le lisent pas. Convertir en JPG assure une compatibilité universelle — Outlook, logiciels anciens et imprimantes. Téléversez WEBP, téléchargez JPG instantanément.",
    faqs: [
      { q: "Pourquoi convertir WEBP en JPG ?", a: "JPG fonctionne partout — idéal pour clients, CRM ou logiciels qui ne lisent pas WEBP." },
      { q: "Perte de qualité ?", a: "JPG compresse légèrement avec perte — souvent imperceptible pour photos et partage courant." },
      { q: "Transparence conservée ?", a: "Non — JPG n'a pas de transparence. Les zones transparentes WEBP passent en fond blanc." },
    ],
  },
  "jpg-to-webp": {
    directAnswer:
      "Convertir JPG en WEBP réduit fortement la taille tout en gardant une bonne qualité — idéal pour sites web, blogs et chargement rapide. Téléversez un JPG, convertissez et téléchargez WEBP dans le navigateur, sans stockage serveur.",
    faqs: [
      { q: "Quand convertir JPG en WEBP ?", a: "Pour sites web, apps et chargement rapide — WEBP est souvent 25%–35% plus léger que JPG. Pour clients anciens, gardez JPG." },
      { q: "Perte de qualité ?", a: "WEBP compresse efficacement — souvent imperceptible pour photos web. Pour l'impression, préférez JPG ou PNG." },
      { q: "Tous les navigateurs supportent WEBP ?", a: "Chrome, Firefox, Edge et Safari modernes oui. Très vieux navigateurs non — utilisez JPG en secours." },
    ],
  },
  "image-compressor": {
    faqs: [
      { q: "De combien puis-je compresser une image ?", a: "Cela dépend du format d'origine. JPG et WEBP se compressent nettement ; PNG moins, mais le poids peut quand même être réduit." },
      { q: "La compression affecte-t-elle la qualité ?", a: "L'outil équilibre taille et qualité. Pour la plupart des sites web, une compression modérée reste à peine visible." },
      { q: "Vers quel format compresser ?", a: "Pour les photos web — WEBP ou JPG. Pour les graphiques avec transparence — PNG compressé." },
    ],
  },
  "image-resizer": {
    faqs: [
      { q: "Le redimensionnement réduit-il la qualité ?", a: "Réduire l'image conserve une bonne qualité. Agrandir peut flouter — partez d'un fichier plus grand si possible." },
      { q: "Quelles dimensions puis-je définir ?", a: "Saisissez largeur et hauteur en pixels ou conservez les proportions. Idéal pour icônes, réseaux sociaux et sites web." },
      { q: "Quels formats sont pris en charge ?", a: "JPG, PNG et WEBP — sortie dans le format de votre choix." },
    ],
  },
  "video-converter": {
    comparisonHeaders: { format: "Format", bestFor: "Idéal pour", size: "Taille", quality: "Qualité" },
    formatComparison: [
      { format: "MP4", bestFor: "YouTube, réseaux sociaux, appareils", size: "Moyen", quality: "Excellente (H.264/H.265)" },
      { format: "WEBM", bestFor: "Web, Chrome", size: "Petit", quality: "Bonne" },
      { format: "MOV", bestFor: "Montage sur Mac", size: "Grand", quality: "Excellente" },
      { format: "AVI", bestFor: "Compatibilité ancienne", size: "Grand", quality: "Bonne" },
    ],
    faqs: [
      { q: "Quel format vidéo est le plus courant ?", a: "MP4 (H.264) est la norme pour YouTube, WhatsApp, Instagram et les appareils mobiles." },
      { q: "Combien de temps dure une conversion vidéo ?", a: "Cela dépend de la durée et de la taille du fichier. Les clips courts (moins d'une minute) se convertissent en quelques secondes à quelques minutes." },
      { q: "Y a-t-il une limite de taille de fichier ?", a: "Offre gratuite : jusqu'à 50 Mo par fichier. Premium : jusqu'à 500 Mo." },
    ],
  },
  "audio-converter": {
    comparisonHeaders: { format: "Format", bestFor: "Idéal pour", size: "Taille", quality: "Qualité" },
    formatComparison: [
      { format: "MP3", bestFor: "Écoute, partage", size: "Petit", quality: "Bonne (avec perte)" },
      { format: "WAV", bestFor: "Montage, studio", size: "Grand", quality: "Sans perte" },
      { format: "FLAC", bestFor: "Collections musicales", size: "Moyen", quality: "Sans perte" },
      { format: "AAC", bestFor: "iPhone, streaming", size: "Petit", quality: "Très bonne" },
    ],
    faqs: [
      { q: "MP3 ou WAV — lequel choisir ?", a: "WAV pour une édition en qualité maximale. MP3 pour le partage quotidien — fichier plus petit." },
      { q: "Puis-je convertir des chansons depuis YouTube ?", a: "Téléversez un fichier audio que vous possédez déjà. Nous ne téléchargeons pas de contenu depuis YouTube." },
      { q: "Les métadonnées (artiste, album) sont-elles conservées ?", a: "La plupart des métadonnées sont conservées lors de la conversion entre formats courants." },
    ],
  },
  "mp3-to-wav": {
    directAnswer:
      "Convertir MP3 en WAV restitue un audio non compressé de qualité maximale — idéal pour le montage studio, DJ et mixage. Téléversez un MP3, cliquez sur convertir et téléchargez le WAV. Traitement dans le navigateur, sans stockage serveur.",
    faqs: [
      { q: "Pourquoi convertir MP3 en WAV ?", a: "WAV est sans perte — idéal pour l'édition, le mixage et la qualité maximale. MP3 est compressé, adapté à l'écoute, pas à l'édition pro." },
      { q: "Le fichier sera-t-il plus gros ?", a: "Oui — WAV est souvent 5 à 10 fois plus volumineux que MP3. Mieux pour le studio, pas pour le partage quotidien." },
      { q: "La qualité MP3 s'améliore-t-elle ?", a: "Non — le détail perdu dans la compression MP3 ne revient pas. WAV préserve ce qui reste en qualité pleine, sans compression supplémentaire." },
    ],
  },
  "pdf-to-word": {
    faqs: [
      { q: "La mise en forme est-elle conservée ?", a: "L'outil conserve la structure du document, les titres et les tableaux. Les mises en page très complexes peuvent nécessiter de légers ajustements dans Word." },
      { q: "Quelle version de Word est prise en charge ?", a: "La sortie est au format DOCX — compatible avec Microsoft Word 2007 et plus, Google Docs et LibreOffice." },
      { q: "Puis-je convertir des PDF numérisés ?", a: "Les PDF numérisés (images) nécessitent l'OCR. Pour les documents numérisés, essayez notre outil OCR." },
    ],
  },
  "word-to-pdf": {
    faqs: [
      { q: "Pourquoi convertir Word en PDF ?", a: "Le PDF fixe la mise en page sur tout appareil — parfait pour l'envoi, l'impression et les signatures numériques." },
      { q: "Les polices sont-elles conservées ?", a: "Oui — les polices sont intégrées au PDF pour que le document soit identique partout." },
      { q: "DOC ou DOCX ?", a: "Les deux formats sont pris en charge. DOCX est recommandé pour de meilleurs résultats." },
    ],
  },
  "docx-to-pdf": {
    directAnswer:
      "Convertir DOCX en PDF fixe la mise en page, les polices et les tableaux sur tout appareil — parfait pour clients, soumissions et signatures numériques. Téléversez un DOCX, cliquez sur convertir et téléchargez le PDF — dans le navigateur, sans stockage serveur.",
    faqs: [
      { q: "Pourquoi convertir DOCX en PDF ?", a: "Le PDF s'affiche identique sur tout ordinateur et téléphone — Word peut décaler la mise en page selon la version et les polices installées." },
      { q: "Les polices et tableaux sont-ils conservés ?", a: "Oui — les polices sont intégrées et les tableaux restent en place. Idéal pour documents officiels et contrats." },
      { q: "DOCX ou DOC — lequel est préférable ?", a: "DOCX est recommandé pour de meilleurs résultats. L'ancien DOC est aussi pris en charge." },
    ],
  },
  "merge-pdf": {
    faqs: [
      { q: "Comment fusionner des fichiers PDF ?", a: "Téléversez tous les fichiers, réorganisez les pages par glisser-déposer, puis fusionnez — vous obtenez un seul PDF." },
      { q: "Puis-je faire pivoter des pages ?", a: "Oui — faites pivoter des pages individuelles avant le téléchargement." },
      { q: "Y a-t-il une limite de fichiers ?", a: "Offre gratuite : jusqu'à 5 opérations par jour. Premium : illimité." },
    ],
  },
  "text-tools": {
    faqs: [
      { q: "Quels formats texte sont pris en charge ?", a: "TXT, Markdown et HTML — avec conversion bidirectionnelle entre eux." },
      { q: "Y a-t-il un compteur de mots ?", a: "Oui — l'outil affiche mots et caractères en temps réel." },
      { q: "La mise en forme est-elle conservée ?", a: "La conversion en HTML garde la structure de base ; un style complexe peut nécessiter des ajustements." },
    ],
  },
  "ai-image-generator": {
    faqs: [
      { q: "Cet outil est-il gratuit ?", a: "Réservé aux abonnés Premium. Chaque image coûte 1 crédit ; Premium inclut 6 crédits par mois, avec des packs supplémentaires disponibles." },
      { q: "Comment rédiger un bon prompt ?", a: "Décrivez le sujet, le style, l'éclairage et l'arrière-plan en texte libre. Plus la description est détaillée, meilleur est le résultat." },
      { q: "Quels styles et ratios sont pris en charge ?", a: "Choisissez un style (réaliste, artistique, cartoon, 3D, etc.) et un ratio (carré, large, portrait). Téléchargement en PNG." },
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
  "jpg-to-png": {
    directAnswer:
      "Конвертация JPG в PNG сохраняет полное качество и добавляет прозрачность — идеально для логотипов, иконок и веб-графики. Загрузите JPG, нажмите «Конвертировать» и скачайте PNG в браузере без хранения на сервере.",
    faqs: [
      { q: "Когда конвертировать JPG в PNG?", a: "Когда нужна прозрачность, чёткие линии или графика с текстом. Для фото JPG остаётся меньше." },
      { q: "Сохраняется ли качество?", a: "Да — PNG без потерь. Конвертация из JPG не вернёт детали, потерянные при исходном сжатии." },
      { q: "Файл станет больше?", a: "Обычно да — PNG тяжелее JPG. Лучше для прозрачной графики, не для фотогалерей." },
    ],
  },
  "png-to-jpg": {
    directAnswer:
      "Конвертация PNG в JPG сильно уменьшает размер — удобно для почты, соцсетей и сайтов. Прозрачность заменяется белым фоном. Загрузите PNG и скачайте JPG за секунды.",
    faqs: [
      { q: "Сохраняется ли прозрачность?", a: "Нет — JPG не поддерживает прозрачность. Прозрачные области станут белыми." },
      { q: "Насколько меньше файл?", a: "Часто на 50%–80% — зависит от содержимого. Плоские цвета сжимаются сильнее." },
      { q: "Подходит для логотипов?", a: "Только если прозрачность не нужна. Для логотипов оставляйте PNG или WEBP." },
    ],
  },
  "webp-to-jpg": {
    directAnswer:
      "WEBP экономит место, но не все программы его читают. Конвертация в JPG даёт универсальную совместимость — Outlook, старые приложения и принтеры. Загрузите WEBP и скачайте JPG мгновенно.",
    faqs: [
      { q: "Зачем конвертировать WEBP в JPG?", a: "JPG работает на любом устройстве — идеально для клиентов, CRM или ПО без поддержки WEBP." },
      { q: "Падает ли качество?", a: "JPG слегка сжимает с потерями — для фото и повседневного обмена обычно незаметно." },
      { q: "Сохраняется ли прозрачность?", a: "Нет — у JPG нет прозрачности. Прозрачные области WEBP получат белый фон." },
    ],
  },
  "jpg-to-webp": {
    directAnswer:
      "Конвертация JPG в WEBP сильно уменьшает размер при хорошем качестве — идеально для сайтов, блогов и быстрой загрузки. Загрузите JPG, нажмите «Конвертировать» и скачайте WEBP в браузере без хранения на сервере.",
    faqs: [
      { q: "Когда конвертировать JPG в WEBP?", a: "Для сайтов, приложений и быстрой загрузки — WEBP обычно на 25%–35% меньше JPG. Для старых клиентов оставляйте JPG." },
      { q: "Падает ли качество?", a: "WEBP сжимает эффективно — для веб-фото обычно незаметно. Для печати лучше JPG или PNG." },
      { q: "Все ли браузеры поддерживают WEBP?", a: "Современные Chrome, Firefox, Edge и Safari — да. Очень старые — нет; используйте JPG как запасной вариант." },
    ],
  },
  "image-compressor": {
    faqs: [
      { q: "Насколько можно сжать изображение?", a: "Зависит от исходного формата. JPG и WEBP сжимаются значительно; PNG меньше, но размер всё равно можно уменьшить." },
      { q: "Влияет ли сжатие на качество?", a: "Инструмент балансирует размер и качество. Для большинства сайтов умеренное сжатие почти незаметно." },
      { q: "В какой формат сжимать?", a: "Для веб-фото — WEBP или JPG. Для графики с прозрачностью — сжатый PNG." },
    ],
  },
  "image-resizer": {
    faqs: [
      { q: "Снижает ли изменение размера качество?", a: "Уменьшение сохраняет хорошее качество. Увеличение может размыть — лучше начинать с более крупного файла." },
      { q: "Какие размеры можно задать?", a: "Введите ширину и высоту в пикселях или сохраните пропорции. Подходит для иконок, соцсетей и сайтов." },
      { q: "Какие форматы поддерживаются?", a: "JPG, PNG и WEBP — выход в выбранном вами формате." },
    ],
  },
  "video-converter": {
    comparisonHeaders: { format: "Формат", bestFor: "Подходит для", size: "Размер", quality: "Качество" },
    formatComparison: [
      { format: "MP4", bestFor: "YouTube, соцсети, устройства", size: "Средний", quality: "Отличное (H.264/H.265)" },
      { format: "WEBM", bestFor: "Веб, Chrome", size: "Малый", quality: "Хорошее" },
      { format: "MOV", bestFor: "Монтаж на Mac", size: "Большой", quality: "Отличное" },
      { format: "AVI", bestFor: "Старая совместимость", size: "Большой", quality: "Хорошее" },
    ],
    faqs: [
      { q: "Какой видеоформат самый распространённый?", a: "MP4 (H.264) — стандарт для YouTube, WhatsApp, Instagram и мобильных устройств." },
      { q: "Сколько времени занимает конвертация видео?", a: "Зависит от длины и размера файла. Короткие ролики (до минуты) конвертируются за секунды или несколько минут." },
      { q: "Есть ли ограничение по размеру файла?", a: "Бесплатный план: до 50 МБ на файл. Премиум: до 500 МБ." },
    ],
  },
  "audio-converter": {
    comparisonHeaders: { format: "Формат", bestFor: "Подходит для", size: "Размер", quality: "Качество" },
    formatComparison: [
      { format: "MP3", bestFor: "Прослушивание, обмен", size: "Малый", quality: "Хорошее (с потерями)" },
      { format: "WAV", bestFor: "Редактирование, студия", size: "Большой", quality: "Без потерь" },
      { format: "FLAC", bestFor: "Музыкальные коллекции", size: "Средний", quality: "Без потерь" },
      { format: "AAC", bestFor: "iPhone, стриминг", size: "Малый", quality: "Очень хорошее" },
    ],
    faqs: [
      { q: "MP3 или WAV — что выбрать?", a: "WAV для редактирования в полном качестве. MP3 для повседневного обмена — меньший размер файла." },
      { q: "Можно ли конвертировать песни с YouTube?", a: "Загрузите аудиофайл, который у вас уже есть. Мы не скачиваем контент с YouTube." },
      { q: "Сохраняются ли метаданные (исполнитель, альбом)?", a: "Большинство метаданных сохраняется при конвертации между распространёнными форматами." },
    ],
  },
  "mp3-to-wav": {
    directAnswer:
      "Конвертация MP3 в WAV возвращает несжатое аудио полного качества — идеально для студийного монтажа, DJ и сведения. Загрузите MP3, нажмите конвертировать и скачайте WAV. Обработка в браузере, без хранения на сервере.",
    faqs: [
      { q: "Зачем конвертировать MP3 в WAV?", a: "WAV без потерь — лучше для редактирования, сведения и максимального качества. MP3 сжат и подходит для прослушивания, не для профессионального монтажа." },
      { q: "Файл станет больше?", a: "Да — WAV обычно в 5–10 раз больше MP3. Лучше для студии, не для повседневного обмена." },
      { q: "Улучшится ли качество MP3?", a: "Нет — детали, потерянные при сжатии MP3, не восстановятся. WAV сохраняет оставшееся в полном качестве без дополнительного сжатия." },
    ],
  },
  "pdf-to-word": {
    faqs: [
      { q: "Сохраняется ли форматирование?", a: "Инструмент сохраняет структуру документа, заголовки и таблицы. Очень сложные макеты могут потребовать небольших правок в Word." },
      { q: "Какая версия Word поддерживается?", a: "Результат — DOCX, совместимый с Microsoft Word 2007 и новее, Google Docs и LibreOffice." },
      { q: "Можно ли конвертировать отсканированные PDF?", a: "Отсканированные PDF (изображения) требуют OCR. Для отсканированных документов попробуйте наш инструмент OCR." },
    ],
  },
  "word-to-pdf": {
    faqs: [
      { q: "Зачем конвертировать Word в PDF?", a: "PDF сохраняет вёрстку на любом устройстве — идеально для отправки, печати и электронной подписи." },
      { q: "Сохраняются ли шрифты?", a: "Да — шрифты встраиваются в PDF, поэтому документ выглядит одинаково везде." },
      { q: "DOC или DOCX?", a: "Поддерживаются оба формата. DOCX рекомендуется для лучшего результата." },
    ],
  },
  "docx-to-pdf": {
    directAnswer:
      "Конвертация DOCX в PDF фиксирует вёрстку, шрифты и таблицы на любом устройстве — идеально для клиентов, подачи документов и электронной подписи. Загрузите DOCX, нажмите конвертировать и скачайте PDF — в браузере, без хранения на сервере.",
    faqs: [
      { q: "Зачем конвертировать DOCX в PDF?", a: "PDF выглядит одинаково на любом компьютере и телефоне — Word может сдвинуть вёрстку в зависимости от версии и установленных шрифтов." },
      { q: "Сохраняются ли шрифты и таблицы?", a: "Да — шрифты встраиваются, таблицы остаются на месте. Подходит для официальных документов и договоров." },
      { q: "DOCX или DOC — что лучше?", a: "DOCX рекомендуется для лучшего результата. Старый DOC тоже поддерживается." },
    ],
  },
  "merge-pdf": {
    faqs: [
      { q: "Как объединить PDF-файлы?", a: "Загрузите все файлы, упорядочьте страницы перетаскиванием и нажмите «Объединить» — получите один PDF." },
      { q: "Можно ли поворачивать страницы?", a: "Да — поворачивайте отдельные страницы перед скачиванием." },
      { q: "Есть ли лимит файлов?", a: "Бесплатный план: до 5 операций в день. Премиум: без ограничений." },
    ],
  },
  "text-tools": {
    faqs: [
      { q: "Какие текстовые форматы поддерживаются?", a: "TXT, Markdown и HTML — с двусторонней конвертацией между ними." },
      { q: "Есть ли подсчёт слов?", a: "Да — инструмент показывает количество слов и символов в реальном времени." },
      { q: "Сохраняется ли форматирование?", a: "Конвертация в HTML сохраняет базовую структуру; сложное оформление может потребовать правок." },
    ],
  },
  "ai-image-generator": {
    faqs: [
      { q: "Этот инструмент бесплатный?", a: "Доступен только подписчикам Premium. Каждое изображение стоит 1 кредит; Premium включает 6 кредитов в месяц, дополнительные пакеты можно купить." },
      { q: "Как написать хороший промпт?", a: "Опишите тему, стиль, освещение и фон свободным текстом. Чем подробнее описание, тем лучше результат." },
      { q: "Какие стили и пропорции поддерживаются?", a: "Выберите стиль (реалистичный, художественный, мультяшный, 3D и др.) и пропорции (квадрат, широкий, вертикальный). Скачивание в PNG." },
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
  "jpg-to-png": {
    directAnswer:
      "JPG in PNG konvertieren erhält volle Qualität und fügt Transparenz hinzu — ideal für Logos, Icons und Web-Grafik. JPG hochladen, konvertieren, PNG herunterladen — im Browser, ohne Server-Speicherung.",
    faqs: [
      { q: "Wann JPG zu PNG?", a: "Bei Transparenz, scharfen Linien oder Grafik mit Text. Für Fotos bleibt JPG kleiner." },
      { q: "Bleibt die Qualität erhalten?", a: "Ja — PNG ist verlustfrei. Konvertierung aus JPG stellt bereits verlorene JPG-Details nicht wieder her." },
      { q: "Wird die Datei größer?", a: "Meist ja — PNG ist größer als JPG. Besser für transparente Grafik, nicht für Fotogalerien." },
    ],
  },
  "png-to-jpg": {
    directAnswer:
      "PNG in JPG konvertieren verkleinert die Datei deutlich — perfekt für E-Mail, Social Media und Websites. Transparenz wird weißer Hintergrund. PNG hochladen, JPG in Sekunden herunterladen.",
    faqs: [
      { q: "Bleibt Transparenz erhalten?", a: "Nein — JPG unterstützt keine Transparenz. Transparente Bereiche werden weiß." },
      { q: "Wie viel kleiner?", a: "Oft 50%–80% — je nach Inhalt. Flächige Farben komprimieren stärker." },
      { q: "Für Logos geeignet?", a: "Nur ohne Transparenzbedarf. Für Logos PNG oder WEBP behalten." },
    ],
  },
  "webp-to-jpg": {
    directAnswer:
      "WEBP spart Größe, aber nicht jede App unterstützt es. Konvertierung zu JPG sorgt für universelle Kompatibilität — Outlook, alte Software und Drucker. WEBP hochladen, JPG sofort laden.",
    faqs: [
      { q: "Warum WEBP zu JPG?", a: "JPG läuft auf jedem Gerät — ideal für Kunden, CRM oder Software ohne WEBP-Unterstützung." },
      { q: "Qualitätsverlust?", a: "JPG komprimiert leicht verlustbehaftet — für Fotos und Alltag meist unsichtbar." },
      { q: "Transparenz erhalten?", a: "Nein — JPG hat keine Transparenz. Transparente WEBP-Bereiche werden weiß." },
    ],
  },
  "jpg-to-webp": {
    directAnswer:
      "JPG in WEBP konvertieren verkleinert die Datei deutlich bei guter Qualität — ideal für Websites, Blogs und schnelles Laden. JPG hochladen, konvertieren klicken, WEBP im Browser herunterladen — ohne Server-Speicherung.",
    faqs: [
      { q: "Wann JPG zu WEBP?", a: "Für Websites, Apps und schnelles Laden — WEBP ist oft 25%–35% kleiner als JPG. Für Legacy-Kunden JPG behalten." },
      { q: "Qualitätsverlust?", a: "WEBP komprimiert effizient — für Webfotos meist unsichtbar. Für Druck JPG oder PNG bevorzugen." },
      { q: "Unterstützen alle Browser WEBP?", a: "Moderne Chrome, Firefox, Edge und Safari ja. Sehr alte Browser nein — JPG als Fallback." },
    ],
  },
  "image-compressor": {
    faqs: [
      { q: "Wie stark kann ich ein Bild komprimieren?", a: "Hängt vom Quellformat ab. JPG und WEBP lassen sich deutlich komprimieren; PNG weniger, aber die Dateigröße kann trotzdem reduziert werden." },
      { q: "Beeinträchtigt die Kompression die Qualität?", a: "Das Tool balanciert Größe und Qualität. Für die meisten Websites ist moderate Kompression kaum sichtbar." },
      { q: "In welches Format soll ich komprimieren?", a: "Für Webfotos — WEBP oder JPG. Für Grafiken mit Transparenz — komprimiertes PNG." },
    ],
  },
  "image-resizer": {
    faqs: [
      { q: "Verringert die Größenänderung die Qualität?", a: "Verkleinern behält gute Qualität. Vergrößern kann unscharf wirken — starten Sie wenn möglich mit einer größeren Quelldatei." },
      { q: "Welche Abmessungen kann ich festlegen?", a: "Breite und Höhe in Pixeln eingeben oder Seitenverhältnis beibehalten. Ideal für Icons, Social Media und Websites." },
      { q: "Welche Formate werden unterstützt?", a: "JPG, PNG und WEBP — Ausgabe in Ihrem gewählten Format." },
    ],
  },
  "video-converter": {
    comparisonHeaders: { format: "Format", bestFor: "Ideal für", size: "Größe", quality: "Qualität" },
    formatComparison: [
      { format: "MP4", bestFor: "YouTube, Social Media, Geräte", size: "Mittel", quality: "Ausgezeichnet (H.264/H.265)" },
      { format: "WEBM", bestFor: "Web, Chrome", size: "Klein", quality: "Gut" },
      { format: "MOV", bestFor: "Bearbeitung auf Mac", size: "Groß", quality: "Ausgezeichnet" },
      { format: "AVI", bestFor: "Legacy-Kompatibilität", size: "Groß", quality: "Gut" },
    ],
    faqs: [
      { q: "Welches Videoformat ist am verbreitetsten?", a: "MP4 (H.264) ist der Standard für YouTube, WhatsApp, Instagram und mobile Geräte." },
      { q: "Wie lange dauert die Videokonvertierung?", a: "Das hängt von Länge und Dateigröße ab. Kurze Clips (unter einer Minute) werden in Sekunden bis wenigen Minuten konvertiert." },
      { q: "Gibt es ein Dateigrößenlimit?", a: "Kostenloser Plan: bis zu 50 MB pro Datei. Premium: bis zu 500 MB." },
    ],
  },
  "audio-converter": {
    comparisonHeaders: { format: "Format", bestFor: "Ideal für", size: "Größe", quality: "Qualität" },
    formatComparison: [
      { format: "MP3", bestFor: "Hören, Teilen", size: "Klein", quality: "Gut (verlustbehaftet)" },
      { format: "WAV", bestFor: "Bearbeitung, Studio", size: "Groß", quality: "Verlustfrei" },
      { format: "FLAC", bestFor: "Musiksammlungen", size: "Mittel", quality: "Verlustfrei" },
      { format: "AAC", bestFor: "iPhone, Streaming", size: "Klein", quality: "Sehr gut" },
    ],
    faqs: [
      { q: "MP3 oder WAV — was wählen?", a: "WAV für Bearbeitung in voller Qualität. MP3 für den Alltag — kleinere Dateigröße." },
      { q: "Kann ich Songs von YouTube konvertieren?", a: "Laden Sie eine Audiodatei hoch, die Sie bereits haben. Wir laden keine Inhalte von YouTube herunter." },
      { q: "Bleiben Metadaten (Künstler, Album) erhalten?", a: "Die meisten Metadaten bleiben bei der Konvertierung zwischen gängigen Formaten erhalten." },
    ],
  },
  "mp3-to-wav": {
    directAnswer:
      "MP3 in WAV konvertieren liefert unkomprimiertes Audio in voller Qualität — ideal für Studio-Bearbeitung, DJ und Mixing. MP3 hochladen, konvertieren klicken, WAV herunterladen. Verarbeitung im Browser, ohne Server-Speicherung.",
    faqs: [
      { q: "Warum MP3 in WAV konvertieren?", a: "WAV ist verlustfrei — am besten für Bearbeitung, Mixing und maximale Qualität. MP3 ist komprimiert und für Zuhören, nicht für Profi-Bearbeitung." },
      { q: "Wird die Datei größer?", a: "Ja — WAV ist typischerweise 5–10× größer als MP3. Besser fürs Studio, nicht für den Alltag." },
      { q: "Verbessert sich die MP3-Qualität?", a: "Nein — bei MP3-Kompression verlorene Details kehren nicht zurück. WAV bewahrt den Rest in voller Qualität ohne weitere Kompression." },
    ],
  },
  "pdf-to-word": {
    faqs: [
      { q: "Bleibt die Formatierung erhalten?", a: "Das Tool behält Dokumentstruktur, Überschriften und Tabellen bei. Sehr komplexe Layouts können geringfügige Anpassungen in Word erfordern." },
      { q: "Welche Word-Version wird unterstützt?", a: "Die Ausgabe ist DOCX — kompatibel mit Microsoft Word 2007 und neuer, Google Docs und LibreOffice." },
      { q: "Kann ich gescannte PDFs konvertieren?", a: "Gescannte PDFs (Bilder) benötigen OCR. Für gescannte Dokumente probieren Sie unser OCR-Tool." },
    ],
  },
  "word-to-pdf": {
    faqs: [
      { q: "Warum Word in PDF konvertieren?", a: "PDF fixiert das Layout auf jedem Gerät — perfekt zum Senden, Drucken und für digitale Signaturen." },
      { q: "Bleiben Schriftarten erhalten?", a: "Ja — Schriftarten werden im PDF eingebettet, sodass das Dokument überall identisch aussieht." },
      { q: "DOC oder DOCX?", a: "Beide Formate werden unterstützt. DOCX wird für beste Ergebnisse empfohlen." },
    ],
  },
  "docx-to-pdf": {
    directAnswer:
      "DOCX in PDF konvertieren fixiert Layout, Schriftarten und Tabellen auf jedem Gerät — perfekt für Kunden, Einreichungen und digitale Signaturen. DOCX hochladen, konvertieren klicken, PDF sofort herunterladen — im Browser, ohne Server-Speicherung.",
    faqs: [
      { q: "Warum DOCX in PDF konvertieren?", a: "PDF sieht auf jedem Computer und Handy gleich aus — Word kann das Layout je nach Version und installierten Schriftarten verschieben." },
      { q: "Bleiben Schriftarten und Tabellen erhalten?", a: "Ja — Schriftarten werden eingebettet und Tabellen bleiben an Ort und Stelle. Ideal für offizielle Dokumente und Verträge." },
      { q: "DOCX oder DOC — was ist besser?", a: "DOCX wird für beste Ergebnisse empfohlen. Legacy-DOC wird ebenfalls unterstützt." },
    ],
  },
  "merge-pdf": {
    faqs: [
      { q: "Wie füge ich PDF-Dateien zusammen?", a: "Laden Sie alle Dateien hoch, ordnen Sie die Seiten per Drag-and-Drop und klicken Sie auf Zusammenführen — Sie erhalten ein PDF." },
      { q: "Kann ich Seiten drehen?", a: "Ja — drehen Sie einzelne Seiten vor dem Download." },
      { q: "Gibt es ein Dateilimit?", a: "Kostenloser Plan: bis zu 5 Operationen pro Tag. Premium: unbegrenzt." },
    ],
  },
  "text-tools": {
    faqs: [
      { q: "Welche Textformate werden unterstützt?", a: "TXT, Markdown und HTML — mit bidirektionaler Konvertierung zwischen ihnen." },
      { q: "Gibt es eine Wortzählung?", a: "Ja — das Tool zeigt Wörter und Zeichen in Echtzeit." },
      { q: "Bleibt die Formatierung erhalten?", a: "Die HTML-Konvertierung behält die Grundstruktur; komplexes Styling kann Anpassungen erfordern." },
    ],
  },
  "ai-image-generator": {
    faqs: [
      { q: "Ist dieses Tool kostenlos?", a: "Nur für Premium-Abonnenten. Jedes Bild kostet 1 Credit; Premium enthält 6 Credits pro Monat, zusätzliche Pakete sind käuflich." },
      { q: "Wie schreibt man einen guten Prompt?", a: "Beschreiben Sie Motiv, Stil, Beleuchtung und Hintergrund in freiem Text. Je detaillierter die Beschreibung, desto besser das Ergebnis." },
      { q: "Welche Stile und Seitenverhältnisse werden unterstützt?", a: "Wählen Sie Stil (realistisch, künstlerisch, Cartoon, 3D u. a.) und Seitenverhältnis (quadratisch, breit, hoch). Download als PNG." },
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
  "jpg-to-png": {
    directAnswer:
      "Convertire JPG in PNG mantiene la qualità piena e aggiunge la trasparenza — ideale per loghi, icone e grafica web. Carica un JPG, converti e scarica PNG nel browser, senza archiviazione sul server.",
    faqs: [
      { q: "Quando convertire JPG in PNG?", a: "Quando servono trasparenza, linee nitide o grafica con testo. Per le foto, JPG resta più leggero." },
      { q: "La qualità si conserva?", a: "Sì — PNG è lossless. La conversione da JPG non recupera dettagli persi nella compressione originale." },
      { q: "Il file diventa più grande?", a: "Di solito sì — PNG pesa più di JPG. Meglio per grafica trasparente, non gallerie fotografiche." },
    ],
  },
  "png-to-jpg": {
    directAnswer:
      "Convertire PNG in JPG riduce molto la dimensione — ottimo per email, social e siti. La trasparenza diventa sfondo bianco. Carica PNG e scarica JPG in pochi secondi.",
    faqs: [
      { q: "La trasparenza resta?", a: "No — JPG non supporta la trasparenza. Le aree trasparenti diventano bianche." },
      { q: "Quanto si riduce?", a: "Spesso 50%–80% — dipende dal contenuto. Grafica a colori piatti si comprime di più." },
      { q: "Adatto ai loghi?", a: "Solo senza bisogno di trasparenza. Per i loghi, mantieni PNG o WEBP." },
    ],
  },
  "webp-to-jpg": {
    directAnswer:
      "WEBP risparmia peso ma non tutte le app lo leggono. Convertire in JPG garantisce compatibilità universale — Outlook, software legacy e stampanti. Carica WEBP e scarica JPG subito.",
    faqs: [
      { q: "Perché convertire WEBP in JPG?", a: "JPG funziona ovunque — ideale per clienti, CRM o software senza supporto WEBP." },
      { q: "Perdita di qualità?", a: "JPG comprime leggermente con perdita — di solito impercettibile per foto e uso quotidiano." },
      { q: "Trasparenza conservata?", a: "No — JPG non ha trasparenza. Le aree trasparenti WEBP avranno sfondo bianco." },
    ],
  },
  "jpg-to-webp": {
    directAnswer:
      "Convertire JPG in WEBP riduce molto la dimensione mantenendo buona qualità — ideale per siti web, blog e caricamento rapido. Carica JPG, clicca converti e scarica WEBP nel browser, senza archiviazione sul server.",
    faqs: [
      { q: "Quando convertire JPG in WEBP?", a: "Per siti web, app e caricamento rapido — WEBP è spesso 25%–35% più piccolo di JPG. Per clienti legacy, mantieni JPG." },
      { q: "Perdita di qualità?", a: "WEBP comprime in modo efficiente — di solito impercettibile per foto web. Per stampa, preferisci JPG o PNG." },
      { q: "Tutti i browser supportano WEBP?", a: "Chrome, Firefox, Edge e Safari moderni sì. Browser molto vecchi no — usa JPG come fallback." },
    ],
  },
  "image-compressor": {
    faqs: [
      { q: "Quanto posso comprimere un'immagine?", a: "Dipende dal formato originale. JPG e WEBP si comprimono significativamente; PNG meno, ma il peso può comunque essere ridotto." },
      { q: "La compressione riduce la qualità?", a: "Lo strumento bilancia dimensione e qualità. Per la maggior parte dei siti web, una compressione moderata è appena percettibile." },
      { q: "In quale formato comprimere?", a: "Per foto web — WEBP o JPG. Per grafica con trasparenza — PNG compresso." },
    ],
  },
  "image-resizer": {
    faqs: [
      { q: "Il ridimensionamento riduce la qualità?", a: "Ridurre mantiene una buona qualità. Ingrandire può sfocare — partite da un file più grande se possibile." },
      { q: "Quali dimensioni posso impostare?", a: "Inserite larghezza e altezza in pixel o mantenete le proporzioni. Ideale per icone, social e siti web." },
      { q: "Quali formati sono supportati?", a: "JPG, PNG e WEBP — output nel formato scelto." },
    ],
  },
  "video-converter": {
    comparisonHeaders: { format: "Formato", bestFor: "Ideale per", size: "Dimensione", quality: "Qualità" },
    formatComparison: [
      { format: "MP4", bestFor: "YouTube, social, dispositivi", size: "Medio", quality: "Eccellente (H.264/H.265)" },
      { format: "WEBM", bestFor: "Web, Chrome", size: "Piccolo", quality: "Buona" },
      { format: "MOV", bestFor: "Montaggio su Mac", size: "Grande", quality: "Eccellente" },
      { format: "AVI", bestFor: "Compatibilità legacy", size: "Grande", quality: "Buona" },
    ],
    faqs: [
      { q: "Quale formato video è il più comune?", a: "MP4 (H.264) è lo standard per YouTube, WhatsApp, Instagram e dispositivi mobili." },
      { q: "Quanto tempo richiede la conversione video?", a: "Dipende dalla durata e dalla dimensione del file. Clip brevi (sotto un minuto) si convertono in secondi o pochi minuti." },
      { q: "C'è un limite di dimensione del file?", a: "Piano gratuito: fino a 50 MB per file. Premium: fino a 500 MB." },
    ],
  },
  "audio-converter": {
    comparisonHeaders: { format: "Formato", bestFor: "Ideale per", size: "Dimensione", quality: "Qualità" },
    formatComparison: [
      { format: "MP3", bestFor: "Ascolto, condivisione", size: "Piccolo", quality: "Buona (con perdita)" },
      { format: "WAV", bestFor: "Montaggio, studio", size: "Grande", quality: "Senza perdita" },
      { format: "FLAC", bestFor: "Collezioni musicali", size: "Medio", quality: "Senza perdita" },
      { format: "AAC", bestFor: "iPhone, streaming", size: "Piccolo", quality: "Molto buona" },
    ],
    faqs: [
      { q: "MP3 o WAV — quale scegliere?", a: "WAV per la modifica a qualità piena. MP3 per la condivisione quotidiana — file più piccolo." },
      { q: "Posso convertire brani da YouTube?", a: "Carica un file audio che hai già. Non scarichiamo contenuti da YouTube." },
      { q: "I metadati (artista, album) vengono conservati?", a: "La maggior parte dei metadati si conserva convertendo tra formati comuni." },
    ],
  },
  "mp3-to-wav": {
    directAnswer:
      "Convertire MP3 in WAV restituisce audio non compresso a qualità piena — ideale per montaggio in studio, DJ e mixaggio. Carica MP3, clicca converti e scarica WAV. Elaborazione nel browser, senza archiviazione sul server.",
    faqs: [
      { q: "Perché convertire MP3 in WAV?", a: "WAV è senza perdita — ideale per editing, mixaggio e qualità massima. MP3 è compresso e adatto all'ascolto, non all'editing professionale." },
      { q: "Il file diventerà più grande?", a: "Sì — WAV è tipicamente 5–10 volte più grande di MP3. Meglio per lo studio, non per la condivisione quotidiana." },
      { q: "Migliora la qualità dell'MP3?", a: "No — i dettagli persi nella compressione MP3 non tornano. WAV preserva ciò che resta a qualità piena senza ulteriore compressione." },
    ],
  },
  "pdf-to-word": {
    faqs: [
      { q: "La formattazione viene conservata?", a: "Lo strumento mantiene struttura del documento, titoli e tabelle. Layout molto complessi possono richiedere piccoli aggiustamenti in Word." },
      { q: "Quale versione di Word è supportata?", a: "L'output è DOCX — compatibile con Microsoft Word 2007 e successivi, Google Docs e LibreOffice." },
      { q: "Posso convertire PDF scansionati?", a: "I PDF scansionati (immagini) richiedono OCR. Per documenti scansionati, prova il nostro strumento OCR." },
    ],
  },
  "word-to-pdf": {
    faqs: [
      { q: "Perché convertire Word in PDF?", a: "Il PDF mantiene il layout su qualsiasi dispositivo — perfetto per invio, stampa e firme digitali." },
      { q: "I font vengono conservati?", a: "Sì — i font sono incorporati nel PDF così il documento appare identico ovunque." },
      { q: "DOC o DOCX?", a: "Entrambi i formati sono supportati. DOCX è consigliato per i migliori risultati." },
    ],
  },
  "docx-to-pdf": {
    directAnswer:
      "Convertire DOCX in PDF fissa layout, font e tabelle su qualsiasi dispositivo — perfetto per clienti, consegne e firme digitali. Carica DOCX, clicca converti e scarica PDF subito — nel browser, senza archiviazione sul server.",
    faqs: [
      { q: "Perché convertire DOCX in PDF?", a: "Il PDF appare identico su ogni computer e telefono — Word può spostare il layout a seconda della versione e dei font installati." },
      { q: "Font e tabelle vengono conservati?", a: "Sì — i font sono incorporati e le tabelle restano al posto giusto. Ideale per documenti ufficiali e contratti." },
      { q: "DOCX o DOC — quale è meglio?", a: "DOCX è consigliato per i migliori risultati. Anche il vecchio DOC è supportato." },
    ],
  },
  "merge-pdf": {
    faqs: [
      { q: "Come unisco file PDF?", a: "Carica tutti i file, riordina le pagine trascinandole e clicca Unisci — otterrai un unico PDF." },
      { q: "Posso ruotare le pagine?", a: "Sì — ruota le singole pagine prima del download." },
      { q: "C'è un limite di file?", a: "Piano gratuito: fino a 5 operazioni al giorno. Premium: illimitato." },
    ],
  },
  "text-tools": {
    faqs: [
      { q: "Quali formati di testo sono supportati?", a: "TXT, Markdown e HTML — con conversione bidirezionale tra loro." },
      { q: "C'è un contatore di parole?", a: "Sì — lo strumento mostra parole e caratteri in tempo reale." },
      { q: "La formattazione viene conservata?", a: "La conversione in HTML mantiene la struttura di base; stili complessi possono richiedere modifiche." },
    ],
  },
  "ai-image-generator": {
    faqs: [
      { q: "Questo strumento è gratuito?", a: "Disponibile solo per abbonati Premium. Ogni immagine costa 1 credito; Premium include 6 crediti al mese, con pacchetti aggiuntivi acquistabili." },
      { q: "Come scrivere un buon prompt?", a: "Descrivi soggetto, stile, illuminazione e sfondo in testo libero. Più la descrizione è dettagliata, migliore è il risultato." },
      { q: "Quali stili e proporzioni sono supportati?", a: "Scegli stile (realistico, artistico, cartoon, 3D e altri) e proporzione (quadrato, largo, verticale). Download in PNG." },
    ],
  },
};

const byLocale: Partial<Record<Locale, LocalizedContent>> = { he, en, es, ru, fr, de, it };

/** Top-tool SEO blocks (FAQ + optional format comparison). Falls back to English. */
export function getToolSeoContent(
  toolId: string,
  locale: Locale,
  formatSlug?: string
): ToolSeoContent | null {
  const loc = byLocale[locale] ?? en;
  if (formatSlug) {
    const slugContent = loc[formatSlug] ?? en[formatSlug];
    if (slugContent) return slugContent;
  }
  const content = loc[toolId] ?? en[toolId];
  return content ?? null;
}

/** Build a 40–60 word snippet for answer blocks from SEO content. */
export function getToolDirectAnswer(content: ToolSeoContent): string | null {
  if (content.directAnswer?.trim()) return content.directAnswer.trim();

  const words: string[] = [];
  for (const faq of content.faqs) {
    words.push(...faq.a.split(/\s+/).filter(Boolean));
    if (words.length >= 40) break;
  }
  if (words.length < 20) return null;

  const target = words.slice(0, Math.min(words.length, 58));
  let text = target.join(" ");
  if (words.length > 58) text += "…";
  return text;
}

export const TOP_TOOL_IDS = Object.keys(en);
