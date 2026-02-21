import { Link } from "react-router-dom";
import { tools, categoryLabels, categoryIcons, getDefaultSlug, type ToolCategory, getToolsByCategory } from "@/lib/tools-data";
import { AppLayout } from "@/components/AppLayout";
import { AdSlot } from "@/components/AdSlot";
import { PremiumBanner } from "@/components/PremiumComponents";
import { ArrowLeft, Crown, Sparkles, Shield, Zap, Globe, CheckCircle2, Image, FileVideo, FileAudio, FileText, Users, Star } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";

const categories: ToolCategory[] = ["image", "video", "audio", "document"];
const categoryColors: Record<ToolCategory, string> = {
  image: "bg-tool-image/10 text-tool-image border-tool-image/20",
  video: "bg-tool-video/10 text-tool-video border-tool-video/20",
  audio: "bg-tool-audio/10 text-tool-audio border-tool-audio/20",
  document: "bg-tool-document/10 text-tool-document border-tool-document/20",
};

const categoryBg: Record<ToolCategory, string> = {
  image: "from-tool-image/5 to-transparent",
  video: "from-tool-video/5 to-transparent",
  audio: "from-tool-audio/5 to-transparent",
  document: "from-tool-document/5 to-transparent",
};

const stats = [
  { value: "1.2M+", label: "המרות בוצעו", icon: Zap },
  { value: "50+", label: "פורמטים נתמכים", icon: Globe },
  { value: "4.8★", label: "דירוג משתמשים", icon: Star },
  { value: "100%", label: "חינם לשימוש יומי", icon: Shield },
];

const features = [
  { icon: Zap, title: "המרה מהירה", desc: "עיבוד תוך שניות, ישירות בדפדפן" },
  { icon: Shield, title: "פרטיות מלאה", desc: "הקבצים לא נשמרים בשרתים" },
  { icon: Globe, title: "ללא הורדת תוכנה", desc: "עובד בכל דפדפן ומכשיר" },
  { icon: CheckCircle2, title: "איכות מקסימלית", desc: "ללא פגיעה באיכות הקובץ" },
];

const supportedFormats = [
  { cat: "תמונות", icon: Image, formats: "JPG, PNG, WEBP, GIF, BMP, TIFF, SVG, ICO" },
  { cat: "וידאו", icon: FileVideo, formats: "MP4, AVI, MOV, MKV, WEBM" },
  { cat: "אודיו", icon: FileAudio, formats: "MP3, WAV, AAC, OGG, FLAC" },
  { cat: "מסמכים", icon: FileText, formats: "PDF, DOCX, DOC, TXT" },
];

const faqs = [
  { q: "איך ממירים קובץ?", a: "גררו את הקובץ לאזור ההעלאה, בחרו את הפורמט הרצוי, ולחצו 'התחל המרה'. תוך שניות הקובץ יהיה מוכן להורדה." },
  { q: "האם השירות באמת חינמי?", a: "כן! ניתן לבצע עד 5 המרות בחינם ביום. למנויי פרימיום (₪4.90/חודש) — המרות ללא הגבלה וללא מודעות." },
  { q: "אילו פורמטים נתמכים?", a: "אנו תומכים במגוון רחב של פורמטים: תמונות (JPG, PNG, WEBP, GIF, BMP, TIFF, SVG), וידאו (MP4, AVI, MOV, MKV, WEBM), אודיו (MP3, WAV, AAC, OGG, FLAC), ומסמכים (PDF, DOCX, TXT)." },
  { q: "האם הקבצים שלי מאובטחים?", a: "בהחלט. הקבצים מעובדים באופן מאובטח ונמחקים מיד לאחר ההמרה. אנו לא שומרים עותקים של הקבצים שלכם." },
  { q: "האם צריך להתקין תוכנה?", a: "לא. תמיר לי עובד ישירות בדפדפן, ללא צורך בהורדה או התקנה של שום תוכנה." },
  { q: "מה קורה אם הקובץ גדול מדי?", a: "בתוכנית החינמית ניתן להעלות קבצים עד 50MB. למנויי פרימיום — עד 500MB לקובץ." },
];

const Index = () => {
  return (
    <AppLayout>
      <SEOHead
        title="תמיר לי — אתר המרות הקבצים של ישראל"
        description="המרה מהירה וחינמית בין פורמטים של תמונות, וידאו, אודיו ומסמכים. גרור קבצים, בחר פורמט, וסיימת. ללא הורדת תוכנה."
      />
      <div className="max-w-5xl mx-auto px-4 py-6 lg:py-10 space-y-8">

        {/* Hero — compact */}
        <section className="text-center space-y-3 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5" />
            כלים חינמיים להמרת קבצים
          </div>
          <h1 className="text-3xl lg:text-5xl font-extrabold text-foreground leading-tight">
            המרו כל קובץ,{" "}
            <span className="text-primary">תוך שניות</span>
          </h1>
          <p className="text-sm lg:text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
            תמונות, וידאו, אודיו ומסמכים — גררו, בחרו פורמט, וסיימתם.
            <br className="hidden sm:block" />
            ללא הורדת תוכנה. ללא רישום. חינם.
          </p>
        </section>

        {/* Stats bar */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((s, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-3 text-center space-y-1">
              <s.icon className="w-4 h-4 mx-auto text-primary" />
              <p className="text-lg font-extrabold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </section>

        <AdSlot type="banner" />

        {/* All tools by category — compact grid */}
        {categories.map((cat) => {
          const Icon = categoryIcons[cat];
          const catTools = getToolsByCategory(cat);
          return (
            <section key={cat} className={`rounded-2xl border border-border bg-gradient-to-br ${categoryBg[cat]} p-4 space-y-3`}>
              <h2 className="text-base font-bold flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${categoryColors[cat]}`}>
                  <Icon className="w-4 h-4" />
                </div>
                {categoryLabels[cat]}
                <span className="text-xs font-normal text-muted-foreground">({catTools.length} כלים)</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {catTools.map((tool) => {
                  const TIcon = tool.icon;
                  return (
                    <Link
                      key={tool.id}
                      to={`/${getDefaultSlug(tool)}`}
                      className="flex items-center gap-3 bg-card/80 hover:bg-card border border-border/50 hover:border-primary/30 rounded-xl p-3 transition-all duration-200 hover:shadow-md group"
                    >
                      <TIcon className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-sm text-foreground">{tool.name}</span>
                          {tool.premium && <Crown className="w-3 h-3 text-premium" />}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{tool.description}</p>
                      </div>
                      <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary shrink-0 transition-colors" />
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}

        {/* Premium Banner */}
        <PremiumBanner />

        {/* Features grid */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-foreground text-center">למה 1.2 מיליון ישראלים בוחרים בתמיר לי?</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {features.map((f, i) => (
              <article key={i} className="bg-card border border-border rounded-xl p-4 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-sm text-foreground">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </article>
            ))}
          </div>
        </section>

        <AdSlot type="inline" />

        {/* Supported formats table */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">פורמטים נתמכים</h2>
          <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
            {supportedFormats.map((f, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <f.icon className="w-4 h-4 text-primary shrink-0" />
                <span className="font-medium text-sm text-foreground w-16 shrink-0">{f.cat}</span>
                <p className="text-xs text-muted-foreground font-mono">{f.formats}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-foreground text-center">איך זה עובד?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { step: "1", title: "העלו קובץ", desc: "גררו או בחרו את הקבצים שלכם" },
              { step: "2", title: "בחרו פורמט", desc: "בחרו את הפורמט הרצוי מהרשימה" },
              { step: "3", title: "הורידו", desc: "הקובץ המומר מוכן להורדה תוך שניות" },
            ].map((s, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 text-center space-y-2 relative">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center mx-auto">
                  {s.step}
                </div>
                <h3 className="font-semibold text-sm text-foreground">{s.title}</h3>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground text-center">מה אומרים המשתמשים שלנו</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { name: "רוני מ.", text: "הכי נוח ומהיר שיש! ממיר תמונות כל יום בלי בעיה.", stars: 5 },
              { name: "שרה כ.", text: "סוף סוף אתר בעברית שעובד כמו שצריך. ממליצה בחום!", stars: 5 },
              { name: "אורי ד.", text: "עובד מעולה מהנייד. גם PDF ל-Word יוצא מצוין.", stars: 5 },
            ].map((t, i) => (
              <article key={i} className="bg-card border border-border rounded-xl p-4 space-y-2">
                <div className="flex gap-0.5">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} className="w-3.5 h-3.5 text-premium fill-premium" />
                  ))}
                </div>
                <p className="text-sm text-foreground leading-relaxed">"{t.text}"</p>
                <p className="text-xs text-muted-foreground font-medium">{t.name}</p>
              </article>
            ))}
          </div>
        </section>

        {/* FAQ for SEO */}
        <section className="space-y-3" itemScope itemType="https://schema.org/FAQPage">
          <h2 className="text-lg font-bold text-foreground">שאלות נפוצות</h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <details key={i} className="bg-card border border-border rounded-xl group" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                <summary className="p-3 cursor-pointer font-medium text-foreground text-sm flex items-center justify-between" itemProp="name">
                  {faq.q}
                  <ArrowLeft className="w-4 h-4 text-muted-foreground transition-transform group-open:-rotate-90 shrink-0" />
                </summary>
                <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                  <p className="px-3 pb-3 text-sm text-muted-foreground" itemProp="text">{faq.a}</p>
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* SEO rich text */}
        <section className="bg-card border border-border rounded-xl p-5 space-y-3">
          <h2 className="text-base font-bold text-foreground">תמיר לי — אתר המרות הקבצים המוביל בישראל</h2>
          <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
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
              האתר עובד ישירות מהדפדפן, ללא צורך בהורדת תוכנה, ומותאם לכל מכשיר — מחשב, טאבלט ונייד.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-xs text-muted-foreground py-4 border-t border-border space-y-1">
          <p>© 2026 תמיר לי • אתר המרות הקבצים של ישראל • כל הזכויות שמורות</p>
          <p>
            <Link to="/install" className="text-primary hover:underline">התקן כאפליקציה</Link>
            {" • "}
            <span>תנאי שימוש</span>
            {" • "}
            <span>מדיניות פרטיות</span>
          </p>
        </footer>
      </div>
    </AppLayout>
  );
};

export default Index;
