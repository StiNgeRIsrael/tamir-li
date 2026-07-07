import { Link } from "react-router-dom";
import { Crown, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useUsage } from "@/hooks/useUsage";
import { useSubscription } from "@/hooks/useSubscription";
import { useLocale, localePath } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { enTranslations } from "@/lib/translations/en";

/** Usage + premium upsell strip for the native app home screen. */
export function NativeHomeMonetization({ className }: { className?: string }) {
  const { locale, t } = useLocale();
  const { used, max, remaining, loading: usageLoading } = useUsage();
  const { isPremium, loading: subLoading } = useSubscription();
  const copy =
    (t as { nativeHome?: typeof enTranslations.nativeHome }).nativeHome ?? enTranslations.nativeHome;

  if (subLoading || usageLoading) return null;

  if (isPremium) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl border border-premium/30 bg-premium/10 px-4 py-3",
          className
        )}
      >
        <Crown className="h-5 w-5 shrink-0 text-premium" aria-hidden />
        <p className="text-sm font-semibold text-foreground">{copy.premiumActive}</p>
      </div>
    );
  }

  const pct = max ? Math.min(100, Math.round((used / max) * 100)) : 0;
  const isLow = remaining <= 1;

  return (
    <div
      className={cn(
        "space-y-3 rounded-xl border p-4",
        isLow ? "border-amber-500/40 bg-amber-500/5" : "border-border bg-card",
        className
      )}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-foreground">{copy.usageTitle}</p>
          <span className="text-xs font-medium text-muted-foreground" dir="ltr">
            {used}/{max}
          </span>
        </div>
        <Progress value={pct} className="h-2" aria-label={copy.usageRemaining(remaining)} />
        <p className={cn("text-xs", isLow ? "font-medium text-amber-700 dark:text-amber-400" : "text-muted-foreground")}>
          {copy.usageRemaining(remaining)}
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-lg bg-premium/10 border border-premium/25 px-3 py-2.5">
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground">{copy.upgradeTitle}</p>
          <p className="text-xs text-muted-foreground">{copy.upgradeSubtitle}</p>
        </div>
        <Button asChild size="sm" className="shrink-0 bg-premium text-premium-foreground hover:bg-premium/90 font-bold">
          <Link to={localePath("/premium", locale)}>
            <Zap className="h-3.5 w-3.5 me-1" aria-hidden />
            {copy.upgradeCta}
          </Link>
        </Button>
      </div>
    </div>
  );
}
