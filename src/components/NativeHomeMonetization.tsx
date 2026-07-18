import { Link } from "react-router-dom";
import { Crown, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useUsage } from "@/hooks/useUsage";
import { useSubscription } from "@/hooks/useSubscription";
import { useLocale, localePath } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { enTranslations } from "@/lib/translations/en";

/** Compact usage + premium upsell strip for the native app home screen. */
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
          "flex items-center gap-2 rounded-lg border border-premium/30 bg-premium/10 px-3 py-2",
          className
        )}
      >
        <Crown className="h-4 w-4 shrink-0 text-premium" aria-hidden />
        <p className="text-xs font-semibold text-foreground">{copy.premiumActive}</p>
      </div>
    );
  }

  const pct = max ? Math.min(100, Math.round((used / max) * 100)) : 0;
  const isLow = remaining <= 1;

  return (
    <div
      className={cn(
        "space-y-2 rounded-lg border px-3 py-2.5",
        isLow ? "border-amber-500/40 bg-amber-500/5" : "border-border bg-card",
        className
      )}
    >
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-foreground">{copy.usageTitle}</p>
          <span className="text-[11px] font-medium text-muted-foreground" dir="ltr">
            {used}/{max}
          </span>
        </div>
        <Progress value={pct} className="h-1.5" aria-label={copy.usageRemaining(remaining)} />
        <p
          className={cn(
            "text-[11px] leading-snug",
            isLow ? "font-medium text-amber-700 dark:text-amber-400" : "text-muted-foreground"
          )}
        >
          {copy.usageRemaining(remaining)}
        </p>
      </div>

      <div className="flex items-center justify-between gap-2 rounded-md border border-premium/25 bg-premium/10 px-2.5 py-1.5">
        <div className="min-w-0">
          <p className="text-xs font-bold leading-tight text-foreground">{copy.upgradeTitle}</p>
          <p className="text-[10px] leading-snug text-muted-foreground">{copy.upgradeSubtitle}</p>
        </div>
        <Button
          asChild
          size="sm"
          className="h-8 shrink-0 bg-premium px-2.5 text-xs font-bold text-premium-foreground hover:bg-premium/90"
        >
          <Link to={localePath("/premium", locale)}>
            <Zap className="me-1 h-3 w-3" aria-hidden />
            {copy.upgradeCta}
          </Link>
        </Button>
      </div>
    </div>
  );
}
