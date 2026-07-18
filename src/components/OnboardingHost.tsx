import { lazy, Suspense, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useOnboardingGeneration } from "@/hooks/useOnboardingGeneration";
import { isNativeApp } from "@/lib/platform";

const OnboardingFunnel = lazy(() =>
  import("@/components/onboarding/OnboardingFunnel").then((m) => ({
    default: m.OnboardingFunnel,
  }))
);

const SKIP_PATH_PREFIXES = ["/admin", "/premium"];

function shouldSkipPath(pathname: string): boolean {
  return SKIP_PATH_PREFIXES.some((p) => pathname.includes(p));
}

/** First-visit premium funnel — Android/iOS app only. */
export function OnboardingHost() {
  const { pathname } = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { isPremium, loading: billingLoading } = useSubscription();
  const { generation, ready, isDone, isLoading: genLoading } = useOnboardingGeneration();
  const [open, setOpen] = useState(false);
  const serverOnboardingDone = !!user?.onboardingCompletedAt;

  useEffect(() => {
    if (!isNativeApp()) return;
    if (!ready || authLoading || billingLoading || genLoading) return;
    if (isPremium || isDone || serverOnboardingDone || shouldSkipPath(pathname)) return;

    const timer = window.setTimeout(() => setOpen(true), 1200);
    return () => window.clearTimeout(timer);
  }, [ready, authLoading, billingLoading, genLoading, isPremium, isDone, serverOnboardingDone, pathname]);

  if (!open) return null;

  return (
    <Suspense fallback={null}>
      <OnboardingFunnel open={open} onOpenChange={setOpen} offerGeneration={generation} />
    </Suspense>
  );
}
