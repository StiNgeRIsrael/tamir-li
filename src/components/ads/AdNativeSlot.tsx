import { useEffect, useState } from "react";
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
  const { loading: configLoading } = useAdConfig();
  const hasConsent = useAdsConsent();
  const [nativeLoaded, setNativeLoaded] = useState(false);
  const label = t.adLabel || "Ad";
  const config = getNativeAdConfig();
  const clientReady = isAdsterraConfigured() && hasConsent && !isPremium;
  const showLiveAd = clientReady && hasNativeAdConfigured();
  const pendingSlot = clientReady && !hasNativeAdConfigured();

  useEffect(() => {
    if (!showLiveAd || !config) {
      setNativeLoaded(false);
      return;
    }

    setNativeLoaded(false);
    loadNativeAdScript();

    const checkFilled = () => {
      const el = document.getElementById(config.containerId);
      if (el && el.childElementCount > 0) {
        setNativeLoaded(true);
      }
    };

    checkFilled();
    const observer = new MutationObserver(checkFilled);
    const el = document.getElementById(config.containerId);
    if (el) observer.observe(el, { childList: true, subtree: true });

    const failTimer = window.setTimeout(() => {
      setNativeLoaded((loaded) => {
        if (loaded) return loaded;
        const node = document.getElementById(config.containerId);
        return (node?.childElementCount ?? 0) > 0;
      });
    }, 8000);

    return () => {
      observer.disconnect();
      window.clearTimeout(failTimer);
    };
  }, [showLiveAd, config]);

  if (isPremium) return null;

  if (configLoading) return null;

  if (!isAdsterraConfigured()) return null;

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

  const showFallbackOverlay = !nativeLoaded;

  return (
    <aside
      role="complementary"
      aria-label={label}
      data-ad-region="native"
      data-ad-slot-id={slotId}
      data-ad-load-status={nativeLoaded ? "loaded" : "failed"}
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
