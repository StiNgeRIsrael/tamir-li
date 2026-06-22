import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { DbUnavailableBanner } from "@/components/DbUnavailableBanner";
import { TopNavbar } from "@/components/TopNavbar";
import { SiteFooter } from "@/components/SiteFooter";
import { DesktopAdRail } from "@/components/ads/DesktopAdRail";
import { useLocale } from "@/lib/i18n";

function isPremiumSalesPath(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean);
  return segments[segments.length - 1] === "premium";
}

export function AppLayout({ children, hideSideAds }: { children: ReactNode; hideSideAds?: boolean }) {
  const { dir } = useLocale();
  const { pathname } = useLocation();
  const suppressSideAds = hideSideAds ?? isPremiumSalesPath(pathname);

  return (
    <div className="min-h-screen w-full flex flex-col utility-page-bg" dir={dir}>
      <DbUnavailableBanner />
      <TopNavbar />
      <div className="relative flex flex-1 justify-center">
        {!suppressSideAds && <DesktopAdRail side="start" />}
        <main className="relative w-full min-w-0 flex-1">
          {children}
        </main>
        {!suppressSideAds && <DesktopAdRail side="end" />}
      </div>
      <SiteFooter />
    </div>
  );
}
