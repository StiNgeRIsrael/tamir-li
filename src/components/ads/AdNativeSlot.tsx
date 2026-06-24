import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useAdConfig } from "@/contexts/AdConfigContext";
import { useAdsConsent } from "@/hooks/useAdsConsent";
import {
  getNativeAdConfig,
  hasNativeAdConfigured,
  isAdsterraConfigured,
  loadNativeAdScript,
} from "@/lib/ads/adsterra";
import { useSubscription } from "@/hooks/useSubscription";

interface AdNativeSlotProps {
  className?: string;
  /** Logical placement id for analytics */
  slotId?: string;
}

type AdLoadStatus = "loading" | "loaded" | "failed";

function AdFallbackMessage({ label }: { label: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1 px-3 py-2 text-center">
      <span className="text-sm font-medium leading-snug text-foreground">{label}</span>
    </div>
  );
}

export function AdNativeSlot({ className = "", slotId }: AdNativeSlotProps) {
  const { t } = useLocale();
  const { isPremium } = useSubscription();
  // Re-render when /api/ads/config settles so native URL from DB replaces env fallback.
  useAdConfig();
  const hasConsent = useAdsConsent();
  const [adStatus, setAdStatus] = useState<AdLoadStatus>("loading");
  const loadedRef = useRef(false);
  const label = t.adLabel || "Ad";
  const config = getNativeAdConfig();
  const adsConfigured = isAdsterraConfigured();
  const clientReady = adsConfigured && hasConsent && !isPremium;
  const showLiveAd = clientReady && hasNativeAdConfigured();
  const pendingSlot = clientReady && !hasNativeAdConfigured();

  useEffect(() => {
    if (!showLiveAd || !config) {
      loadedRef.current = false;
      setAdStatus("failed");
      return;
    }

    setAdStatus((current) => (loadedRef.current ? "loaded" : "loading"));
    loadNativeAdScript();

    const checkFilled = () => {
      const el = document.getElementById(config.containerId);
      if (el && el.childElementCount > 0) {
        loadedRef.current = true;
        setAdStatus("loaded");
      }
    };

    checkFilled();
    const observer = new MutationObserver(checkFilled);
    const el = document.getElementById(config.containerId);
    if (el) observer.observe(el, { childList: true, subtree: true });

    const failTimer = window.setTimeout(() => {
      setAdStatus((current) => {
        if (loadedRef.current || current === "loaded") return "loaded";
        return current === "loading" ? "failed" : current;
      });
    }, 14000);

    return () => {
      observer.disconnect();
      window.clearTimeout(failTimer);
    };
  }, [showLiveAd, config]);

  if (isPremium) return null;

  if (!hasConsent) return null;

  if (!adsConfigured) return null;

  if (!showLiveAd) {
    return (
      <aside
        role="complementary"
        aria-label={label}
        data-ad-region="native"
        data-ad-slot-id={slotId}
        data-adsterra-pending={pendingSlot ? "native-config" : undefined}
        className={cn(
          "ad-slot mx-auto flex w-full min-h-[120px] flex-col items-center justify-center gap-1 px-2 py-3 text-center",
          className
        )}
      >
        <AdFallbackMessage label={label} />
        {pendingSlot && import.meta.env.DEV && (
          <p className="text-[11px] leading-snug text-muted-foreground">
            Adsterra is configured. Create a native unit in the Adsterra dashboard, then set{" "}
            <code className="rounded bg-muted px-1">VITE_ADSTERRA_NATIVE_SCRIPT_URL</code> and{" "}
            <code className="rounded bg-muted px-1">VITE_ADSTERRA_NATIVE_CONTAINER_ID</code> in{" "}
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
      data-ad-region="native"
      data-ad-slot-id={slotId}
      data-ad-load-status={adStatus}
      className={cn(
        "ad-slot relative mx-auto w-full min-h-[120px] overflow-hidden rounded-md",
        className
      )}
    >
      {showFallbackOverlay && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-muted/95 px-2">
          <AdFallbackMessage label={label} />
        </div>
      )}
      <div
        id={config!.containerId}
        className={cn("relative z-10 w-full", showFallbackOverlay && "pointer-events-none opacity-0")}
      />
    </aside>
  );
}
