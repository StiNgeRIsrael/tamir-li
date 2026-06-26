import { useMemo, useRef, useEffect, type CSSProperties } from "react";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  buildAdIframeSrcdoc,
  getAdsterraZoneKey,
  getPlacementLayout,
  hasAdsterraZone,
  isAdsterraConfigured,
  triggerPopunderAd,
} from "@/lib/ads/adsterra";
import { hideAdMobBanner, shouldUseAdMob, showAdMobBanner, showAdMobInterstitial } from "@/lib/ads/admob";
import { useAdConfig } from "@/contexts/AdConfigContext";
import { useAdsConsent } from "@/hooks/useAdsConsent";
import { useAdIframeLoad } from "@/hooks/useAdIframeLoad";
import { scaleModeForPlacement, useAdSlotScale } from "@/hooks/useAdSlotScale";
import { useSubscription } from "@/hooks/useSubscription";
import { showAdVignette } from "@/components/ads/AdVignette";
import { Button } from "@/components/ui/button";

interface AdSlotProps {
  type: "banner" | "sidebar" | "inline";
  className?: string;
  /** Logical placement id for analytics / second-sidebar routing */
  slotId?: string;
  /** High-intent slots (processing, download) load immediately */
  eager?: boolean;
}

const PLACEMENT_META: Record<
  AdSlotProps["type"],
  { labelKey: string; envVar: string }
> = {
  banner: { labelKey: "leaderboard", envVar: "VITE_ADSTERRA_ZONE_BANNER" },
  sidebar: { labelKey: "sidebar", envVar: "VITE_ADSTERRA_ZONE_SIDEBAR" },
  inline: { labelKey: "inline", envVar: "VITE_ADSTERRA_ZONE_INLINE" },
};

function adSlotAspectStyle(width: number, height: number, type: AdSlotProps["type"]): CSSProperties {
  const style: CSSProperties = { aspectRatio: `${width} / ${height}` };
  if (type === "banner" || type === "inline") {
    style.minHeight = height;
  }
  return style;
}

export function AdSlot({ type, className = "", slotId, eager = true }: AdSlotProps) {
  const { t } = useLocale();
  const { isPremium } = useSubscription();
  // Re-render when /api/ads/config settles so zone keys from DB replace env fallback.
  useAdConfig();
  const hasConsent = useAdsConsent();
  const meta = PLACEMENT_META[type];
  const label = t.adLabel || "Ad";
  const dims = getPlacementLayout(type);
  const aspectStyle = adSlotAspectStyle(dims.width, dims.height, type);

  const zoneKey = getAdsterraZoneKey(type, slotId);
  const adsConfigured = isAdsterraConfigured();
  const clientReady = adsConfigured && hasConsent && !isPremium;
  const showLiveAd = clientReady && hasAdsterraZone(type, slotId);
  const pendingSlot = clientReady && !hasAdsterraZone(type, slotId);

  const messageSlot = slotId ?? "";
  const slotIdentity = `${messageSlot}:${zoneKey ?? ""}`;
  const { adStatus, retryKey, retry, showFailedOverlay, iframeHidden } = useAdIframeLoad(
    showLiveAd,
    messageSlot,
    slotIdentity
  );

  const slotRef = useRef<HTMLElement>(null);
  const scale = useAdSlotScale(slotRef, dims.width, scaleModeForPlacement(type));

  const iframeSrcdoc = useMemo(() => {
    if (!showLiveAd || !zoneKey) return undefined;
    return buildAdIframeSrcdoc(zoneKey, dims.width, dims.height, slotId);
  }, [showLiveAd, zoneKey, dims.width, dims.height, slotId]);

  useEffect(() => {
    if (!shouldUseAdMob() || type !== "banner" || isPremium) return;
    void showAdMobBanner();
    return () => {
      void hideAdMobBanner();
    };
  }, [type, isPremium]);

  const envHint =
    type === "sidebar" && slotId?.endsWith("-2")
      ? "VITE_ADSTERRA_ZONE_SIDEBAR_2"
      : meta.envVar;

  if (isPremium) return null;

  if (shouldUseAdMob() && type === "banner") {
    return (
      <aside
        role="complementary"
        aria-label={label}
        data-ad-region="admob-banner"
        data-ad-slot-id={slotId}
        className={cn("ad-slot ad-slot--admob mx-auto flex w-full max-w-full flex-col", className)}
        style={aspectStyle}
      />
    );
  }

  if (!hasConsent) return null;

  if (!adsConfigured) return null;

  if (!showLiveAd) {
    return (
      <aside
        role="complementary"
        aria-label={label}
        data-ad-region={type}
        data-ad-slot-id={slotId}
        data-adsterra-pending={pendingSlot ? "zone-key" : undefined}
        className={cn("ad-slot ad-slot--pending mx-auto flex w-full max-w-full flex-col", className)}
        style={aspectStyle}
      >
        <span className="flex h-full w-full items-center justify-center px-3 py-2 text-sm font-medium leading-snug text-muted-foreground">
          {label}
        </span>
        {pendingSlot && import.meta.env.DEV && (
          <p className="px-2 pb-2 text-center text-[11px] leading-snug text-muted-foreground">
            Adsterra is configured. Create a banner unit in the Adsterra dashboard (unique key per
            placement), then set{" "}
            <code className="rounded bg-muted px-1">{envHint}</code> in{" "}
            <code className="rounded bg-muted px-1">.env.development.local</code>.
          </p>
        )}
      </aside>
    );
  }

  return (
    <aside
      ref={slotRef}
      role="complementary"
      aria-label={label}
      data-ad-region={type}
      data-ad-slot-id={slotId}
      data-ad-load-status={adStatus}
      data-ad-retry-count={retryKey}
      data-ad-scale={scale.toFixed(3)}
      className={cn("ad-slot ad-slot--live mx-auto flex w-full max-w-full flex-col", className)}
    >
      <span className="px-2 pb-1 pt-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div
        className="relative w-full min-h-0 flex-1 overflow-hidden rounded-[inherit] bg-muted/60 ring-1 ring-border/50"
        style={aspectStyle}
      >
        {showFailedOverlay && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-muted/95 px-2 text-center">
            <span className="text-sm font-medium leading-snug text-foreground">{t.adLoadFailed}</span>
            <span className="text-xs leading-snug text-muted-foreground">{t.adBlockerHint}</span>
            <Button type="button" variant="outline" size="sm" onClick={retry}>
              {t.adRetry}
            </Button>
          </div>
        )}
        <iframe
          key={adStatus === "loaded" ? slotIdentity : `${slotIdentity}-r${retryKey}`}
          title={label}
          srcDoc={iframeSrcdoc}
          loading={eager ? "eager" : "lazy"}
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          className={cn(
            "absolute left-0 top-0 z-10 border-0 bg-transparent",
            iframeHidden && "pointer-events-none opacity-0"
          )}
          style={{
            width: dims.width,
            height: dims.height,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        />
      </div>
    </aside>
  );
}

/** Call after conversion milestones; shows vignette overlay (with optional popunder). */
export function triggerInterstitial() {
  if (shouldUseAdMob()) {
    void showAdMobInterstitial();
    return;
  }
  void showAdVignette({ minMs: 4000, slotId: "convert-success-vignette" });
  triggerPopunderAd();
}
