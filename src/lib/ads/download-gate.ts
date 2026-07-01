import { ANALYTICS_EVENTS, trackEvent } from "@/lib/analytics/events";
import { showAdVignette } from "@/components/ads/AdVignette";
import { showAdMobRewarded, shouldUseAdMob, allowWebPopupAds } from "@/lib/ads/admob";
import { shouldGateNativeDownload } from "@/lib/ads/native-ad-ramp";
import { getHilltopPopunderUrl } from "@/lib/ads/hilltopads";

import { formatToExtension } from "@/lib/image-convert";

/** Popup URL for download gate: Hilltopads primary, env fallback. */
export function getWebPopupAdUrl(): string | undefined {
  if (!allowWebPopupAds()) return undefined;
  return getHilltopPopunderUrl() || import.meta.env.VITE_AD_CLICK_URL?.trim() || undefined;
}

/** Trigger browser download for a converted file (mock: re-exports source with new extension). */
export function triggerFileDownload(file: File, outputFormat: string): void {
  const baseName = file.name.replace(/\.[^.]+$/, "");
  const ext = formatToExtension(outputFormat);
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${baseName}.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Download a converted blob with the correct extension. */
export function triggerBlobDownload(blob: Blob, baseName: string, outputFormat: string): void {
  const ext = formatToExtension(outputFormat);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${baseName}.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
}

export type DownloadGateState = Record<number, boolean>;

/** First click opens ad; second click downloads. Returns true if download was triggered. */
export async function handleGatedDownload(
  fileIndex: number,
  file: File,
  outputFormat: string,
  gateState: DownloadGateState,
  isPremium: boolean,
  resultBlob?: Blob
): Promise<{ triggered: boolean; nextState: DownloadGateState }> {
  const baseName = file.name.replace(/\.[^.]+$/, "");

  const doDownload = () => {
    if (resultBlob) {
      triggerBlobDownload(resultBlob, baseName, outputFormat);
    } else {
      triggerFileDownload(file, outputFormat);
    }
  };

  if (isPremium || gateState[fileIndex]) {
    doDownload();
    return { triggered: true, nextState: gateState };
  }

  const adUrl = getWebPopupAdUrl();
  trackEvent(ANALYTICS_EVENTS.AD_CLICK_DOWNLOAD, {
    file_index: fileIndex,
    method: shouldUseAdMob() ? "admob_rewarded" : adUrl ? "popup" : "vignette",
  });

  if (shouldUseAdMob()) {
    if (!shouldGateNativeDownload()) {
      doDownload();
      return { triggered: true, nextState: gateState };
    }
    const rewarded = await showAdMobRewarded();
    if (rewarded) {
      doDownload();
      return { triggered: true, nextState: gateState };
    }
    return { triggered: false, nextState: gateState };
  }

  if (adUrl) {
    window.open(adUrl, "_blank", "noopener,noreferrer");
  } else {
    await showAdVignette({ minMs: 3000, slotId: "download-gate-vignette" });
  }

  return {
    triggered: false,
    nextState: { ...gateState, [fileIndex]: true },
  };
}
