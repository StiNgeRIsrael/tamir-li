import { Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLocale, localePath } from "@/lib/i18n";
import type { NativeAdExperience } from "@/lib/ads/native-ad-ramp";
import { shouldUseNativeAdRamp } from "@/lib/ads/native-ad-ramp";
import { useSubscription } from "@/hooks/useSubscription";
import { PremiumPriceLabel } from "@/components/PremiumPriceLabel";

type Props = {
  experience: NativeAdExperience | null;
  className?: string;
};

/** Shown after conversions when ads are active — value-first premium nudge, never explains the ramp. */
export function NativePremiumHint({ experience, className = "" }: Props) {
  const { locale, t } = useLocale();
  const { isPremium } = useSubscription();
  const copy = t.nativePremiumHint;

  if (!shouldUseNativeAdRamp() || isPremium || !experience?.showPremiumAdHint) {
    return null;
  }

  const prominent = experience.premiumHintTone === "prominent";

  return (
    <div
      className={`rounded-xl border text-center animate-fade-in ${
        prominent
          ? "border-premium/30 bg-premium/5 px-4 py-4 space-y-3"
          : "border-border/60 bg-muted/40 px-3 py-3 space-y-2"
      } ${className}`}
    >
      <p className={`leading-snug ${prominent ? "text-sm font-medium text-foreground" : "text-xs text-muted-foreground"}`}>
        {prominent ? copy.prominent : copy.subtle}
      </p>
      <Button
        asChild
        size={prominent ? "default" : "sm"}
        variant={prominent ? "default" : "outline"}
        className={
          prominent
            ? "bg-premium text-premium-foreground hover:bg-premium/90 font-bold"
            : "font-medium border-premium/25 text-premium hover:bg-premium/5"
        }
      >
        <Link to={localePath("/premium", locale)}>
          <Crown className="w-3.5 h-3.5 me-1.5 shrink-0" />
          {copy.cta}
          {prominent ? (
            <>
              {" — "}
              <PremiumPriceLabel />
            </>
          ) : null}
        </Link>
      </Button>
    </div>
  );
}
