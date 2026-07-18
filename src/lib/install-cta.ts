import { isNativeApp } from "@/lib/platform";

/** Hide PWA / Play install CTAs when already inside the Capacitor shell. */
export function shouldShowInstallCta(): boolean {
  return !isNativeApp();
}
