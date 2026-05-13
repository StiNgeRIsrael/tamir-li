import { ReactNode } from "react";
import { TopNavbar } from "@/components/TopNavbar";
import { SiteFooter } from "@/components/SiteFooter";
import { useLocale } from "@/lib/i18n";

export function AppLayout({ children }: { children: ReactNode }) {
  const { dir } = useLocale();

  return (
    <div className="relative min-h-screen w-full flex flex-col" dir={dir}>
      <div className="page-aurora" aria-hidden>
        <div className="absolute -top-32 start-[10%] h-72 w-72 rounded-full bg-tool-image/25 blur-3xl dark:bg-tool-image/20" />
        <div className="absolute top-40 end-0 h-96 w-96 rounded-full bg-tool-video/20 blur-3xl dark:bg-tool-video/15" />
        <div className="absolute bottom-20 start-1/4 h-64 w-64 rounded-full bg-tool-document/15 blur-3xl dark:bg-tool-document/12" />
        <div className="absolute top-1/2 start-1/2 h-px w-px -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
      </div>
      <TopNavbar />
      <main className="relative flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
