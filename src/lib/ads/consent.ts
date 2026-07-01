import { initGA4, initGTM, updateConsentMode } from "@/lib/analytics/gtm";
import { loadPopunderScript, prefetchAdZoneScripts } from "@/lib/ads/adsterra";
import { prefetchHilltopScripts } from "@/lib/ads/hilltopads";

const CONSENT_STORAGE_KEY = "tamir_consent_v1";

export type ConsentState = {
  analytics: boolean;
  ads: boolean;
  timestamp: number;
};

export function getStoredConsent(): ConsentState | null {
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentState;
    if (typeof parsed.analytics !== "boolean" || typeof parsed.ads !== "boolean") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setStoredConsent(state: ConsentState): void {
  localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(state));
}

export function hasConsentChoice(): boolean {
  return getStoredConsent() !== null;
}

function activateConsent(state: ConsentState): void {
  updateConsentMode({ analytics: state.analytics, ads: state.ads });
  if (state.analytics) {
    initGTM();
    initGA4();
  }
  if (state.ads) {
    prefetchAdZoneScripts();
    prefetchHilltopScripts();
    loadPopunderScript();
  }
  window.dispatchEvent(new CustomEvent("tamir:consent", { detail: state }));
}

/** Restore consent from localStorage on app boot. */
export function applyStoredConsent(): void {
  const stored = getStoredConsent();
  if (stored) activateConsent(stored);
}

/** Persist user choice and load analytics/ads scripts as allowed. */
export function saveConsent(analytics: boolean, ads: boolean): void {
  const state: ConsentState = { analytics, ads, timestamp: Date.now() };
  setStoredConsent(state);
  activateConsent(state);
  if (analytics) {
    // Dynamic import avoids circular dependency with events.ts → consent.ts
    void import("@/lib/analytics/events").then(({ trackEvent, ANALYTICS_EVENTS }) => {
      trackEvent(ANALYTICS_EVENTS.COOKIE_CONSENT, { analytics, ads });
    });
  }
}
