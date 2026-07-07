/** Lightweight haptic feedback via the Vibration API (works in Android WebView / Capacitor). */

function canVibrate(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Subtle tap feedback for selections. Use sparingly (confirmations only). */
export function hapticLight(): void {
  if (!canVibrate() || prefersReducedMotion()) return;
  try {
    navigator.vibrate(10);
  } catch {
    /* ignore */
  }
}

/** Slightly stronger feedback for a key commit (e.g. accepting the offer). */
export function hapticSuccess(): void {
  if (!canVibrate() || prefersReducedMotion()) return;
  try {
    navigator.vibrate([12, 40, 18]);
  } catch {
    /* ignore */
  }
}
