import { useCallback, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getApiBaseUrl } from "@/lib/api/client";

const STORAGE_KEY = "tamir_usage_v1";
const MAX_DAILY_FREE = 5;

export type UsageSnapshot = {
  used: number;
  max: number | null;
  isPremium: boolean;
  remaining: number | null;
};

function todayKey(): string {
  return new Date().toISOString().split("T")[0];
}

function readLocalUsage(): UsageSnapshot {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { date: string; count: number };
      if (parsed.date === todayKey()) {
        const used = parsed.count;
        return {
          used,
          max: MAX_DAILY_FREE,
          isPremium: false,
          remaining: Math.max(0, MAX_DAILY_FREE - used),
        };
      }
    }
  } catch {
    /* private mode */
  }
  return {
    used: 0,
    max: MAX_DAILY_FREE,
    isPremium: false,
    remaining: MAX_DAILY_FREE,
  };
}

function writeLocalUsage(count: number): UsageSnapshot {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: todayKey(), count }));
  } catch {
    /* private mode */
  }
  return {
    used: count,
    max: MAX_DAILY_FREE,
    isPremium: false,
    remaining: Math.max(0, MAX_DAILY_FREE - count),
  };
}

function getAuthHeaders(): HeadersInit {
  try {
    const token = localStorage.getItem("tamir_auth_token");
    if (token) return { Authorization: `Bearer ${token}` };
  } catch {
    /* private mode */
  }
  return {};
}

async function fetchUsageToday(api: string): Promise<UsageSnapshot> {
  const res = await fetch(`${api}/api/usage/today`, {
    credentials: "include",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("usage_fetch_failed");
  return res.json() as Promise<UsageSnapshot>;
}

async function postUsageRecord(
  api: string,
  payload: { toolId: string; fromFormat?: string; toFormat?: string }
): Promise<UsageSnapshot> {
  const res = await fetch(`${api}/api/usage/record`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(payload),
  });
  if (res.status === 429) {
    const body = (await res.json()) as UsageSnapshot & { error?: string };
    return {
      used: body.used ?? MAX_DAILY_FREE,
      max: body.max ?? MAX_DAILY_FREE,
      isPremium: false,
      remaining: 0,
    };
  }
  if (!res.ok) throw new Error("usage_record_failed");
  return res.json() as Promise<UsageSnapshot>;
}

export function useUsage() {
  const api = getApiBaseUrl();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["usage-today", api],
    queryFn: async () => {
      if (!api) return readLocalUsage();
      try {
        return await fetchUsageToday(api);
      } catch {
        return readLocalUsage();
      }
    },
    staleTime: 30_000,
    retry: 1,
  });

  const snapshot: UsageSnapshot =
    data ??
    (api && isLoading
      ? { used: 0, max: MAX_DAILY_FREE, isPremium: false, remaining: MAX_DAILY_FREE }
      : readLocalUsage());

  const recordMutation = useMutation({
    mutationFn: async (payload: { toolId: string; fromFormat?: string; toFormat?: string }) => {
      if (!api) {
        const next = readLocalUsage().used + 1;
        return writeLocalUsage(next);
      }
      try {
        return await postUsageRecord(api, payload);
      } catch {
        const next = readLocalUsage().used + 1;
        return writeLocalUsage(next);
      }
    },
    onSuccess: (result) => {
      queryClient.setQueryData(["usage-today", api], result);
    },
  });

  const mutateAsyncRef = useRef(recordMutation.mutateAsync);
  mutateAsyncRef.current = recordMutation.mutateAsync;

  const recordUsage = useCallback(
    (payload: { toolId: string; fromFormat?: string; toFormat?: string }) =>
      mutateAsyncRef.current(payload),
    []
  );

  return {
    used: snapshot.used,
    max: snapshot.max ?? MAX_DAILY_FREE,
    remaining: snapshot.remaining ?? Math.max(0, MAX_DAILY_FREE - snapshot.used),
    isPremium: snapshot.isPremium,
    loading: !!api && isLoading && !isError,
    atLimit: !snapshot.isPremium && snapshot.used >= MAX_DAILY_FREE,
    recordUsage,
    refetch: () => queryClient.invalidateQueries({ queryKey: ["usage-today", api] }),
  };
}
