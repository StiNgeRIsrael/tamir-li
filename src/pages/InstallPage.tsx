import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Download, Smartphone, Check, Zap, Shield, Wifi, WifiOff, Bell, HardDrive, Star, Globe, ArrowLeft } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const benefits = [
  { icon: Zap, title: "גישה מהירה", desc: "פתחו את האפליקציה ישירות מהמסך הביתי בלחיצה אחת" },
  { icon: WifiOff, title: "עובד גם אופליין", desc: "חלק מהכלים עובדים גם ללא חיבור לאינטרנט" },
  { icon: Shield, title: "מאובטח ופרטי", desc: "הקבצים נשארים במכשיר שלכם ולא עוברים לשרת" },
  { icon: Bell, title: "עדכונים אוטומטיים", desc: "קבלו כלים חדשים ושיפורים ישירות לאפליקציה" },
  { icon: HardDrive, title: "תופס מקום מינימלי", desc: "פחות מ-2MB — לא כמו אפליקציות רגילות" },
  { icon: Globe, title: "ללא חנות אפליקציות", desc: "התקנה ישירה מהדפדפן, בלי App Store או Google Play" },
];

export default function InstallPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <AppLayout>
      <SEOHead
        title="הורד את תמיר לי — אפליקציה להמרת קבצים"
        description="התקינו את תמיר לי כאפליקציה במכשיר שלכם — גישה מהירה להמרת קבצים ישירות מהמסך הביתי. תומך באנדרואיד ואייפון."
      />
      <div className="max-w-3xl mx-auto px-4 py-8 lg:py-12 space-y-8">

        {/* Hero */}
        <section className="text-center space-y-5 animate-fade-in">
          <div className="flex items-center justify-center gap-4">
            {/* Android icon */}
            <div className="w-16 h-16 rounded-2xl bg-[hsl(120,60%,45%)]/10 border border-[hsl(120,60%,45%)]/20 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-8 h-8 text-[hsl(120,60%,45%)]" fill="currentColor">
                <path d="M17.523 15.342a1 1 0 0 1-.001-2 1 1 0 0 1 .001 2zm-11.046 0a1 1 0 0 1-.001-2 1 1 0 0 1 .001 2zm11.405-6.02l1.997-3.46a.416.416 0 0 0-.152-.567.416.416 0 0 0-.568.152L17.12 8.95c-1.46-.669-3.094-1.043-4.87-1.043-1.777 0-3.41.374-4.87 1.043L5.34 5.447a.416.416 0 0 0-.568-.152.416.416 0 0 0-.152.567l1.997 3.46C3.76 11.019 1.702 14.139 1.5 17.82h21c-.202-3.681-2.26-6.801-5.118-8.498z"/>
              </svg>
            </div>
            <Smartphone className="w-16 h-16 text-primary" />
            {/* Apple icon */}
            <div className="w-16 h-16 rounded-2xl bg-muted border border-border flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-8 h-8 text-foreground" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
            </div>
          </div>

          <h1 className="text-3xl lg:text-4xl font-extrabold text-foreground leading-tight">
            הורידו את <span className="text-primary">תמיר לי</span>
            <br />
            <span className="text-xl lg:text-2xl font-bold text-muted-foreground">כאפליקציה במכשיר שלכם</span>
          </h1>

          <p className="text-sm lg:text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
            קבלו גישה מהירה לכל כלי ההמרה ישירות מהמסך הביתי.
            עובד על אנדרואיד ואייפון — ללא הורדה מחנות האפליקציות.
          </p>

          {/* Install CTA */}
          {isInstalled ? (
            <div className="inline-flex items-center gap-2 bg-success/10 text-success font-bold px-6 py-3 rounded-xl">
              <Check className="w-5 h-5" />
              האפליקציה כבר מותקנת!
            </div>
          ) : deferredPrompt ? (
            <Button onClick={handleInstall} size="lg" className="font-bold text-base px-8 py-6 rounded-xl shadow-lg">
              <Download className="w-5 h-5 ml-2" />
              התקן עכשיו — חינם
            </Button>
          ) : (
            <Button size="lg" className="font-bold text-base px-8 py-6 rounded-xl shadow-lg" onClick={handleInstall}>
              <Download className="w-5 h-5 ml-2" />
              הורד את האפליקציה
            </Button>
          )}

          <p className="text-xs text-muted-foreground">✓ חינם לחלוטין &nbsp; ✓ פחות מ-2MB &nbsp; ✓ ללא רישום</p>
        </section>

        {/* Why download */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground text-center">למה להוריד את האפליקציה?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {benefits.map((b, i) => (
              <article key={i} className="bg-card border border-border rounded-xl p-4 space-y-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <b.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-sm text-foreground">{b.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{b.desc}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Platform instructions */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-foreground text-center">איך מתקינים?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Android */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[hsl(120,60%,45%)]/10 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-[hsl(120,60%,45%)]" fill="currentColor">
                    <path d="M17.523 15.342a1 1 0 0 1-.001-2 1 1 0 0 1 .001 2zm-11.046 0a1 1 0 0 1-.001-2 1 1 0 0 1 .001 2zm11.405-6.02l1.997-3.46a.416.416 0 0 0-.152-.567.416.416 0 0 0-.568.152L17.12 8.95c-1.46-.669-3.094-1.043-4.87-1.043-1.777 0-3.41.374-4.87 1.043L5.34 5.447a.416.416 0 0 0-.568-.152.416.416 0 0 0-.152.567l1.997 3.46C3.76 11.019 1.702 14.139 1.5 17.82h21c-.202-3.681-2.26-6.801-5.118-8.498z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-foreground">אנדרואיד</h3>
                  <p className="text-xs text-muted-foreground">Chrome / Edge / Samsung Internet</p>
                </div>
              </div>
              <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
                <li>פתחו את האתר בדפדפן Chrome</li>
                <li>לחצו על תפריט הדפדפן <span className="font-mono bg-muted px-1 rounded">⋮</span></li>
                <li>בחרו <strong className="text-foreground">"התקנת אפליקציה"</strong></li>
                <li>אישרו — האפליקציה תופיע במסך הבית</li>
              </ol>
            </div>

            {/* iOS */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-foreground" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-foreground">אייפון / אייפד</h3>
                  <p className="text-xs text-muted-foreground">Safari בלבד</p>
                </div>
              </div>
              <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
                <li>פתחו את האתר בדפדפן Safari</li>
                <li>לחצו על כפתור השיתוף <span className="font-mono bg-muted px-1 rounded">⬆</span></li>
                <li>גללו ובחרו <strong className="text-foreground">"הוסף למסך הבית"</strong></li>
                <li>לחצו <strong className="text-foreground">"הוסף"</strong> — סיימתם!</li>
              </ol>
            </div>
          </div>
        </section>

        {/* Comparison */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground text-center">אפליקציה מקורית מול תמיר לי</h2>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="grid grid-cols-3 text-xs font-bold border-b border-border">
              <div className="p-3 text-muted-foreground"></div>
              <div className="p-3 text-center text-foreground bg-primary/5">תמיר לי</div>
              <div className="p-3 text-center text-muted-foreground">אפליקציות אחרות</div>
            </div>
            {[
              { label: "מחיר", us: "חינם", them: "₪15-50/חודש" },
              { label: "גודל התקנה", us: "~2MB", them: "50-200MB" },
              { label: "נדרש רישום", us: "לא", them: "כן" },
              { label: "עדכון אוטומטי", us: "✓", them: "דרך החנות" },
              { label: "פרטיות", us: "מלאה", them: "משתנה" },
              { label: "זמינות", us: "כל מכשיר", them: "פלטפורמה ספציפית" },
            ].map((row, i) => (
              <div key={i} className={`grid grid-cols-3 text-xs ${i % 2 === 0 ? "" : "bg-muted/30"}`}>
                <div className="p-3 font-medium text-foreground">{row.label}</div>
                <div className="p-3 text-center font-semibold text-primary">{row.us}</div>
                <div className="p-3 text-center text-muted-foreground">{row.them}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="text-center space-y-4 bg-primary/5 border border-primary/20 rounded-2xl p-6">
          <Star className="w-8 h-8 text-primary mx-auto" />
          <h2 className="text-xl font-bold text-foreground">מוכנים להתחיל?</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            הורידו את תמיר לי עכשיו וקבלו גישה מהירה לכל כלי ההמרה ישירות מהמסך הביתי.
          </p>
          {isInstalled ? (
            <div className="inline-flex items-center gap-2 text-success font-bold">
              <Check className="w-5 h-5" />
              האפליקציה מותקנת — אפשר להשתמש!
            </div>
          ) : (
            <Button onClick={handleInstall} size="lg" className="font-bold px-8">
              <Download className="w-5 h-5 ml-2" />
              הורד עכשיו — חינם
            </Button>
          )}
          <p className="text-xs text-muted-foreground">
            <Link to="/" className="text-primary hover:underline">או חזרו לדף הבית</Link>
            {" "}והתחילו להמיר ישירות מהדפדפן
          </p>
        </section>

      </div>
    </AppLayout>
  );
}
