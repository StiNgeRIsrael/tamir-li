import { useEffect, useState } from "react";
import { Clock, Crown, Eye, Loader2, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PremiumPriceLabel } from "@/components/PremiumPriceLabel";
import { hasAdSurface, requireAdViewForUnlock } from "@/lib/custom-tool-freemium";
import { formatMidnightCountdown, msUntilMidnight } from "@/lib/midnight-countdown";
import { useLocale, localePath } from "@/lib/i18n";
import { markUsageUnlockedThisSession } from "@/lib/usage-unlock-session";
import { enTranslations } from "@/lib/translations/en";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onUnlocked?: () => void;
};

/** Fullscreen native gate when the free daily quota is exhausted. */
export function NativeDailyLimitGate({ open, onUnlocked }: Props) {
  const { locale, t } = useLocale();
  const p = t.premium;
  const copy =
    (t as { nativeDailyLimit?: typeof enTranslations.nativeDailyLimit }).nativeDailyLimit ??
    enTranslations.nativeDailyLimit;

  const [remainingMs, setRemainingMs] = useState(msUntilMidnight);
  const [adState, setAdState] = useState<"idle" | "loading">("idle");
  const adAvailable = hasAdSurface();

  useEffect(() => {
    if (!open) return;
    setRemainingMs(msUntilMidnight());
    const id = window.setInterval(() => setRemainingMs(msUntilMidnight()), 1000);
    return () => window.clearInterval(id);
  }, [open]);

  if (!open) return null;

  const startAd = async () => {
    if (!adAvailable) return;
    setAdState("loading");
    const completed = await requireAdViewForUnlock("native-daily-limit-rewarded");
    if (completed) {
      markUsageUnlockedThisSession();
      onUnlocked?.();
    }
    setAdState("idle");
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex flex-col bg-background/95 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="native-daily-limit-title"
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-10 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-premium/15 ring-1 ring-premium/30">
          <Crown className="h-8 w-8 text-premium" aria-hidden />
        </div>

        <div className="space-y-2">
          <h2 id="native-daily-limit-title" className="text-2xl font-extrabold text-foreground">
            {p.dailyLimitTitle}
          </h2>
          <p className="max-w-sm text-sm text-muted-foreground">{copy.desc}</p>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground">
          <Clock className="h-4 w-4 text-muted-foreground" aria-hidden />
          <span>{copy.resetsIn}</span>
          <span className="font-mono tabular-nums" dir="ltr">
            {formatMidnightCountdown(remainingMs)}
          </span>
        </div>

        <div className="flex w-full max-w-sm flex-col gap-3">
          {adAvailable && (
            <Button
              size="lg"
              variant="outline"
              className={cn("h-12 font-bold", adState === "loading" && "pointer-events-none")}
              onClick={startAd}
              disabled={adState === "loading"}
            >
              {adState === "loading" ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Eye className="h-4 w-4 me-2" aria-hidden />
              )}
              {p.watchAd}
            </Button>
          )}
          <Button asChild size="lg" className="h-12 bg-premium font-bold text-premium-foreground hover:bg-premium/90">
            <Link to={localePath("/premium", locale)}>
              <Zap className="h-4 w-4 me-2" aria-hidden />
              {p.upgradeTo} — <PremiumPriceLabel />
            </Link>
          </Button>
        </div>

        {adAvailable && <p className="text-xs text-muted-foreground">{copy.adHint}</p>}
      </div>
    </div>
  );
}
