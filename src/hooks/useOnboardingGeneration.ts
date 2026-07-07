import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getApiBaseUrl } from "@/lib/api/client";
import {
  applyServerOnboardingGeneration,
  isOnboardingDoneForGeneration,
} from "@/lib/onboarding";
import { isNativeApp } from "@/lib/platform";

export type AppOnboardingSettings = {
  onboardingOfferGeneration: number;
  onboardingRepromptedAt: string | null;
};

const FALLBACK: AppOnboardingSettings = {
  onboardingOfferGeneration: 0,
  onboardingRepromptedAt: null,
};

async function fetchAppOnboardingSettings(api: string): Promise<AppOnboardingSettings> {
  const res = await fetch(`${api}/api/app/onboarding`, { credentials: "include" });
  if (!res.ok) throw new Error("app_onboarding_settings");
  return res.json() as Promise<AppOnboardingSettings>;
}

/** Sync server onboarding generation with local storage (native app). */
export function useOnboardingGeneration() {
  const api = getApiBaseUrl();
  const native = isNativeApp();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["app-onboarding-settings", api],
    queryFn: () => fetchAppOnboardingSettings(api!),
    enabled: native && !!api,
    staleTime: 30_000,
    retry: 1,
  });

  const settings = data ?? FALLBACK;
  const generation = settings.onboardingOfferGeneration;

  useEffect(() => {
    if (!native || isLoading || isError) return;
    applyServerOnboardingGeneration(generation);
  }, [native, generation, isLoading, isError]);

  const ready = !native || !api || (!isLoading && !isError);
  const isDone = ready ? isOnboardingDoneForGeneration(generation) : true;

  return {
    generation,
    repromptedAt: settings.onboardingRepromptedAt,
    ready,
    isDone,
    isLoading: native && !!api && isLoading,
  };
}
