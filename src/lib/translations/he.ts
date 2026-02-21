export const heTranslations: Record<string, any> = {
  // Brand
  brandName: "תמיר לי",
  brandTagline: "אתר המרות הקבצים של ישראל",

  // Navbar
  downloadApp: "הורד אפליקציה",

  // Categories
  categories: {
    image: "תמונות",
    video: "וידאו",
    audio: "אודיו",
    document: "מסמכים",
    ai: "יצירה עם AI",
  },

  // Homepage
  hero: {
    badge: "כלים חינמיים להמרת קבצים",
    title: "המירו כל קובץ,",
    titleHighlight: "תוך שניות",
    subtitle: "תמונות, וידאו, אודיו ומסמכים — גררו, בחרו פורמט, וסיימתם.",
    subtitleLine2: "ללא הורדת תוכנה. ללא רישום. חינם.",
  },
  stats: [
    { value: "1.2M+", label: "המרות בוצעו" },
    { value: "50+", label: "פורמטים נתמכים" },
    { value: "4.8★", label: "דירוג משתמשים" },
    { value: "100%", label: "חינם לשימוש יומי" },
  ],
  toolCount: (n: number) => `(${n} כלים)`,
  whyChoose: "למה 1.2 מיליון ישראלים בוחרים בתמיר לי?",
  features: [
    { title: "המרה מהירה", desc: "עיבוד תוך שניות, ישירות בדפדפן" },
    { title: "פרטיות מלאה", desc: "הקבצים לא נשמרים בשרתים" },
    { title: "ללא הורדת תוכנה", desc: "עובד בכל דפדפן ומכשיר" },
    { title: "איכות מקסימלית", desc: "ללא פגיעה באיכות הקובץ" },
  ],
  supportedFormats: "פורמטים נתמכים",
  formatCategories: [
    { cat: "תמונות", formats: "JPG, PNG, WEBP, GIF, BMP, TIFF, SVG, ICO" },
    { cat: "וידאו", formats: "MP4, AVI, MOV, MKV, WEBM" },
    { cat: "אודיו", formats: "MP3, WAV, AAC, OGG, FLAC" },
    { cat: "מסמכים", formats: "PDF, DOCX, DOC, TXT" },
  ],
  howItWorks: "איך זה עובד?",
  steps: [
    { step: "1", title: "העלו קובץ", desc: "גררו או בחרו קבצים" },
    { step: "2", title: "בחרו פורמט", desc: "בחרו פורמט מהרשימה" },
    { step: "3", title: "הורידו", desc: "מוכן תוך שניות" },
  ],
  testimonials: {
    title: "מה אומרים המשתמשים שלנו",
    items: [
      { name: "רוני מ.", text: "הכי נוח ומהיר שיש! ממיר תמונות כל יום בלי בעיה." },
      { name: "שרה כ.", text: "סוף סוף אתר בעברית שעובד כמו שצריך. ממליצה בחום!" },
      { name: "אורי ד.", text: "עובד מעולה מהנייד. גם PDF ל-Word יוצא מצוין." },
    ],
  },
  faqTitle: "שאלות נפוצות",
  faqs: [
    { q: "איך ממירים קובץ?", a: "גררו את הקובץ לאזור ההעלאה, בחרו את הפורמט הרצוי, ולחצו 'התחל המרה'. תוך שניות הקובץ יהיה מוכן להורדה." },
    { q: "האם השירות באמת חינמי?", a: "כן! ניתן לבצע עד 5 המרות בחינם ביום. למנויי פרימיום (₪4.90/חודש) — המרות ללא הגבלה וללא מודעות." },
    { q: "אילו פורמטים נתמכים?", a: "אנו תומכים במגוון רחב של פורמטים: תמונות (JPG, PNG, WEBP, GIF, BMP, TIFF, SVG), וידאו (MP4, AVI, MOV, MKV, WEBM), אודיו (MP3, WAV, AAC, OGG, FLAC), ומסמכים (PDF, DOCX, TXT)." },
    { q: "האם הקבצים שלי מאובטחים?", a: "בהחלט. הקבצים מעובדים באופן מאובטח ונמחקים מיד לאחר ההמרה. אנו לא שומרים עותקים של הקבצים שלכם." },
    { q: "האם צריך להתקין תוכנה?", a: "לא. תמיר לי עובד ישירות בדפדפן, ללא צורך בהורדה או התקנה של שום תוכנה." },
    { q: "מה קורה אם הקובץ גדול מדי?", a: "בתוכנית החינמית ניתן להעלות קבצים עד 50MB. למנויי פרימיום — עד 500MB לקובץ." },
  ],

  // Tool page
  tool: {
    notFound: "כלי לא נמצא",
    backHome: "חזור לדף הבית",
    convertTitle: (from: string, to: string) => `המרת ${from} ל-${to}`,
    convertDesc: (from: string, to: string) => `המירו קבצי ${from} ל-${to} בחינם, ישירות בדפדפן. מהיר, מאובטח, וללא הורדת תוכנה. תמיר לי — אתר המרות הקבצים של ישראל.`,
    breadcrumbHome: "דף הבית",
    from: "מ:",
    to: "ל:",
    whyUs: "למה תמיר לי?",
    secure: "מאובטח — הקבצים לא נשמרים",
    fast: "מהיר — עיבוד תוך שניות",
    online: "אונליין — ללא הורדת תוכנה",
    free: "חינם — עד 5 המרות ביום",
    secureBadge: "מאובטח",
    fastBadge: "מהיר",
    onlineBadge: "אונליין",
    freeBadge: "חינם",
    moreConversions: "המרות נוספות",
    conversionDone: "ההמרה הושלמה!",
    download: "הורד",
    downloadAll: "הורד הכל",
    moreConversion: "המרה נוספת",
    addFiles: "הוסף קבצים",
    convert: "המר",
    convertN: (n: number) => `המר ${n > 1 ? `${n} קבצים` : ""}`,
    converting: "ממיר...",
    done: "הושלם",
    convertingWait: "ממיר קבצים... אנא המתן",
    howToTitle: (name: string, from: string, to: string, isCustom: boolean) =>
      isCustom ? `איך להשתמש ב${name}?` : `איך להמיר ${from} ל-${to}?`,
    howToSteps: (name: string, from: string, to: string, isCustom: boolean) => [
      { step: "1", title: isCustom ? "העלו קובץ" : `העלו קובץ ${from}`, desc: "גררו או בחרו את הקבצים שלכם" },
      { step: "2", title: isCustom ? "הגדירו אפשרויות" : `בחרו ${to}`, desc: isCustom ? "בחרו את ההגדרות הרצויות" : "הפורמט כבר מוגדר — אפשר לשנות" },
      { step: "3", title: "הורידו את התוצאה", desc: "הקובץ מוכן תוך שניות" },
    ],
    seoTitle: (name: string, from: string, to: string, isCustom: boolean) =>
      isCustom ? name : `המרת ${from} ל-${to} אונליין`,
    seoText: (name: string, from: string, to: string, isCustom: boolean) =>
      `תמיר לי מאפשר לכם ${isCustom ? `להשתמש ב${name}` : `להמיר קבצי ${from} ל-${to}`} בחינם, ישירות בדפדפן. אין צורך להוריד תוכנה או להירשם — פשוט העלו את הקובץ, ${isCustom ? "הגדירו את האפשרויות הרצויות" : "בחרו את הפורמט הרצוי"}, ולחצו "המר". הקבצים שלכם מעובדים באופן מאובטח ואינם נשמרים על השרתים שלנו.`,
    seoFormats: (fromFmts: string[], toFmts: string[]) =>
      `הכלי תומך בהמרה בין כל הפורמטים: ${fromFmts.join(", ")} → ${toFmts.join(", ")}. ניתן לבצע עד 5 המרות בחינם ביום. צריכים יותר? שדרגו לפרימיום ב-₪4.90 בלבד לחודש.`,
  },

  // Tool names (keyed by tool id)
  toolNames: {
    "image-converter": "המרת פורמט תמונה",
    "image-compressor": "דחיסת תמונה",
    "image-resizer": "שינוי גודל תמונה",
    "png-to-ico": "PNG ל-ICO",
    "svg-to-png": "SVG ל-PNG",
    "video-converter": "המרת פורמט וידאו",
    "video-compressor": "דחיסת וידאו",
    "audio-converter": "המרת פורמט אודיו",
    "pdf-to-word": "PDF ל-Word",
    "word-to-pdf": "Word ל-PDF",
    "merge-pdf": "מנהל PDF",
    "text-tools": "כלי טקסט",
    "ai-image-generator": "יצירת תמונות AI",
  },
  toolDescriptions: {
    "image-converter": "המרה בין JPG, PNG, WEBP, GIF, BMP, TIFF ועוד",
    "image-compressor": "הקטנת משקל תמונות בלי לפגוע באיכות",
    "image-resizer": "שנה את הרזולוציה של התמונה בקלות",
    "png-to-ico": "צור אייקונים לאתר או לאפליקציה",
    "svg-to-png": "המר קבצי SVG לתמונות PNG",
    "video-converter": "המרה בין MP4, AVI, MOV, MKV, WEBM",
    "video-compressor": "הקטנת משקל וידאו לשליחה קלה",
    "audio-converter": "המרה בין MP3, WAV, AAC, OGG, FLAC",
    "pdf-to-word": "המר מסמכי PDF לקבצי Word לעריכה",
    "word-to-pdf": "המר מסמכי Word לפורמט PDF",
    "merge-pdf": "מזג, סדר מחדש, סובב והורד קבצי PDF",
    "text-tools": "המרה בין טקסט, Markdown ו-HTML, ספירת מילים ועוד",
    "ai-image-generator": "צרו תמונות מדהימות מטקסט באמצעות בינה מלאכותית",
  },

  // Footer
  footer: {
    popularTools: "כלים פופולריים",
    docsAndAudio: "מסמכים ואודיו",
    advancedTools: "כלים מתקדמים",
    brand: "תמיר לי",
    installApp: "התקן כאפליקציה",
    blogAndGuides: "בלוג ומדריכים",
    terms: "תנאי שימוש",
    privacy: "מדיניות פרטיות",
    contact: "צור קשר",
    about: "אודות",
    seoTitle: "תמיר לי — אתר המרות הקבצים המוביל בישראל",
    seoText1: "תמיר לי הוא אתר ההמרות המוביל בישראל, המאפשר המרה מהירה וחינמית בין פורמטים שונים של קבצים. בין אם אתם צריכים להמיר תמונה מ-PNG ל-JPG, לדחוס סרטון לשליחה ב-WhatsApp, להמיר שיר מ-WAV ל-MP3, או להפוך מסמך PDF ל-Word לעריכה — תמיר לי עושה את זה תוך שניות.",
    seoText2: "האתר תומך במגוון רחב של פורמטים: תמונות (JPG, PNG, WEBP, GIF, BMP, TIFF, SVG, ICO), וידאו (MP4, AVI, MOV, MKV, WEBM), אודיו (MP3, WAV, AAC, OGG, FLAC), ומסמכים (PDF, DOCX, DOC, TXT). כל ההמרות מתבצעות באופן מאובטח — הקבצים אינם נשמרים על השרתים שלנו ונמחקים מיד לאחר העיבוד.",
    seoText3: "תמיר לי זמין בחינם עם עד 5 המרות ביום. למשתמשים שצריכים יותר, מנוי פרימיום ב-₪4.90 לחודש מציע המרות ללא הגבלה, ללא מודעות, ועיבוד מהיר יותר.",
    copyright: (year: number) => `© ${year} תמיר לי • כל הזכויות שמורות`,
  },

  // Blog
  blog: {
    title: "בלוג — מדריכים וטיפים",
    seoTitle: "בלוג — מדריכים וטיפים להמרת קבצים | תמיר לי",
    seoDesc: "מדריכים, טיפים, והשוואות מקצועיות על המרת תמונות, וידאו, אודיו ומסמכים. הכל בעברית, חינם.",
    subtitle: "מדריכים מקצועיים, השוואות פורמטים, וטיפים מעשיים להמרת קבצים. הכל בעברית ובחינם.",
    readTime: (n: number) => `${n} דק׳ קריאה`,
    notFound: "מאמר לא נמצא",
    backToBlog: "חזרו לבלוג",
    relatedArticles: "מאמרים נוספים",
    allArticles: "כל המאמרים",
    relevantTools: "כלים רלוונטיים",
    relevantToolsInline: "כלים רלוונטיים באתר",
    readingMinutes: "דקות קריאה",
  },

  // SEO
  seo: {
    homeTitle: "תמיר לי — אתר המרות הקבצים של ישראל",
    homeDesc: "המרה מהירה וחינמית בין פורמטים של תמונות, וידאו, אודיו ומסמכים. גרור קבצים, בחר פורמט, וסיימת. ללא הורדת תוכנה.",
  },

  // Install page
  install: {
    title: "הורד את תמיר לי",
    subtitle: "כאפליקציה במכשיר שלכם",
    seoTitle: "הורד את תמיר לי — אפליקציה להמרת קבצים",
    seoDesc: "התקינו את תמיר לי כאפליקציה במכשיר שלכם — גישה מהירה להמרת קבצים ישירות מהמסך הביתי.",
  },

  // Language switcher
  switchLanguage: "שפה",
};
