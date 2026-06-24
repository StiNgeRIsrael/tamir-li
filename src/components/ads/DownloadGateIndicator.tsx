import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";

interface DownloadGateIndicatorProps {
  /** true after step 1 (ad pause) completed */
  step1Done: boolean;
  className?: string;
}

/** Two-step download gate progress — step 1 ad pause, step 2 download. */
export function DownloadGateIndicator({ step1Done, className }: DownloadGateIndicatorProps) {
  const { t } = useLocale();
  const tt = t.tool;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground",
        className
      )}
      aria-label={tt.downloadGateProgress(step1Done ? 2 : 1)}
    >
      <div className="flex shrink-0 items-center gap-1" aria-hidden="true">
        <span
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
            step1Done ? "bg-success/15 text-success" : "bg-primary/15 text-primary"
          )}
        >
          1
        </span>
        <span className="h-px w-3 bg-border" />
        <span
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
            step1Done ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground/60"
          )}
        >
          2
        </span>
      </div>
      <span className="leading-snug">
        {step1Done ? tt.downloadGateStep2Desc : tt.downloadGateStep1Desc}
      </span>
    </div>
  );
}
