import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

export function ToolSoonBadge({ className }: { className?: string }) {
  const t = useT();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border border-muted-foreground/30 bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground",
        className
      )}
    >
      {t.soon}
    </span>
  );
}
