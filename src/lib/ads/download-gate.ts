import { trackEvent } from "@/lib/analytics/events";
import { showAdVignette } from "@/components/ads/AdVignette";

import { formatToExtension } from "@/lib/image-convert";

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
  if (isPremium || gateState[fileIndex]) {
    const baseName = file.name.replace(/\.[^.]+$/, "");
    if (resultBlob) {
      triggerBlobDownload(resultBlob, baseName, outputFormat);
    } else {
      triggerFileDownload(file, outputFormat);
    }
    return { triggered: true, nextState: gateState };
  }

  const adUrl = import.meta.env.VITE_AD_CLICK_URL?.trim();
  trackEvent("ad_click_download", { file_index: fileIndex, method: adUrl ? "popup" : "vignette" });

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
