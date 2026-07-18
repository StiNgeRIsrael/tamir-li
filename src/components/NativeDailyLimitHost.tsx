import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { NativeDailyLimitGate } from "@/components/NativeDailyLimitGate";
import { useUsage } from "@/hooks/useUsage";
import { useSubscription } from "@/hooks/useSubscription";
import { isNativeApp } from "@/lib/platform";
import { isUsageUnlockedThisSession } from "@/lib/usage-unlock-session";

const SKIP_PATHS = ["/premium", "/admin"];

function shouldSkipPath(pathname: string): boolean {
  return SKIP_PATHS.some((p) => pathname.includes(p));
}

/** Shows fullscreen daily-limit gate on native when free quota is hit. */
export function NativeDailyLimitHost() {
  const { pathname } = useLocation();
  const { atLimit, loading: usageLoading } = useUsage();
  const { isPremium, loading: subLoading } = useSubscription();
  const [unlocked, setUnlocked] = useState(isUsageUnlockedThisSession);

  useEffect(() => {
    setUnlocked(isUsageUnlockedThisSession());
  }, [atLimit]);

  if (!isNativeApp() || usageLoading || subLoading || isPremium || shouldSkipPath(pathname)) {
    return null;
  }

  const show = atLimit && !unlocked;

  return (
    <NativeDailyLimitGate
      open={show}
      onUnlocked={() => setUnlocked(true)}
    />
  );
}
