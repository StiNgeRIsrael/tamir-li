import { AdSlot } from "@/components/AdSlot";
import { useSubscription } from "@/hooks/useSubscription";
import { cn } from "@/lib/utils";

interface DesktopAdRailProps {
  side: "start" | "end";
  slotId?: string;
  className?: string;
}

export function DesktopAdRail({ side, slotId, className }: DesktopAdRailProps) {
  const { isPremium } = useSubscription();

  if (isPremium) return null;

  const id = slotId ?? (side === "start" ? "desktop-rail-start" : "desktop-rail-end");

  return (
    <aside
      className={cn(
        "hidden xl:block w-[300px] shrink-0 px-3",
        className
      )}
      aria-label={side === "start" ? "Sidebar advertisement" : "Sidebar advertisement"}
    >
      <div className="sticky top-[3.75rem] space-y-4 py-4">
        <AdSlot type="sidebar" slotId={id} eager />
        <AdSlot type="sidebar" slotId={`${id}-2`} eager />
      </div>
    </aside>
  );
}
