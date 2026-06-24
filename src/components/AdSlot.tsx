import { useEffect, useMemo, useState } from "react";
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
import { useAdConfig } from "@/contexts/AdConfigContext";
import { useAdsConsent } from "@/hooks/useAdsConsent";
import { useSubscription } from "@/hooks/useSubscription";
import { showAdVignette } from "@/components/ads/AdVignette";

interface AdSlotProps {
  type: "banner" | "sidebar" | "inline";
  className?: string;
  /** Logical placement id for analytics / second-sidebar routing */
  slotId?: string;
  /** High-intent slots (processing, download) load immediately */
  eager?: boolean;
}

type AdLoadStatus = "loading" | "loaded" | "failed";

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

function AdFallbackMessage({ label, className }: { label: string; className?: string }) {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-1 px-3 py-2 text-center",
        className
      )}
    >
      <span className="text-sm font-medium leading-snug text-foreground">{label}</span>
    </div>
  );
}

export function AdSlot({ type, className = "", slotId, eager = false }: AdSlotProps) {
  const { t } = useLocale();
  const { isPremium } = useSubscription();
  // Subscribe to runtime config from /api/ads/config (admin DB) without hiding slots while loading.
  const { config: adRuntimeConfig } = useAdConfig();
  const hasConsent = useAdsConsent();
  const L = layout[type];
  const label = t.adLabel || "Ad";
  const dims = getPlacementLayout(type);

  const zoneKey = getAdsterraZoneKey(type, slotId);
  const adsConfigured = isAdsterraConfigured();
  const clientReady = adsConfigured && hasConsent && !isPremium;
  const showLiveAd = clientReady && hasAdsterraZone(type, slotId);
  const pendingSlot = clientReady && !hasAdsterraZone(type, slotId);

  const [adStatus, setAdStatus] = useState<AdLoadStatus>("loading");

  const iframeSrcdoc = useMemo(() => {
    if (!showLiveAd || !zoneKey) return undefined;
    return buildAdIframeSrcdoc(zoneKey, dims.width, dims.height, slotId);
  }, [showLiveAd, zoneKey, dims.width, dims.height, slotId, adRuntimeConfig]);

  useEffect(() => {
    if (!showLiveAd) {
      setAdStatus("failed");
      return;
    }

    setAdStatus("loading");
    const slotKey = slotId ?? "";

    const onMessage = (event: MessageEvent) => {
      const data = event.data as { tamirAdSlot?: string; status?: string } | null;
      if (!data || data.tamirAdSlot !== slotKey) return;

      if (data.status === "loaded") {
        setAdStatus("loaded");
      } else if (data.status === "blocked" || data.status === "timeout") {
        setAdStatus("failed");
      }
    };

    window.addEventListener("message", onMessage);
    const failTimer = window.setTimeout(() => {
      setAdStatus((current) => (current === "loading" ? "failed" : current));
    }, 9000);

    return () => {
      window.removeEventListener("message", onMessage);
      window.clearTimeout(failTimer);
    };
  }, [showLiveAd, slotId, iframeSrcdoc, adRuntimeConfig]);

  const envHint =
    type === "sidebar" && slotId?.endsWith("-2")
      ? "VITE_ADSTERRA_ZONE_SIDEBAR_2"
      : L.envVar;

  if (isPremium) return null;

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
        className={cn(
          "ad-slot mx-auto flex w-full flex-col items-center justify-center gap-1 px-2 py-3 text-center",
          L.height,
          L.maxW,
          className
        )}
      >
        <AdFallbackMessage label={label} />
        {pendingSlot && import.meta.env.DEV && (
          <p className="text-[11px] leading-snug text-muted-foreground">
            Adsterra is configured. Create a banner unit in the Adsterra dashboard (unique key per
            placement), then set{" "}
            <code className="rounded bg-muted px-1">{envHint}</code> in{" "}
            <code className="rounded bg-muted px-1">.env.development.local</code>.
          </p>
        )}
      </aside>
    );
  }

  const showFallbackOverlay = adStatus !== "loaded";

  return (
    <aside
      role="complementary"
      aria-label={label}
      data-ad-region={type}
      data-ad-slot-id={slotId}
      data-ad-load-status={adStatus}
      className={cn(
        "ad-slot relative mx-auto w-full overflow-hidden rounded-md",
        L.height,
        L.maxW,
        className
      )}
    >
      {showFallbackOverlay && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-muted/95 px-2">
          <AdFallbackMessage label={label} />
        </div>
      )}
      <iframe
        title={label}
        srcDoc={iframeSrcdoc}
        width={dims.width}
        height={dims.height}
        loading={eager ? "eager" : "lazy"}
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        className={cn(
          "relative z-10 mx-auto block max-w-full border-0 bg-transparent",
          showFallbackOverlay && "pointer-events-none opacity-0"
        )}
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
