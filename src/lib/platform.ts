import { Capacitor } from "@capacitor/core";

/** True when running inside the Capacitor Android/iOS shell (not mobile browser). */
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

export function isAndroidApp(): boolean {
  return Capacitor.getPlatform() === "android";
}

export const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.tamir.li";

/** Google Play subscription product IDs — must match Play Console. */
export const GOOGLE_PLAY_PRODUCTS = {
  monthly: "tamir_premium_monthly",
  yearly: "tamir_premium_yearly",
  credits_10: "credits_10",
  credits_30: "credits_30",
  credits_60: "credits_60",
  credits_120: "credits_120",
} as const;

/**
 * Base plan IDs under each subscription product (Play monetization API).
 * Capgo `planIdentifier` must match these, not the product id.
 */
export const GOOGLE_PLAY_BASE_PLANS = {
  monthly: "monthly",
  yearly: "yearly",
} as const;
