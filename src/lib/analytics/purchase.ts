import type { CheckoutPlan } from "@/hooks/useSubscription";

/** ILS amounts aligned with backend/src/lib/billing-shared.ts and upgradePage copy. */
const PLAN_VALUE_ILS: Record<string, number> = {
  monthly: 19.9,
  yearly: 191.04,
  credits_10: 8,
  credits_30: 21,
  credits_60: 39,
  credits_120: 72,
};

const PLAN_ITEM_NAMES: Record<string, string> = {
  monthly: "Premium Monthly",
  yearly: "Premium Yearly",
  credits_10: "AI Credits — 10",
  credits_30: "AI Credits — 30",
  credits_60: "AI Credits — 60",
  credits_120: "AI Credits — 120",
};

/** GA4 ecommerce fields for `purchase` and `begin_checkout` events. */
export function getPlanEcommerceParams(plan: string | undefined): {
  currency: string;
  value?: number;
  items?: Array<{ item_id: string; item_name: string; price: number; quantity: number }>;
} {
  if (!plan || !(plan in PLAN_VALUE_ILS)) {
    return { currency: "ILS" };
  }
  const value = PLAN_VALUE_ILS[plan];
  const itemName = PLAN_ITEM_NAMES[plan] ?? plan;
  return {
    currency: "ILS",
    value,
    items: [{ item_id: plan, item_name: itemName, price: value, quantity: 1 }],
  };
}

export function isCheckoutPlan(plan: string | undefined): plan is CheckoutPlan {
  return !!plan && plan in PLAN_VALUE_ILS;
}
