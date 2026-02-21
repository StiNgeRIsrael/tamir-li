import { Link } from "react-router-dom";
import { tools, categoryLabels, categoryIcons, getDefaultSlug, type ToolCategory, getToolsByCategory } from "@/lib/tools-data";
import { AppLayout } from "@/components/AppLayout";
import { AdSlot } from "@/components/AdSlot";
import { PremiumBanner } from "@/components/PremiumComponents";
import { ArrowLeft, Crown, Sparkles, Shield, Zap, Globe, CheckCircle2, Image, FileVideo, FileAudio, FileText, Star } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";

const categories: ToolCategory[] = ["image", "video", "audio", "document", "ai"];
const categoryColors: Record<ToolCategory, string> = {
  image: "bg-tool-image/10 text-tool-image border-tool-image/20",
  video: "bg-tool-video/10 text-tool-video border-tool-video/20",
  audio: "bg-tool-audio/10 text-tool-audio border-tool-audio/20",
  document: "bg-tool-document/10 text-tool-document border-tool-document/20",
  ai: "bg-premium/10 text-premium border-premium/20",
};

const categoryBg: Record<ToolCategory, string> = {
  image: "from-tool-image/5 to-transparent",
  video: "from-tool-video/5 to-transparent",
  audio: "from-tool-audio/5 to-transparent",
  document: "from-tool-document/5 to-transparent",
  ai: "from-premium/5 to-transparent",
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
      <div className="w-full">

        {/* Hero + Stats */}
        <section className="py-8 lg:py-12 xl:py-14 px-4 animate-fade-in">
          <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto">
            <div className="flex flex-col xl:flex-row xl:items-center xl:gap-12">
              <div className="xl:flex-1 text-center xl:text-right space-y-3 lg:space-y-4">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs lg:text-sm font-semibold px-4 py-1.5 rounded-full">
                  <Sparkles className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                  כלים חינמיים להמרת קבצים
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-foreground leading-tight">
                  המירו כל קובץ,{" "}
                  <span className="text-primary">תוך שניות</span>
                </h1>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl xl:max-w-none leading-relaxed mx-auto xl:mx-0">
                  תמונות, וידאו, אודיו ומסמכים — גררו, בחרו פורמט, וסיימתם.
                  <br className="hidden sm:block" />
                  ללא הורדת תוכנה. ללא רישום. חינם.
                </p>
              </div>

              <div className="mt-6 xl:mt-0 xl:w-[380px] shrink-0">
                <div className="grid grid-cols-2 gap-3">
                  {stats.map((s, i) => (
                    <div key={i} className="bg-card border border-border rounded-xl p-3 lg:p-4 flex items-center gap-3">
                      <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <s.icon className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-lg lg:text-xl font-extrabold text-foreground leading-none">{s.value}</p>
                        <p className="text-[11px] lg:text-xs text-muted-foreground mt-0.5">{s.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main content */}
        <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pb-8 lg:pb-12 space-y-6 lg:space-y-8">

          <AdSlot type="banner" />

          {/* Tools by category */}
          {categories.map((cat) => {
            const Icon = categoryIcons[cat];
            const catTools = getToolsByCategory(cat);
            return (
              <section key={cat} className={`rounded-2xl border border-border bg-gradient-to-br ${categoryBg[cat]} p-4 lg:p-6 space-y-3 lg:space-y-4`}>
                <h2 className="text-base lg:text-lg font-bold flex items-center gap-2">
                  <div className={`w-7 h-7 lg:w-8 lg:h-8 rounded-lg flex items-center justify-center ${categoryColors[cat]}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {categoryLabels[cat]}
                  <span className="text-xs font-normal text-muted-foreground">({catTools.length} כלים)</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 lg:gap-3">
                  {catTools.map((tool) => {
                    const TIcon = tool.icon;
                    return (
                      <Link
                        key={tool.id}
                        to={`/${getDefaultSlug(tool)}`}
                        className="flex items-center gap-2.5 bg-card/80 hover:bg-card border border-border/50 hover:border-primary/30 rounded-xl p-3 lg:p-3.5 transition-all duration-200 hover:shadow-md group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary/5 group-hover:bg-primary/10 flex items-center justify-center shrink-0 transition-colors">
                          <TIcon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
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

          {/* Why choose us — standalone full-width */}
          <section className="space-y-4">
            <h2 className="text-lg lg:text-xl font-bold text-foreground">למה 1.2 מיליון ישראלים בוחרים בתמיר לי?</h2>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              {features.map((f, i) => (
                <article key={i} className="bg-card border border-border rounded-xl p-3.5 lg:p-4 text-center space-y-2">
                  <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <f.icon className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-xs lg:text-sm text-foreground">{f.title}</h3>
                  <p className="text-[11px] lg:text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                </article>
              ))}
            </div>
          </section>

          {/* Supported formats + How it works — side by side on desktop */}
          <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 xl:gap-8">
            <div className="space-y-4">
              <h2 className="text-lg lg:text-xl font-bold text-foreground">פורמטים נתמכים</h2>
              <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
                {supportedFormats.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 lg:p-3.5">
                    <f.icon className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-medium text-sm text-foreground w-14 shrink-0">{f.cat}</span>
                    <p className="text-[11px] lg:text-xs text-muted-foreground font-mono">{f.formats}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg lg:text-xl font-bold text-foreground">איך זה עובד?</h2>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { step: "1", title: "העלו קובץ", desc: "גררו או בחרו קבצים" },
                  { step: "2", title: "בחרו פורמט", desc: "בחרו פורמט מהרשימה" },
                  { step: "3", title: "הורידו", desc: "מוכן תוך שניות" },
                ].map((s, i) => (
                  <div key={i} className="bg-card border border-border rounded-xl p-3.5 lg:p-4 text-center space-y-2">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center mx-auto">
                      {s.step}
                    </div>
                    <h3 className="font-semibold text-xs lg:text-sm text-foreground">{s.title}</h3>
                    <p className="text-[11px] lg:text-xs text-muted-foreground">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <AdSlot type="inline" />

          {/* Testimonials — standalone, 3 cards per row */}
          <section className="space-y-4">
            <h2 className="text-lg lg:text-xl font-bold text-foreground">מה אומרים המשתמשים שלנו</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { name: "רוני מ.", text: "הכי נוח ומהיר שיש! ממיר תמונות כל יום בלי בעיה.", stars: 5 },
                { name: "שרה כ.", text: "סוף סוף אתר בעברית שעובד כמו שצריך. ממליצה בחום!", stars: 5 },
                { name: "אורי ד.", text: "עובד מעולה מהנייד. גם PDF ל-Word יוצא מצוין.", stars: 5 },
              ].map((t, i) => (
                <article key={i} className="bg-card border border-border rounded-xl p-3.5 lg:p-4 flex items-start gap-3">
                  <div className="flex gap-0.5 shrink-0 mt-0.5">
                    {Array.from({ length: t.stars }).map((_, j) => (
                      <Star key={j} className="w-3 h-3 text-premium fill-premium" />
                    ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground leading-relaxed">"{t.text}"</p>
                    <p className="text-xs text-muted-foreground font-medium mt-1">{t.name}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* FAQ — standalone, 3 columns on desktop */}
          <section className="space-y-3" itemScope itemType="https://schema.org/FAQPage">
            <h2 className="text-lg lg:text-xl font-bold text-foreground">שאלות נפוצות</h2>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
              {[0, 1, 2].map((col) => (
                <div key={col} className="space-y-2">
                  {faqs.slice(col * 2, col * 2 + 2).map((faq, i) => (
                    <details key={i} className="bg-card border border-border rounded-xl group" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                      <summary className="p-3 lg:p-3.5 cursor-pointer font-medium text-foreground text-sm flex items-center justify-between" itemProp="name">
                        {faq.q}
                        <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground transition-transform group-open:-rotate-90 shrink-0" />
                      </summary>
                      <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                        <p className="px-3 lg:px-3.5 pb-3 lg:pb-3.5 text-sm text-muted-foreground leading-relaxed" itemProp="text">{faq.a}</p>
                      </div>
                    </details>
                  ))}
                </div>
              ))}
            </div>
          </section>
        </div>

      </div>
    </AppLayout>
  );
};

export default Index;
