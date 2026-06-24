import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

export function ToolSoonBadge({ className }: { className?: string }) {
  const t = useT();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-amber-600/35 bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-900 shadow-sm dark:border-amber-400/40 dark:bg-amber-400/20 dark:text-amber-100",
        className
      )}
    >
      {t.soon}
    </span>
  );
}
