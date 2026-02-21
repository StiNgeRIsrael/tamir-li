import { ReactNode, useEffect } from "react";
import { TopNavbar } from "@/components/TopNavbar";
import { SiteFooter } from "@/components/SiteFooter";
import { useLocale } from "@/lib/i18n";

export function AppLayout({ children }: { children: ReactNode }) {
  const { locale, dir } = useLocale();

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = locale;
  }, [dir, locale]);

  return (
    <div className="min-h-screen w-full flex flex-col" dir={dir}>
      <TopNavbar />
      <main className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
