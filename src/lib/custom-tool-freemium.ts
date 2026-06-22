import { trackEvent } from "@/lib/analytics/events";
import { showAdVignette } from "@/components/ads/AdVignette";

export type CustomToolFreemiumProps = {
  toolId: string;
  isPremium: boolean;
  atUsageLimit: boolean;
  usedToday: number;
  maxDaily: number;
  recordUsage: () => Promise<unknown>;
};

/** After a custom tool operation succeeds: vignette (free) then record usage. */
export async function onCustomToolSuccess(
  isPremium: boolean,
  recordUsage: () => Promise<unknown>
): Promise<void> {
  const reveal = () => {
    void recordUsage().catch(() => {});
  };
  if (isPremium) {
    reveal();
    return;
  }
  await showAdVignette({ minMs: 4000, slotId: "custom-tool-success-vignette" });
  reveal();
}

/** First click shows ad; second click runs downloadFn. */
export async function runGatedDownload(
  gateOpen: boolean,
  isPremium: boolean,
  downloadFn: () => void
): Promise<{ triggered: boolean; gateOpen: boolean }> {
  if (isPremium || gateOpen) {
    downloadFn();
    return { triggered: true, gateOpen };
  }

  const adUrl = import.meta.env.VITE_AD_CLICK_URL?.trim();
  trackEvent("ad_click_download", { file_index: 0, method: adUrl ? "popup" : "vignette" });

  if (adUrl) {
    window.open(adUrl, "_blank", "noopener,noreferrer");
  } else {
    await showAdVignette({ minMs: 3000, slotId: "custom-tool-download-gate" });
  }

  return { triggered: false, gateOpen: true };
}
