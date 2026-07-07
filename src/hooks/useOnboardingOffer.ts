import { useEffect, useState } from "react";
import {
  formatCountdown,
  getOfferRemainingMs,
  getOrCreateOfferDeadline,
} from "@/lib/onboarding";

export function useOnboardingOffer(active: boolean) {
  const [deadline, setDeadline] = useState(0);
  const [remainingMs, setRemainingMs] = useState(0);

  useEffect(() => {
    if (!active) return;
    const d = getOrCreateOfferDeadline();
    setDeadline(d);
    setRemainingMs(getOfferRemainingMs(d));
  }, [active]);

  useEffect(() => {
    if (!active || !deadline) return;

    const tick = () => setRemainingMs(getOfferRemainingMs(deadline));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [active, deadline]);

  return {
    deadline,
    remainingMs,
    expired: active && deadline > 0 ? remainingMs <= 0 : false,
    countdown: formatCountdown(remainingMs),
  };
}
