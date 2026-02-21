import { Link } from "react-router-dom";
import { Wrench } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border pt-8 pb-6 space-y-8 max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 lg:gap-8">
        <div className="space-y-3">
          <h4 className="font-bold text-sm text-foreground">כלים פופולריים</h4>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li><Link to="/jpg-to-png" className="hover:text-foreground transition-colors">JPG ל-PNG</Link></li>
            <li><Link to="/png-to-jpg" className="hover:text-foreground transition-colors">PNG ל-JPG</Link></li>
            <li><Link to="/webp-to-jpg" className="hover:text-foreground transition-colors">WEBP ל-JPG</Link></li>
            <li><Link to="/svg-to-png" className="hover:text-foreground transition-colors">SVG ל-PNG</Link></li>
            <li><Link to="/png-to-ico" className="hover:text-foreground transition-colors">PNG ל-ICO</Link></li>
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="font-bold text-sm text-foreground">מסמכים ואודיו</h4>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li><Link to="/pdf-to-docx" className="hover:text-foreground transition-colors">PDF ל-Word</Link></li>
            <li><Link to="/docx-to-pdf" className="hover:text-foreground transition-colors">Word ל-PDF</Link></li>
            <li><Link to="/merge-pdf" className="hover:text-foreground transition-colors">מנהל PDF</Link></li>
            <li><Link to="/mp3-to-wav" className="hover:text-foreground transition-colors">MP3 ל-WAV</Link></li>
            <li><Link to="/text-tools" className="hover:text-foreground transition-colors">כלי טקסט</Link></li>
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="font-bold text-sm text-foreground">כלים מתקדמים</h4>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li><Link to="/image-compressor" className="hover:text-foreground transition-colors">דחיסת תמונה</Link></li>
            <li><Link to="/image-resizer" className="hover:text-foreground transition-colors">שינוי גודל תמונה</Link></li>
            <li><Link to="/ai-image-generator" className="hover:text-foreground transition-colors">יצירת תמונות AI ✨</Link></li>
            <li><Link to="/mp4-to-avi" className="hover:text-foreground transition-colors">המרת וידאו</Link></li>
            <li><Link to="/video-compressor" className="hover:text-foreground transition-colors">דחיסת וידאו</Link></li>
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="font-bold text-sm text-foreground">תמיר לי</h4>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li><Link to="/install" className="hover:text-foreground transition-colors">התקן כאפליקציה</Link></li>
            <li><span className="cursor-default">תנאי שימוש</span></li>
            <li><span className="cursor-default">מדיניות פרטיות</span></li>
            <li><span className="cursor-default">צור קשר</span></li>
            <li><span className="cursor-default">אודות</span></li>
          </ul>
        </div>
      </div>

      {/* SEO text */}
      <div className="text-sm text-muted-foreground space-y-2 leading-relaxed pt-6 border-t border-border">
        <h2 className="text-base font-bold text-foreground">תמיר לי — אתר המרות הקבצים המוביל בישראל</h2>
        <p>
          תמיר לי הוא אתר ההמרות המוביל בישראל, המאפשר המרה מהירה וחינמית בין פורמטים שונים של קבצים.
          בין אם אתם צריכים להמיר תמונה מ-PNG ל-JPG, לדחוס סרטון לשליחה ב-WhatsApp, להמיר שיר מ-WAV ל-MP3, או להפוך מסמך PDF ל-Word לעריכה — תמיר לי עושה את זה תוך שניות.
        </p>
        <p>
          האתר תומך במגוון רחב של פורמטים: תמונות (JPG, PNG, WEBP, GIF, BMP, TIFF, SVG, ICO), וידאו (MP4, AVI, MOV, MKV, WEBM), אודיו (MP3, WAV, AAC, OGG, FLAC), ומסמכים (PDF, DOCX, DOC, TXT).
          כל ההמרות מתבצעות באופן מאובטח — הקבצים אינם נשמרים על השרתים שלנו ונמחקים מיד לאחר העיבוד.
        </p>
        <p>
          תמיר לי זמין בחינם עם עד 5 המרות ביום. למשתמשים שצריכים יותר, מנוי פרימיום ב-₪4.90 לחודש מציע המרות ללא הגבלה, ללא מודעות, ועיבוד מהיר יותר.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
            <Wrench className="w-3 h-3 text-primary-foreground" />
          </div>
          <span className="font-bold text-sm text-foreground">תמיר לי</span>
          <span className="text-xs text-muted-foreground">— אתר המרות הקבצים של ישראל</span>
        </div>
        <p className="text-[11px] text-muted-foreground">© {new Date().getFullYear()} תמיר לי • כל הזכויות שמורות</p>
      </div>
    </footer>
  );
}
