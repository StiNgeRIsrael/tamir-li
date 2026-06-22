import { Crown, Zap, Play, Eye, CheckCircle2, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useLocale, localePath } from "@/lib/i18n";
import { Link } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";

export function PremiumBanner() {
  const { locale, t } = useLocale();
  const p = t.premium;
  return (
    <div className="premium-banner flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[hsl(var(--premium-foreground)/0.15)] flex items-center justify-center">
          <Crown className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-base">{p.upgradeTo}</h3>
          <p className="text-sm opacity-90">{p.unlimitedNoAds}</p>
        </div>
      </div>
      <Button asChild className="bg-[hsl(var(--premium-foreground))] text-[hsl(var(--premium))] hover:bg-[hsl(var(--premium-foreground)/0.9)] font-bold whitespace-nowrap">
        <Link to={localePath("/premium", locale)}>
          <Zap className="w-4 h-4 me-1" />
          {p.price}
        </Link>
      </Button>
    </div>
  );
}

export function PremiumLock({ onUnlock }: { onUnlock?: () => void }) {
  const { locale, t } = useLocale();
  const { isPremium } = useSubscription();
  const p = t.premium;
  const [adState, setAdState] = useState<"idle" | "watching" | "done">("idle");
  const [countdown, setCountdown] = useState(15);

  useEffect(() => {
    if (adState !== "watching") return;
    if (countdown <= 0) { setAdState("done"); onUnlock?.(); return; }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [adState, countdown, onUnlock]);

  if (isPremium) return null;

  const startAd = () => { setAdState("watching"); setCountdown(15); };

  if (adState === "done") {
    return (
      <div className="text-center py-6 px-4 bg-success/5 rounded-xl border border-success/30 animate-fade-in space-y-3">
        <CheckCircle2 className="w-10 h-10 text-success mx-auto" />
        <h3 className="font-bold text-lg text-foreground">{p.unlockTitle}</h3>
        <p className="text-sm text-muted-foreground">{p.unlockDesc}</p>
      </div>
    );
  }

  if (adState === "watching") {
    return (
      <div className="text-center py-8 px-4 bg-card rounded-xl border border-border animate-fade-in space-y-4">
        <div className="bg-muted rounded-xl aspect-video max-w-md mx-auto flex flex-col items-center justify-center gap-3 border border-border">
          <Play className="w-10 h-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{p.adPlaying}</p>
        </div>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Timer className="w-4 h-4" />
          <span>{p.closeIn(countdown)}</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden max-w-xs mx-auto">
          <div className="h-full bg-primary rounded-full transition-all duration-1000 ease-linear" style={{ width: `${((15 - countdown) / 15) * 100}%` }} />
        </div>
      </div>
    );
  }

  return (
    <div className="text-center py-6 px-4 bg-muted/50 rounded-xl border border-border space-y-5">
      <Crown className="w-10 h-10 text-premium mx-auto" />
      <h3 className="font-bold text-lg text-foreground">{p.lockTitle}</h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">{p.lockDesc}</p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Button onClick={startAd} variant="outline" className="font-bold border-primary/30 hover:bg-primary/5" size="lg">
          <Eye className="w-4 h-4 me-2" />{p.watchAd}
        </Button>
        <span className="text-xs text-muted-foreground">{p.or}</span>
        <Button asChild className="bg-premium text-premium-foreground hover:bg-premium/90 font-bold" size="lg">
          <Link to={localePath("/premium", locale)}>
            <Zap className="w-4 h-4 me-1" />{p.upgradeBtn(p.price)}
          </Link>
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{p.adDuration}</p>
    </div>
  );
}

export function UsageLimitNotice({ used, max }: { used: number; max: number }) {
  const { locale, t } = useLocale();
  const p = t.premium;
  const remaining = max - used;
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{p.dailyUsage}</span>
        <span className="text-sm text-muted-foreground">{p.remaining(remaining)}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${Math.min((used / max) * 100, 100)}%` }} />
      </div>
      {remaining <= 2 && (
        <p className="text-xs text-accent font-medium">
          <Zap className="w-3 h-3 inline me-1" />{p.almostDone(p.price)}
        </p>
      )}
    </div>
  );
}

export function ConversionSuccessUsage({ used, max }: { used: number; max: number }) {
  const { locale, t } = useLocale();
  const p = t.premium;
  const remaining = max - used;
  return (
    <div className="bg-muted/50 border border-border rounded-xl p-4 text-center space-y-2 animate-fade-in">
      <p className="text-sm text-muted-foreground">{p.remainingToday(remaining)}</p>
      {remaining <= 2 ? (
        <Button asChild className="bg-premium text-premium-foreground hover:bg-premium/90 font-bold text-sm">
          <Link to={localePath("/premium", locale)}>
            <Zap className="w-3.5 h-3.5 me-1" />{p.upgradeNow(p.price)}
          </Link>
        </Button>
      ) : (
        <p className="text-xs text-muted-foreground">{p.upgradeForUnlimited}</p>
      )}
    </div>
  );
}
