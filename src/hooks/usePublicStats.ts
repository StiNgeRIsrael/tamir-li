import { useQuery } from "@tanstack/react-query";
import { getApiBaseUrl } from "@/lib/api/client";
import type { PublicStatsResponse } from "@/lib/public-stats";

async function fetchPublicStats(): Promise<PublicStatsResponse | null> {
  const api = getApiBaseUrl();
  const res = await fetch(`${api}/api/stats/public`, { credentials: "include" });
  if (!res.ok) return null;
  return res.json() as Promise<PublicStatsResponse>;
}

export function usePublicStats() {
  return useQuery({
    queryKey: ["public-stats"],
    queryFn: fetchPublicStats,
    staleTime: 5 * 60_000,
    retry: 1,
  });
}
