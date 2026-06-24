import { ANALYTICS_EVENTS, trackEvent } from "@/lib/analytics/events";
import { showAdVignette } from "@/components/ads/AdVignette";
import { isAdsterraConfigured } from "@/lib/ads/adsterra";
import { toast } from "sonner";
import { maxFileSizeMb, type FileRejectReason } from "@/lib/freemium-limits";

/** True when a real ad surface exists (Adsterra zones or click-through URL). */
export function hasAdSurface(): boolean {
  return isAdsterraConfigured() || !!import.meta.env.VITE_AD_CLICK_URL?.trim();
}

/**
 * Require an ad view before granting a freemium unlock.
 * Returns false when no ad surface is configured.
 */
export async function requireAdViewForUnlock(slotId: string): Promise<boolean> {
  if (!hasAdSurface()) return false;

  const adUrl = import.meta.env.VITE_AD_CLICK_URL?.trim();
  const method = isAdsterraConfigured() ? "vignette" : adUrl ? "popup" : "vignette";
  trackEvent(ANALYTICS_EVENTS.AD_CLICK_DOWNLOAD, { method, source: slotId });

  if (isAdsterraConfigured()) {
    await showAdVignette({ minMs: 4000, slotId });
    return true;
  }

  if (adUrl) {
    window.open(adUrl, "_blank", "noopener,noreferrer");
    return true;
  }

  return false;
}

export type CustomToolFreemiumProps = {
  toolId: string;
  isPremium: boolean;
  atUsageLimit: boolean;
  usedToday: number;
  maxDaily: number;
  recordUsage: () => Promise<unknown>;
};

type FileDropRejectCopy = {
  fileTooLarge: (maxMB: number, name: string) => string;
  batchLimitFree: string;
};

/** Toast for FileDropZone rejections (size / batch tier limits). */
export function notifyFileRejected(
  reason: FileRejectReason,
  isPremium: boolean,
  copy: FileDropRejectCopy,
  fileName?: string
): void {
  if (reason === "file_too_large") {
    toast.error(copy.fileTooLarge(maxFileSizeMb(isPremium), fileName ?? ""));
  } else {
    toast.error(copy.batchLimitFree);
  }
}

/** Fire at the start of a custom-tool operation. */
export function trackCustomToolStart(toolId: string): void {
  trackEvent(ANALYTICS_EVENTS.CONVERT_START, { tool_id: toolId, source: "custom_tool" });
}

/** After a custom tool operation succeeds: vignette (free) then record usage. */
export async function onCustomToolSuccess(
  isPremium: boolean,
  recordUsage: () => Promise<unknown>,
  toolId?: string
): Promise<void> {
  if (toolId) {
    trackEvent(ANALYTICS_EVENTS.CONVERT_SUCCESS, { tool_id: toolId, source: "custom_tool" });
  }
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
  downloadFn: () => void,
  options?: { toolId?: string; fileIndex?: number }
): Promise<{ triggered: boolean; gateOpen: boolean }> {
  if (isPremium || gateOpen) {
    downloadFn();
    if (options?.toolId) {
      trackEvent(ANALYTICS_EVENTS.FILE_DOWNLOAD, {
        tool_id: options.toolId,
        file_index: options.fileIndex ?? 0,
        source: "custom_tool",
      });
    }
    return { triggered: true, gateOpen };
  }

  const adUrl = import.meta.env.VITE_AD_CLICK_URL?.trim();
  trackEvent(ANALYTICS_EVENTS.AD_CLICK_DOWNLOAD, {
    file_index: options?.fileIndex ?? 0,
    method: adUrl ? "popup" : "vignette",
    tool_id: options?.toolId,
  });

  if (adUrl) {
    window.open(adUrl, "_blank", "noopener,noreferrer");
  } else {
    await showAdVignette({ minMs: 3000, slotId: "custom-tool-download-gate" });
  }

  return { triggered: false, gateOpen: true };
}
