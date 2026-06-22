import { useMemo } from "react";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { getStoredConsent } from "@/lib/ads/consent";
import {
  buildAdIframeSrcdoc,
  getAdsterraZoneKey,
  getPlacementLayout,
  hasAdsterraZone,
  isAdsterraConfigured,
  triggerPopunderAd,
} from "@/lib/ads/adsterra";
import { useSubscription } from "@/hooks/useSubscription";
import { showAdVignette } from "@/components/ads/AdVignette";

interface AdSlotProps {
  type: "banner" | "sidebar" | "inline";
  className?: string;
  /** Logical placement id for analytics / second-sidebar routing */
  slotId?: string;
}

const layout: Record<
  AdSlotProps["type"],
  { height: string; maxW?: string; labelKey: string; envVar: string }
> = {
  banner: {
    height: "h-[90px]",
    maxW: "max-w-[728px]",
    labelKey: "leaderboard",
    envVar: "VITE_ADSTERRA_ZONE_BANNER",
  },
  sidebar: {
    height: "h-[250px]",
    maxW: "max-w-[300px]",
    labelKey: "sidebar",
    envVar: "VITE_ADSTERRA_ZONE_SIDEBAR",
  },
  inline: {
    height: "h-[120px]",
    maxW: "max-w-full",
    labelKey: "inline",
    envVar: "VITE_ADSTERRA_ZONE_INLINE",
  },
};

export function AdSlot({ type, className = "", slotId }: AdSlotProps) {
  const { t } = useLocale();
  const { isPremium } = useSubscription();
  const L = layout[type];
  const label = t.adLabel || "Ad";
  const dims = getPlacementLayout(type);

  const zoneKey = getAdsterraZoneKey(type, slotId);
  const hasConsent = getStoredConsent()?.ads === true;
  const clientReady = isAdsterraConfigured() && hasConsent && !isPremium;
  const showLiveAd = clientReady && hasAdsterraZone(type, slotId);
  const pendingSlot = clientReady && !hasAdsterraZone(type, slotId);

  const iframeSrcdoc = useMemo(() => {
    if (!showLiveAd || !zoneKey) return undefined;
    return buildAdIframeSrcdoc(zoneKey, dims.width, dims.height);
  }, [showLiveAd, zoneKey, dims.width, dims.height]);

  const envHint =
    type === "sidebar" && slotId?.endsWith("-2")
      ? "VITE_ADSTERRA_ZONE_SIDEBAR_2"
      : L.envVar;

  if (isPremium) return null;

  if (!showLiveAd) {
    return (
      <aside
        role="complementary"
        aria-label={label}
        data-ad-region={type}
        data-ad-slot-id={slotId}
        data-adsterra-pending={pendingSlot ? "zone-key" : undefined}
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
              Adsterra is configured. Create a banner unit in the Adsterra dashboard (unique key per
              placement), then set{" "}
              <code className="rounded bg-muted px-1">{envHint}</code> in{" "}
              <code className="rounded bg-muted px-1">.env.development.local</code>.
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
      <iframe
        title={label}
        srcDoc={iframeSrcdoc}
        width={dims.width}
        height={dims.height}
        loading="lazy"
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        className="mx-auto block max-w-full border-0 bg-transparent"
        style={{ width: dims.width, height: dims.height, maxWidth: "100%" }}
      />
    </aside>
  );
}

/** Call after conversion milestones; shows vignette overlay (with optional popunder). */
export function triggerInterstitial() {
  void showAdVignette({ minMs: 4000, slotId: "convert-success-vignette" });
  triggerPopunderAd();
}
