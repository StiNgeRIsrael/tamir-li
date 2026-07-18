import { Outlet } from "react-router-dom";
import { AppShellHeader } from "@/app-shell/AppShellHeader";
import { AppTabBar } from "@/app-shell/AppTabBar";
import { DbUnavailableBanner } from "@/components/DbUnavailableBanner";

/**
 * Capacitor app chrome — tab bar + compact header.
 * One deploy: same SPA as web; this shell only mounts when isNativeApp().
 */
export function NativeAppShell() {
  return (
    <div className="native-app-shell flex h-dvh max-h-dvh flex-col overflow-hidden bg-background">
      <DbUnavailableBanner />
      <AppShellHeader />
      <main className="relative min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
        <Outlet />
      </main>
      <AppTabBar />
    </div>
  );
}
