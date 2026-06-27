import { AdMob, BannerAdSize, BannerAdPosition } from "@capacitor-community/admob";
import { ANALYTICS_EVENTS, trackEvent } from "@/lib/analytics/events";
import { isAndroidApp } from "@/lib/platform";

let initialized = false;
let initPromise: Promise<void> | null = null;

function getAdMobAppId(): string | undefined {
  return import.meta.env.VITE_ADMOB_APP_ID?.trim();
}

function slot(type: "banner" | "interstitial" | "rewarded"): string | undefined {
  const map = {
    banner: import.meta.env.VITE_ADMOB_SLOT_BANNER,
    interstitial: import.meta.env.VITE_ADMOB_SLOT_INTERSTITIAL,
    rewarded: import.meta.env.VITE_ADMOB_SLOT_REWARDED,
  };
  return map[type]?.trim() || undefined;
}

export function isAdMobConfigured(): boolean {
  return isAndroidApp() && !!getAdMobAppId();
}

export function shouldUseAdMob(): boolean {
  return isAndroidApp() && isAdMobConfigured();
}

/** Never use redirect/popup ad networks on native Android. */
export function allowWebPopupAds(): boolean {
  return !isAndroidApp();
}

export async function initAdMob(): Promise<void> {
  if (!shouldUseAdMob() || initialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    await AdMob.initialize({
      initializeForTesting: import.meta.env.DEV,
      testingDevices: import.meta.env.VITE_ADMOB_TEST_DEVICE_IDS?.split(",").map((s) => s.trim()).filter(Boolean),
    });
    initialized = true;
  })();

  return initPromise;
}

export async function showAdMobBanner(): Promise<void> {
  const adId = slot("banner");
  if (!shouldUseAdMob() || !adId) return;
  await initAdMob();
  await AdMob.showBanner({
    adId,
    adSize: BannerAdSize.ADAPTIVE_BANNER,
    position: BannerAdPosition.BOTTOM_CENTER,
    margin: 0,
    isTesting: import.meta.env.DEV,
  });
  trackEvent(ANALYTICS_EVENTS.AD_IMPRESSION, { ad_format: "banner", ad_platform: "admob" });
}

export async function hideAdMobBanner(): Promise<void> {
  if (!isAndroidApp()) return;
  try {
    await AdMob.hideBanner();
  } catch {
    /* not shown */
  }
}

export async function showAdMobInterstitial(): Promise<void> {
  const adId = slot("interstitial");
  if (!shouldUseAdMob() || !adId) return;
  await initAdMob();
  await AdMob.prepareInterstitial({ adId, isTesting: import.meta.env.DEV });
  await AdMob.showInterstitial();
  trackEvent(ANALYTICS_EVENTS.AD_IMPRESSION, { ad_format: "interstitial", ad_platform: "admob" });
}

/** Returns true if user earned the reward (watched full ad). */
export async function showAdMobRewarded(): Promise<boolean> {
  const adId = slot("rewarded");
  if (!shouldUseAdMob() || !adId) return false;

  await initAdMob();

  return new Promise<boolean>((resolve) => {
    let rewarded = false;
    const listeners: Array<Promise<{ remove: () => void }>> = [];

    const cleanup = async () => {
      const handles = await Promise.all(listeners);
      handles.forEach((h) => h.remove());
    };

    listeners.push(
      AdMob.addListener("onRewardedVideoAdRewarded", () => {
        rewarded = true;
        trackEvent(ANALYTICS_EVENTS.AD_REWARD, { ad_format: "rewarded", ad_platform: "admob" });
      })
    );
    listeners.push(
      AdMob.addListener("onRewardedVideoAdDismissed", async () => {
        await cleanup();
        resolve(rewarded);
      })
    );
    listeners.push(
      AdMob.addListener("onRewardedVideoAdFailedToShow", async () => {
        await cleanup();
        resolve(false);
      })
    );

    void AdMob.prepareRewardVideoAd({ adId, isTesting: import.meta.env.DEV })
      .then(() => AdMob.showRewardVideoAd())
      .catch(async () => {
        await cleanup();
        resolve(false);
      });
  });
}
