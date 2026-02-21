import { ReactNode } from "react";
import { TopNavbar } from "@/components/TopNavbar";
import { SiteFooter } from "@/components/SiteFooter";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full flex flex-col">
      <TopNavbar />
      <main className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
