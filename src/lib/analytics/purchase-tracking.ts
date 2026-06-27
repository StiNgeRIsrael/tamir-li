import type { CheckoutPlan } from "@/hooks/useSubscription";
import { ANALYTICS_EVENTS, hasAnalyticsConsent, trackEvent } from "@/lib/analytics/events";
import {
  getGoogleAdsConversionLabels,
  getStoredAdsClickIds,
  reportGoogleAdsConversion,
} from "@/lib/analytics/google-ads";
import { getPlanEcommerceParams } from "@/lib/analytics/purchase";
import { GOOGLE_PLAY_PRODUCTS } from "@/lib/platform";

const PURCHASE_DEDUP_PREFIX = "tamir_purchase_";

export type PurchaseProvider = "paypal" | "google_play";

export type TrackPurchaseParams = {
  plan: CheckoutPlan;
  source: string;
  transactionId?: string;
  provider?: PurchaseProvider;
};

export type TrackCheckoutParams = {
  plan: CheckoutPlan;
  source: string;
};

function dedupKey(transactionId: string): string {
  return `${PURCHASE_DEDUP_PREFIX}${transactionId}`;
}

function isDuplicatePurchase(transactionId: string): boolean {
  try {
    return sessionStorage.getItem(dedupKey(transactionId)) === "1";
  } catch {
    return false;
  }
}

function markPurchaseRecorded(transactionId: string): void {
  try {
    sessionStorage.setItem(dedupKey(transactionId), "1");
  } catch {
    /* private mode */
  }
}

/** Map Play product ID back to checkout plan for ecommerce value. */
export function googlePlayProductToPlan(productId: string): CheckoutPlan | null {
  const entry = Object.entries(GOOGLE_PLAY_PRODUCTS).find(([, id]) => id === productId);
  return entry ? (entry[0] as CheckoutPlan) : null;
}

/** GA4 `begin_checkout` + optional funnel context. Call after sign-in gate. */
export function trackBeginCheckout({ plan, source }: TrackCheckoutParams): void {
  if (!hasAnalyticsConsent()) return;
  const ecommerce = getPlanEcommerceParams(plan);
  trackEvent(ANALYTICS_EVENTS.BEGIN_CHECKOUT, {
    plan,
    source,
    ...ecommerce,
    ...getStoredAdsClickIds(),
  });
}

export function trackUpgradeClick(plan: CheckoutPlan, source: string): void {
  if (!hasAnalyticsConsent()) return;
  trackEvent(ANALYTICS_EVENTS.UPGRADE_CLICK, { plan, source });
}

export function trackCheckoutCanceled(plan: CheckoutPlan | undefined): void {
  if (!hasAnalyticsConsent()) return;
  trackEvent(ANALYTICS_EVENTS.CHECKOUT_CANCELED, { plan });
}

export function trackCheckoutError(plan: CheckoutPlan | undefined, message: string): void {
  if (!hasAnalyticsConsent()) return;
  trackEvent(ANALYTICS_EVENTS.CHECKOUT_ERROR, { plan, error_message: message.slice(0, 120) });
}

/**
 * Record a completed sale to GA4 (`purchase`) and Google Ads (conversion).
 * Dedupes by transaction_id when provided.
 */
export function trackPurchase({
  plan,
  source,
  transactionId,
  provider = "paypal",
}: TrackPurchaseParams): void {
  const txId = transactionId?.trim() || `${provider}_${plan}_${Date.now()}`;
  if (isDuplicatePurchase(txId)) return;
  markPurchaseRecorded(txId);

  const ecommerce = getPlanEcommerceParams(plan);
  const clickIds = getStoredAdsClickIds();

  if (hasAnalyticsConsent()) {
    trackEvent(ANALYTICS_EVENTS.PURCHASE, {
      plan,
      source,
      transaction_id: txId,
      payment_provider: provider,
      ...ecommerce,
      ...clickIds,
    });
  }

  if (getGoogleAdsConversionLabels().length > 0) {
    reportGoogleAdsConversion({
      value: ecommerce.value,
      currency: ecommerce.currency,
      transaction_id: txId,
    });
  }
}
