import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Download, Smartphone, Check } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

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
        title="התקן את תמיר לי — אפליקציה להמרת קבצים"
        description="התקן את תמיר לי כאפליקציה במכשיר שלך לגישה מהירה ונוחה להמרת קבצים."
      />
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-8">
        <Smartphone className="w-16 h-16 text-primary mx-auto" />
        <h1 className="text-3xl font-extrabold">התקן את תמיר לי</h1>
        <p className="text-muted-foreground">
          התקן את האפליקציה ישירות מהדפדפן. גישה מהירה מהמסך הביתי, ללא הורדה מחנות האפליקציות.
        </p>

        {isInstalled ? (
          <div className="flex items-center justify-center gap-2 text-success font-bold">
            <Check className="w-5 h-5" />
            האפליקציה כבר מותקנת!
          </div>
        ) : deferredPrompt ? (
          <Button onClick={handleInstall} size="lg" className="font-bold">
            <Download className="w-5 h-5 ml-2" />
            התקן עכשיו
          </Button>
        ) : (
          <div className="space-y-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">איך להתקין:</p>
            <div className="bg-card border border-border rounded-xl p-4 text-right space-y-2">
              <p><strong>iPhone:</strong> לחצו על כפתור השיתוף (⬆) → "הוסף למסך הבית"</p>
              <p><strong>Android:</strong> לחצו על תפריט הדפדפן (⋮) → "התקנת אפליקציה"</p>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
