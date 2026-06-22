import { Link } from "react-router-dom";
import { Zap } from "lucide-react";
import { useUsage } from "@/hooks/useUsage";
import { useSubscription } from "@/hooks/useSubscription";
import { useLocale, localePath } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Compact daily-usage indicator for the top nav (free tier only). */
export function UsageNavPill({ className }: { className?: string }) {
  const { used, max, remaining, loading } = useUsage();
  const { isPremium, loading: subLoading } = useSubscription();
  const { locale, t } = useLocale();
  const p = t.premium as Record<string, unknown>;

  if (loading || subLoading || isPremium) return null;

  const remainingLabel =
    typeof p?.remaining === "function"
      ? (p.remaining as (n: number) => string)(remaining)
      : `${remaining}/${max}`;

  const isLow = remaining <= 2;

  return (
    <Link
      to={localePath("/premium", locale)}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] md:px-2 md:text-xs font-medium transition-colors",
        isLow
          ? "border-accent/40 bg-accent/10 text-accent hover:bg-accent/15"
          : "border-border bg-muted/50 text-muted-foreground hover:text-foreground",
        className
      )}
      title={remainingLabel}
    >
      {isLow && <Zap className="h-3 w-3 shrink-0" />}
      <span dir="ltr">{used}/{max}</span>
    </Link>
  );
}
