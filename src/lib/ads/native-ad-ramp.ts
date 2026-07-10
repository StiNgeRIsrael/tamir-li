import { showAdVignette } from "@/components/ads/AdVignette";
import { shouldUseAdMob, showAdMobInterstitial } from "@/lib/ads/admob";
import { markPostConvertAdSatisfied } from "@/lib/ads/post-convert-ad-session";

const STORAGE_KEY = "tamir_native_conversions_v1";

export type NativeAdExperience = {
  /** Completed conversions before the current moment. */
  completedBefore: number;
  showBanner: boolean;
  showInterstitialOnConvert: boolean;
  gateDownloadWithRewarded: boolean;
  showPremiumAdHint: boolean;
  premiumHintTone: "none" | "subtle" | "prominent";
};

function readCount(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const n = Number(JSON.parse(raw));
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
  } catch {
    return 0;
  }
}

function writeCount(n: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(n));
  } catch {
    /* private mode */
  }
}

/** True when Android AdMob is active and the gradual ramp applies. */
export function shouldUseNativeAdRamp(): boolean {
  return shouldUseAdMob();
}

/** How many conversions the user already finished on this device (app). */
export function getNativeCompletedConversions(): number {
  return readCount();
}

/** Call once after a successful conversion on native. Returns the new total. */
export function recordNativeConversionComplete(): number {
  const next = readCount() + 1;
  writeCount(next);
  return next;
}

/**
 * Ad surfaces for the native app based on prior completed conversions.
 * First conversion: zero ads. Second: one full-screen interstitial after convert.
 * Later: banner + interstitial, then rewarded download gate.
 */
export function getNativeAdExperience(completedBefore = readCount()): NativeAdExperience {
  if (completedBefore < 1) {
    return {
      completedBefore,
      showBanner: false,
      showInterstitialOnConvert: false,
      gateDownloadWithRewarded: false,
      showPremiumAdHint: false,
      premiumHintTone: "none",
    };
  }
  if (completedBefore === 1) {
    return {
      completedBefore,
      showBanner: false,
      showInterstitialOnConvert: true,
      gateDownloadWithRewarded: false,
      showPremiumAdHint: true,
      premiumHintTone: "subtle",
    };
  }
  if (completedBefore <= 3) {
    return {
      completedBefore,
      showBanner: true,
      showInterstitialOnConvert: true,
      gateDownloadWithRewarded: false,
      showPremiumAdHint: true,
      premiumHintTone: "subtle",
    };
  }
  return {
    completedBefore,
    showBanner: true,
    showInterstitialOnConvert: true,
    gateDownloadWithRewarded: true,
    showPremiumAdHint: true,
    premiumHintTone: "prominent",
  };
}

export function shouldShowNativeBanner(): boolean {
  return shouldUseNativeAdRamp() && getNativeAdExperience().showBanner;
}

export function shouldGateNativeDownload(): boolean {
  return shouldUseNativeAdRamp() && getNativeAdExperience().gateDownloadWithRewarded;
}

/** Full-screen interstitial after a successful conversion (native only). */
export async function runNativePostConvertAdFlow(): Promise<NativeAdExperience> {
  const exp = getNativeAdExperience();
  if (exp.showInterstitialOnConvert) {
    await showAdMobInterstitial().catch(() => undefined);
  }
  return exp;
}

/** Post-convert ad moment — native ramp or web vignette. Marks session so download gate is skipped. */
export async function runPostConvertAdFlow(isPremium: boolean): Promise<NativeAdExperience | null> {
  if (isPremium) return null;
  if (shouldUseNativeAdRamp()) {
    const exp = await runNativePostConvertAdFlow();
    if (exp.showInterstitialOnConvert) {
      markPostConvertAdSatisfied();
    }
    return exp;
  }
  await showAdVignette({ minMs: 3500, slotId: "convert-success-vignette" });
  markPostConvertAdSatisfied();
  return null;
}
