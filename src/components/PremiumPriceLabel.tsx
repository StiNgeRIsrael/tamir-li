import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type PremiumPriceLabelProps = {
  className?: string;
  /** Include /month (or locale equivalent) after the sale price */
  showPeriod?: boolean;
  size?: "sm" | "md";
};

/** Strikethrough anchor (₪150) + sale price (₪19.90) from upgradePage translations. */
export function PremiumPriceLabel({
  className,
  showPeriod = true,
  size = "sm",
}: PremiumPriceLabelProps) {
  const { t } = useLocale();
  const u = t.upgradePage;

  return (
    <span className={cn("inline-flex items-baseline flex-wrap gap-x-0.5", className)} dir="ltr">
      <span
        className={cn(
          "line-through decoration-current/60",
          size === "sm" ? "text-[0.9em] opacity-75 me-0.5" : "text-xl opacity-80 me-1"
        )}
      >
        {u.anchorPriceMonthly}
      </span>
      <span className={cn("font-bold", size === "md" && "text-lg")}>{u.priceMonthly}</span>
      {showPeriod && <span className={size === "sm" ? "font-medium" : ""}>{u.periodMonthly}</span>}
    </span>
  );
}
