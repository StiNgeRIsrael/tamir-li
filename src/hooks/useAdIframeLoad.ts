import { useCallback, useEffect, useRef, useState } from "react";

export type AdLoadStatus = "loading" | "loaded" | "failed";

const MAX_ATTEMPTS = 2;
/** Parent safety net — longer than iframe timeout (20s) × attempts. */
const PARENT_FAIL_MS = 45_000;

type IframeAdMessage = {
  tamirAdSlot?: string;
  status?: string;
};

/**
 * Tracks Adsterra iframe load via postMessage. Once loaded, status never regresses.
 * Retries once (remount iframe via retryKey) before marking failed.
 *
 * @param messageSlot - value iframe sends as `tamirAdSlot` (usually slotId)
 * @param slotIdentity - resets state when zone/slot changes (e.g. `${slotId}:${zoneKey}`)
 */
export function useAdIframeLoad(active: boolean, messageSlot: string, slotIdentity: string) {
  const [adStatus, setAdStatus] = useState<AdLoadStatus>("loading");
  const [retryKey, setRetryKey] = useState(0);
  const loadedRef = useRef(false);
  const attemptRef = useRef(0);
  const slotIdentityRef = useRef(slotIdentity);

  const retry = useCallback(() => {
    if (loadedRef.current) return;
    attemptRef.current = 0;
    setRetryKey((k) => k + 1);
    setAdStatus("loading");
  }, []);

  useEffect(() => {
    if (slotIdentityRef.current !== slotIdentity) {
      slotIdentityRef.current = slotIdentity;
      loadedRef.current = false;
      attemptRef.current = 0;
      setRetryKey(0);
      setAdStatus("loading");
    }
  }, [slotIdentity]);

  useEffect(() => {
    if (!active) return;

    if (loadedRef.current) {
      setAdStatus("loaded");
      return;
    }

    setAdStatus("loading");

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

    const onMessage = (event: MessageEvent) => {
      const data = event.data as IframeAdMessage | null;
      if (!data || data.tamirAdSlot !== messageSlot) return;

      if (data.status === "loaded") {
        loadedRef.current = true;
        setAdStatus("loaded");
        return;
      }

      if (
        !loadedRef.current &&
        (data.status === "error" || data.status === "timeout" || data.status === "blocked")
      ) {
        scheduleRetryOrFail();
      }
    };

    window.addEventListener("message", onMessage);
    const failTimer = window.setTimeout(() => {
      if (loadedRef.current) return;
      scheduleRetryOrFail();
    }, PARENT_FAIL_MS);

    return () => {
      window.removeEventListener("message", onMessage);
      window.clearTimeout(failTimer);
    };
  }, [active, messageSlot, slotIdentity, retryKey]);

  return {
    adStatus,
    retryKey,
    retry,
    showFailedOverlay: adStatus === "failed",
    /** Iframe stays visible while loading — no overlay obscuring slow CDN loads. */
    iframeHidden: adStatus === "failed",
  };
}
