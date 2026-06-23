import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { getApiBaseUrl } from "@/lib/api/client";
import { setAdRuntimeConfig, type AdRuntimeConfig } from "@/lib/ads/adsterra";

export type AdConfigContextValue = {
  loading: boolean;
  config: AdRuntimeConfig | null;
};

const fallback: AdConfigContextValue = {
  loading: false,
  config: null,
};

const AdConfigContext = createContext<AdConfigContextValue>(fallback);

export function AdConfigProvider({ children }: { children: ReactNode }) {
  const api = getApiBaseUrl();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["ad-config", api],
    queryFn: async () => {
      const res = await fetch(`${api}/api/ads/config`);
      if (!res.ok) throw new Error("ad_config");
      return res.json() as Promise<AdRuntimeConfig>;
    },
    enabled: !!api,
    staleTime: 60_000,
    retry: 1,
  });

  useEffect(() => {
    if (!api || isError) {
      setAdRuntimeConfig(null);
      return;
    }
    if (data) {
      setAdRuntimeConfig(data);
    }
  }, [api, data, isError]);

  const value = useMemo((): AdConfigContextValue => {
    if (!api) return fallback;
    if (isLoading && !data) {
      return { loading: true, config: null };
    }
    if (isError || !data) {
      return fallback;
    }
    return { loading: false, config: data };
  }, [api, data, isLoading, isError]);

  return <AdConfigContext.Provider value={value}>{children}</AdConfigContext.Provider>;
}

export function useAdConfig(): AdConfigContextValue {
  return useContext(AdConfigContext);
}
