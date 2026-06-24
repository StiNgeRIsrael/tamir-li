import { useCallback, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getApiBaseUrl } from "@/lib/api/client";
import { setPremiumUser } from "@/lib/ads/adsterra";

export type CheckoutPlan =
  | "monthly"
  | "yearly"
  | "credits_10"
  | "credits_30"
  | "credits_60"
  | "credits_120";

export type BillingStatus = {
  isPremium: boolean;
  plan: string | null;
  periodEnd: string | null;
  credits: number;
  provider?: string | null;
};

function getAuthHeaders(): HeadersInit {
  try {
    const token = localStorage.getItem("tamir_auth_token");
    if (token) return { Authorization: `Bearer ${token}` };
  } catch {
    /* private mode */
  }
  return {};
}

async function fetchBillingStatus(api: string): Promise<BillingStatus> {
  const res = await fetch(`${api}/api/billing/status`, {
    credentials: "include",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("billing_status");
  return res.json() as Promise<BillingStatus>;
}

async function postCheckout(api: string, plan: CheckoutPlan): Promise<string> {
  const res = await fetch(`${api}/api/billing/checkout`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ plan }),
  });
  const body = (await res.json().catch(() => ({}))) as { url?: string; message?: string; error?: string };
  if (res.status === 503) {
    throw new Error(body.message || "Billing is not configured yet.");
  }
  if (!res.ok) {
    throw new Error(body.message || "Checkout failed");
  }
  if (!body.url) throw new Error("Checkout failed");
  return body.url;
}

async function postActivateSubscription(api: string, subscriptionId: string): Promise<void> {
  const res = await fetch(`${api}/api/billing/paypal/activate-subscription`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ subscriptionId }),
  });
  const body = (await res.json().catch(() => ({}))) as { message?: string };
  if (!res.ok) {
    throw new Error(body.message || "Could not activate subscription");
  }
}

async function postCaptureOrder(api: string, orderId: string): Promise<void> {
  const res = await fetch(`${api}/api/billing/paypal/capture-order`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ orderId }),
  });
  const body = (await res.json().catch(() => ({}))) as { message?: string };
  if (!res.ok) {
    throw new Error(body.message || "Could not complete purchase");
  }
}

async function postPortal(api: string): Promise<string> {
  const res = await fetch(`${api}/api/billing/portal`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
  });
  const body = (await res.json().catch(() => ({}))) as { url?: string; message?: string };
  if (!res.ok) throw new Error(body.message || "Portal failed");
  if (!body.url) throw new Error("Portal failed");
  return body.url;
}

function hasAuthToken(): boolean {
  try {
    return !!localStorage.getItem("tamir_auth_token");
  } catch {
    return false;
  }
}

export function useSubscription() {
  const api = getApiBaseUrl();
  const queryClient = useQueryClient();
  const loggedIn = hasAuthToken();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["billing-status", api],
    queryFn: async () => {
      if (!api) return { isPremium: false, plan: null, periodEnd: null, credits: 0 };
      if (!loggedIn) return { isPremium: false, plan: null, periodEnd: null, credits: 0 };
      return fetchBillingStatus(api);
    },
    enabled: !!api && loggedIn,
    staleTime: 60_000,
    retry: 1,
  });

  const isPremium = !isError && (data?.isPremium ?? false);

  useEffect(() => {
    setPremiumUser(isPremium);
  }, [isPremium]);

  const checkoutMutation = useMutation({
    mutationFn: async (plan: CheckoutPlan) => {
      if (!api) throw new Error("API not configured");
      const url = await postCheckout(api, plan);
      window.location.href = url;
    },
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      if (!api) throw new Error("API not configured");
      const url = await postPortal(api);
      window.location.href = url;
    },
  });

  const checkout = useCallback(
    (plan: CheckoutPlan) => checkoutMutation.mutateAsync(plan),
    [checkoutMutation]
  );

  const openPortal = useCallback(
    () => portalMutation.mutateAsync(),
    [portalMutation]
  );

  const captureOrder = useCallback(
    async (orderId: string) => {
      if (!api) throw new Error("API not configured");
      await postCaptureOrder(api, orderId);
      await queryClient.invalidateQueries({ queryKey: ["billing-status", api] });
    },
    [api, queryClient]
  );

  const activateSubscription = useCallback(
    async (subscriptionId: string) => {
      if (!api) throw new Error("API not configured");
      await postActivateSubscription(api, subscriptionId);
      await queryClient.invalidateQueries({ queryKey: ["billing-status", api] });
    },
    [api, queryClient]
  );

  const refetch = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ["billing-status", api] }),
    [queryClient, api]
  );

  return {
    isPremium,
    plan: data?.plan ?? null,
    periodEnd: data?.periodEnd ?? null,
    credits: data?.credits ?? 0,
    loading: !!api && loggedIn && isLoading && !isError,
    checkout,
    checkoutLoading: checkoutMutation.isPending,
    openPortal,
    portalLoading: portalMutation.isPending,
    captureOrder,
    activateSubscription,
    refetch,
  };
}
