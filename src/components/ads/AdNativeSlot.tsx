import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { getStoredConsent } from "@/lib/ads/consent";
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

export function AdNativeSlot({ className = "", slotId }: AdNativeSlotProps) {
  const { t } = useLocale();
  const { isPremium } = useSubscription();
  const [hasConsent, setHasConsent] = useState(() => getStoredConsent()?.ads === true);
  const label = t.adLabel || "Ad";
  const config = getNativeAdConfig();
  const clientReady = isAdsterraConfigured() && hasConsent && !isPremium;
  const showLiveAd = clientReady && hasNativeAdConfigured();
  const pendingSlot = clientReady && !hasNativeAdConfigured();

  useEffect(() => {
    const syncConsent = () => setHasConsent(getStoredConsent()?.ads === true);
    window.addEventListener("tamir:consent", syncConsent);
    return () => window.removeEventListener("tamir:consent", syncConsent);
  }, []);

  useEffect(() => {
    if (!showLiveAd || !config) return;
    loadNativeAdScript();
  }, [showLiveAd, config]);

  if (isPremium) return null;

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
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <div
          className="flex w-full flex-1 flex-col items-center justify-center gap-1 rounded-md bg-muted/50 px-2"
          data-ad-placeholder="native"
        >
          <span className="sr-only">{label}</span>
          {pendingSlot && import.meta.env.DEV && (
            <p className="text-[11px] leading-snug text-muted-foreground">
              Adsterra is configured. Create a native unit in the Adsterra dashboard, then set{" "}
              <code className="rounded bg-muted px-1">VITE_ADSTERRA_NATIVE_SCRIPT_URL</code> and{" "}
              <code className="rounded bg-muted px-1">VITE_ADSTERRA_NATIVE_CONTAINER_ID</code> in{" "}
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
      data-ad-region="native"
      data-ad-slot-id={slotId}
      className={cn("ad-slot mx-auto w-full min-h-[120px] overflow-hidden rounded-md", className)}
    >
      <div id={config!.containerId} className="w-full" />
    </aside>
  );
}
