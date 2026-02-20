import { ReactNode } from "react";
import { ToolsSidebar } from "@/components/ToolsSidebar";
import { MobileHeader } from "@/components/MobileHeader";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full">
      <MobileHeader />
      <div className="flex">
        <ToolsSidebar />
        <main className="flex-1 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}
