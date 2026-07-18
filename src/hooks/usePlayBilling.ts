import { useCallback } from "react";
import { NativePurchases, PURCHASE_TYPE } from "@capgo/native-purchases";
import { getApiBaseUrl } from "@/lib/api/client";
import {
  GOOGLE_PLAY_BASE_PLANS,
  GOOGLE_PLAY_PRODUCTS,
  isAndroidApp,
} from "@/lib/platform";
import type { CheckoutPlan } from "@/hooks/useSubscription";

function getAuthHeaders(): HeadersInit {
  try {
    const token = localStorage.getItem("tamir_auth_token");
    if (token) return { Authorization: `Bearer ${token}` };
  } catch {
    /* private mode */
  }
  return {};
}

function planToProductId(plan: CheckoutPlan): string {
  if (plan === "monthly") return GOOGLE_PLAY_PRODUCTS.monthly;
  if (plan === "yearly") return GOOGLE_PLAY_PRODUCTS.yearly;
  return GOOGLE_PLAY_PRODUCTS[plan];
}

function planToBasePlanId(plan: CheckoutPlan): string | undefined {
  if (plan === "monthly") return GOOGLE_PLAY_BASE_PLANS.monthly;
  if (plan === "yearly") return GOOGLE_PLAY_BASE_PLANS.yearly;
  return undefined;
}

function planToPurchaseType(plan: CheckoutPlan): PURCHASE_TYPE {
  return plan === "monthly" || plan === "yearly" ? PURCHASE_TYPE.SUBS : PURCHASE_TYPE.INAPP;
}

export function useNativeBillingAvailable(): boolean {
  return isAndroidApp();
}

export function usePlayBilling() {
  const api = getApiBaseUrl();

  const purchase = useCallback(
    async (plan: CheckoutPlan) => {
      if (!isAndroidApp()) {
        throw new Error("Google Play Billing is only available in the Android app.");
      }
      if (!api) throw new Error("API not configured");

      const productId = planToProductId(plan);
      const productType = planToPurchaseType(plan);
      const basePlanId = planToBasePlanId(plan);

      const supported = await NativePurchases.isBillingSupported();
      if (!supported.isBillingSupported) {
        throw new Error("Google Play Billing is not available on this device.");
      }

      const transaction = await NativePurchases.purchaseProduct({
        productIdentifier: productId,
        productType,
        planIdentifier: productType === PURCHASE_TYPE.SUBS ? basePlanId : undefined,
      });

      if (transaction.purchaseState && transaction.purchaseState !== "1") {
        throw new Error("Purchase was not completed.");
      }

      const purchaseToken = transaction.purchaseToken;
      if (!purchaseToken) {
        throw new Error("Missing purchase token from Google Play.");
      }

      const res = await fetch(`${api}/api/billing/google/verify`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ productId, purchaseToken }),
      });

      const body = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        throw new Error(body.message || "Could not verify purchase with server.");
      }
    },
    [api]
  );

  const openSubscriptionManagement = useCallback(async () => {
    if (!isAndroidApp()) return;
    await NativePurchases.manageSubscriptions();
  }, []);

  return { purchase, openSubscriptionManagement };
}
