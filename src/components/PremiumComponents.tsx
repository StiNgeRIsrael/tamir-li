import { Crown, Zap, Eye, CheckCircle2, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, type ReactNode } from "react";
import { useLocale, localePath } from "@/lib/i18n";
import { Link } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { PremiumPriceLabel } from "@/components/PremiumPriceLabel";
import { hasAdSurface, requireAdViewForUnlock } from "@/lib/custom-tool-freemium";

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
          <PremiumPriceLabel />
        </Link>
      </Button>
    </div>
  );
}

/** Compact free vs premium table for tool pages (reuses upgradePage copy). */
export function FreePremiumComparison() {
  const { locale, t } = useLocale();
  const u = t.upgradePage;
  const headers = u.comparisonHeaders;
  const rows = u.comparisonRows as { feature: string; free: string; premium: string }[];

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-bold text-foreground lg:text-lg">{u.comparisonTitle}</h2>
        <Button asChild size="sm" variant="outline" className="border-premium/30 text-premium hover:bg-premium/5">
          <Link to={localePath("/premium", locale)}>
            <Zap className="w-3.5 h-3.5 me-1" />
            {u.ctaMain}
          </Link>
        </Button>
      </div>
      <div className="overflow-x-auto rounded-md border border-border bg-card min-w-[260px]">
        <div className="grid grid-cols-3 text-xs font-bold border-b border-border">
          <div className="p-2.5 text-muted-foreground">{headers.feature}</div>
          <div className="p-2.5 text-center text-muted-foreground">{headers.free}</div>
          <div className="p-2.5 text-center text-premium bg-premium/5">{headers.premium}</div>
        </div>
        {rows.map((row, i) => (
          <div
            key={i}
            className={`grid grid-cols-3 text-xs ${i % 2 === 0 ? "" : "bg-muted/30"} ${i === rows.length - 1 ? "" : "border-b border-border/50"}`}
          >
            <div className="p-2.5 font-medium text-foreground">{row.feature}</div>
            <div className="p-2.5 text-center text-muted-foreground">{row.free}</div>
            <div className="p-2.5 text-center font-semibold text-premium bg-premium/5">
              {typeof row.premium === "string" && row.premium !== "—" ? (
                <span className="inline-flex items-center justify-center gap-1">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  {row.premium}
                </span>
              ) : (
                row.premium
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

type AdGateLockProps = {
  slotId: string;
  onUnlock?: () => void;
  icon: ReactNode;
  title: string;
  desc: string;
  unlockTitle: string;
  unlockDesc: string;
};

function AdGateLock({ slotId, onUnlock, icon, title, desc, unlockTitle, unlockDesc }: AdGateLockProps) {
  const { locale, t } = useLocale();
  const { isPremium } = useSubscription();
  const p = t.premium;
  const [adState, setAdState] = useState<"idle" | "loading" | "done">("idle");
  const adAvailable = hasAdSurface();

  if (isPremium) return null;

  const startAd = async () => {
    if (!adAvailable) return;
    setAdState("loading");
    const completed = await requireAdViewForUnlock(slotId);
    if (completed) {
      setAdState("done");
      onUnlock?.();
    } else {
      setAdState("idle");
    }
  };

  if (adState === "done") {
    return (
      <div className="text-center py-6 px-4 bg-success/5 rounded-xl border border-success/30 animate-fade-in space-y-3">
        <CheckCircle2 className="w-10 h-10 text-success mx-auto" />
        <h3 className="font-bold text-lg text-foreground">{unlockTitle}</h3>
        <p className="text-sm text-muted-foreground">{unlockDesc}</p>
      </div>
    );
  }

  if (adState === "loading") {
    return (
      <div className="text-center py-8 px-4 bg-card rounded-xl border border-border animate-fade-in space-y-4">
        <Loader2 className="w-10 h-10 text-primary mx-auto animate-spin" />
        <p className="text-sm text-muted-foreground">{p.adPlaying}</p>
      </div>
    );
  }

  return (
    <div className="text-center py-6 px-4 bg-muted/50 rounded-xl border border-border space-y-5">
      {icon}
      <h3 className="font-bold text-lg text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">{desc}</p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        {adAvailable ? (
          <>
            <Button onClick={startAd} variant="outline" className="font-bold border-primary/30 hover:bg-primary/5" size="lg">
              <Eye className="w-4 h-4 me-2" />
              {p.watchAd}
            </Button>
            <span className="text-xs text-muted-foreground">{p.or}</span>
          </>
        ) : null}
        <Button asChild className="bg-premium text-premium-foreground hover:bg-premium/90 font-bold" size="lg">
          <Link to={localePath("/premium", locale)}>
            <Zap className="w-4 h-4 me-1" />
            {p.upgradeTo} — <PremiumPriceLabel />
          </Link>
        </Button>
      </div>
      {adAvailable && <p className="text-xs text-muted-foreground">{p.adDuration}</p>}
    </div>
  );
}

export function PremiumLock({ onUnlock }: { onUnlock?: () => void }) {
  const { t } = useLocale();
  const p = t.premium;
  return (
    <AdGateLock
      slotId="premium-tool-lock-vignette"
      onUnlock={onUnlock}
      icon={<Crown className="w-10 h-10 text-premium mx-auto" />}
      title={p.lockTitle}
      desc={p.lockDesc}
      unlockTitle={p.unlockTitle}
      unlockDesc={p.unlockDesc}
    />
  );
}

/** Shown when the free daily conversion quota (5/day) is exhausted — not for premium-only tools. */
export function DailyLimitLock({ onUnlock }: { onUnlock?: () => void }) {
  const { t } = useLocale();
  const p = t.premium;
  return (
    <AdGateLock
      slotId="daily-limit-lock-vignette"
      onUnlock={onUnlock}
      icon={<Crown className="w-10 h-10 text-premium mx-auto" />}
      title={p.dailyLimitTitle}
      desc={p.dailyLimitDesc}
      unlockTitle={p.dailyLimitUnlockTitle}
      unlockDesc={p.dailyLimitUnlockDesc}
    />
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
        <p className="text-xs text-accent font-medium flex flex-wrap items-center gap-x-1">
          <Zap className="w-3 h-3 shrink-0" />
          <span>{p.almostDoneBefore}</span>
          <PremiumPriceLabel />
          <span>{p.almostDoneAfter}</span>
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
            <Zap className="w-3.5 h-3.5 me-1" />
            {p.upgradeTo} — <PremiumPriceLabel />
          </Link>
        </Button>
      ) : (
        <p className="text-xs text-muted-foreground">{p.upgradeForUnlimited}</p>
      )}
    </div>
  );
}

export function ConvertUrgencyHint({ remaining }: { remaining: number; max?: number }) {
  const { t } = useLocale();
  const p = t.premium;
  return (
    <div className="text-end space-y-0.5">
      <p className="text-xs text-muted-foreground">{p.remainingToday(remaining)}</p>
      {remaining <= 2 && (
        <p className="text-xs text-accent font-medium">
          <Zap className="inline w-3 h-3 me-0.5 align-text-bottom" />
          {p.almostDoneBefore}
          <PremiumPriceLabel />
          {p.almostDoneAfter}
        </p>
      )}
    </div>
  );
}
