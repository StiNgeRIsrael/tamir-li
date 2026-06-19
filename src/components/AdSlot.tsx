import { useEffect, useRef } from "react";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { getStoredConsent } from "@/lib/ads/consent";
import {
  getAdSenseSlotId,
  hasAdSenseSlot,
  isAdSenseConfigured,
  loadAdSenseScript,
  pushAdSlot,
  triggerInterstitialAd,
} from "@/lib/ads/adsense";
import { useSubscription } from "@/hooks/useSubscription";
import { showAdVignette } from "@/components/ads/AdVignette";

interface AdSlotProps {
  type: "banner" | "sidebar" | "inline";
  className?: string;
  /** Map to your Google Ad Manager / AdSense ad unit name in the publisher console */
  slotId?: string;
}

const layout: Record<
  AdSlotProps["type"],
  { height: string; maxW?: string; labelKey: string }
> = {
  banner: { height: "h-[90px]", maxW: "max-w-[728px]", labelKey: "leaderboard" },
  sidebar: { height: "h-[250px]", maxW: "max-w-[300px]", labelKey: "sidebar" },
  inline: { height: "h-[120px]", maxW: "max-w-full", labelKey: "inline" },
};

const slotEnvVar: Record<AdSlotProps["type"], string> = {
  banner: "VITE_ADSENSE_SLOT_BANNER",
  sidebar: "VITE_ADSENSE_SLOT_SIDEBAR",
  inline: "VITE_ADSENSE_SLOT_INLINE",
};

export function AdSlot({ type, className = "", slotId }: AdSlotProps) {
  const { t } = useLocale();
  const { isPremium } = useSubscription();
  const insRef = useRef<HTMLModElement>(null);
  const L = layout[type];
  const label = t.adLabel || "Ad • Google Ads";

  const client = import.meta.env.VITE_ADSENSE_CLIENT?.trim();
  const adSlot = getAdSenseSlotId(type);
  const hasConsent = getStoredConsent()?.ads === true;
  const clientReady = isAdSenseConfigured() && hasConsent && !isPremium;
  const showLiveAd = clientReady && hasAdSenseSlot(type);
  const pendingSlot = clientReady && !hasAdSenseSlot(type);

  useEffect(() => {
    if (!pendingSlot) return;
    loadAdSenseScript();
  }, [pendingSlot]);

  useEffect(() => {
    if (!showLiveAd || !insRef.current) return;
    loadAdSenseScript();
    pushAdSlot(insRef.current);
  }, [showLiveAd, type, adSlot]);

  if (isPremium) return null;

  if (!showLiveAd) {
    return (
      <aside
        role="complementary"
        aria-label={label}
        data-ad-region={type}
        data-ad-slot-id={slotId}
        data-adsense-pending={pendingSlot ? "slot-id" : undefined}
        className={cn(
          "ad-slot mx-auto flex w-full flex-col items-center justify-center gap-1 px-2 py-3 text-center",
          L.height,
          L.maxW,
          className
        )}
      >
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <div
          className="flex w-full flex-1 flex-col items-center justify-center gap-1 rounded-md bg-muted/50 px-2"
          data-ad-placeholder={L.labelKey}
        >
          <span className="sr-only">{label}</span>
          {pendingSlot && import.meta.env.DEV && (
            <p className="text-[11px] leading-snug text-muted-foreground">
              AdSense client configured. Create ad units in the AdSense dashboard, then set{" "}
              <code className="rounded bg-muted px-1">{slotEnvVar[type]}</code> in{" "}
              <code className="rounded bg-muted px-1">.env.development.local</code>. Auto ads from
              the dashboard may still appear once the site is approved.
            </p>
          )}
        </div>
      </aside>
    );
  }

  return (
    <aside
      role="complementary"
      aria-label={label}
      data-ad-region={type}
      data-ad-slot-id={slotId}
      className={cn(
        "ad-slot mx-auto w-full overflow-hidden rounded-md",
        L.height,
        L.maxW,
        className
      )}
    >
      <ins
        ref={insRef}
        className="adsbygoogle block h-full w-full"
        style={{ display: "block" }}
        data-ad-client={client}
        data-ad-slot={adSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}

/** Call after conversion milestones; shows vignette overlay (with optional AdSense unit). */
export function triggerInterstitial() {
  void showAdVignette({ minMs: 4000, slotId: "convert-success-vignette" });
  triggerInterstitialAd();
}
