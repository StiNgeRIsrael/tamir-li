import { ReactNode } from "react";
import { TopNavbar } from "@/components/TopNavbar";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full">
      <TopNavbar />
      <main className="flex-1 min-h-screen">
        {children}
      </main>
    </div>
  );
}
