import { useEffect, useState } from "react";
import { getStoredConsent } from "@/lib/ads/consent";

/** Reactive ad consent flag; updates when the cookie banner saves or restores consent. */
export function useAdsConsent(): boolean {
  const [hasConsent, setHasConsent] = useState(() => getStoredConsent()?.ads === true);

  useEffect(() => {
    const syncConsent = () => setHasConsent(getStoredConsent()?.ads === true);
    window.addEventListener("tamir:consent", syncConsent);
    return () => window.removeEventListener("tamir:consent", syncConsent);
  }, []);

  return hasConsent;
}
