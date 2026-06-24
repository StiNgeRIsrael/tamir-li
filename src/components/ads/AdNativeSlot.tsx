import { useCallback, useEffect, useRef, useState } from "react";
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
import { Button } from "@/components/ui/button";

interface AdNativeSlotProps {
  className?: string;
  /** Logical placement id for analytics */
  slotId?: string;
}

type AdLoadStatus = "loading" | "loaded" | "failed";

const MAX_ATTEMPTS = 2;
const NATIVE_FAIL_MS = 45_000;

export function AdNativeSlot({ className = "", slotId }: AdNativeSlotProps) {
  const { t } = useLocale();
  const { isPremium } = useSubscription();
  useAdConfig();
  const hasConsent = useAdsConsent();
  const [adStatus, setAdStatus] = useState<AdLoadStatus>("loading");
  const [retryKey, setRetryKey] = useState(0);
  const loadedRef = useRef(false);
  const attemptRef = useRef(0);
  const label = t.adLabel || "Ad";
  const config = getNativeAdConfig();
  const adsConfigured = isAdsterraConfigured();
  const clientReady = adsConfigured && hasConsent && !isPremium;
  const showLiveAd = clientReady && hasNativeAdConfigured();
  const pendingSlot = clientReady && !hasNativeAdConfigured();

  const retry = useCallback(() => {
    if (loadedRef.current) return;
    attemptRef.current = 0;
    setRetryKey((k) => k + 1);
    setAdStatus("loading");
  }, []);

  useEffect(() => {
    if (!showLiveAd || !config) return;

    if (loadedRef.current) {
      setAdStatus("loaded");
      return;
    }

    setAdStatus("loading");
    loadNativeAdScript();

    const scheduleRetryOrFail = () => {
      if (loadedRef.current) return;
      if (attemptRef.current < MAX_ATTEMPTS - 1) {
        attemptRef.current += 1;
        setRetryKey((k) => k + 1);
        setAdStatus("loading");
        return;
      }
      setAdStatus("failed");
    };

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
      if (loadedRef.current) return;
      scheduleRetryOrFail();
    }, NATIVE_FAIL_MS);

    return () => {
      observer.disconnect();
      window.clearTimeout(failTimer);
    };
  }, [showLiveAd, config, retryKey]);

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
        <span className="text-sm font-medium leading-snug text-muted-foreground">{label}</span>
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

  const showFailedOverlay = adStatus === "failed";

  return (
    <aside
      role="complementary"
      aria-label={label}
      data-ad-region="native"
      data-ad-slot-id={slotId}
      data-ad-load-status={adStatus}
      data-ad-retry-count={retryKey}
      className={cn(
        "ad-slot relative mx-auto w-full min-h-[120px] overflow-hidden rounded-md",
        className
      )}
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
      <div
        key={retryKey}
        id={config!.containerId}
        className={cn("relative z-10 w-full", showFailedOverlay && "pointer-events-none opacity-0")}
      />
    </aside>
  );
}
