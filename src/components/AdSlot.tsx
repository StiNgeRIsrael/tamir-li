import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface AdSlotProps {
  type: "banner" | "sidebar" | "inline";
  className?: string;
  /** Map to your Google Ad Manager / AdSense ad unit name in the publisher console */
  slotId?: string;
}

const layout: Record<AdSlotProps["type"], { minH: string; maxW?: string; labelKey: string }> = {
  banner: { minH: "min-h-[90px] max-h-[120px]", maxW: "max-w-[728px]", labelKey: "leaderboard" },
  sidebar: { minH: "min-h-[250px]", maxW: "max-w-[300px]", labelKey: "sidebar" },
  inline: { minH: "min-h-[100px] sm:min-h-[120px]", maxW: "max-w-full", labelKey: "inline" },
};

export function AdSlot({ type, className = "", slotId }: AdSlotProps) {
  const { t } = useLocale();
  const L = layout[type];
  const label = t.adLabel || "Ad • Google Ads";

  return (
    <aside
      role="complementary"
      aria-label={label}
      data-ad-region={type}
      data-ad-slot-id={slotId}
      className={cn(
        "ad-slot mx-auto flex w-full flex-col items-center justify-center gap-1 rounded-xl px-2 py-3 text-center shadow-inner",
        L.minH,
        L.maxW,
        className
      )}
    >
      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <div
        className="flex min-h-[52px] w-full flex-1 items-center justify-center rounded-lg bg-gradient-to-br from-background/60 to-tool-image/5 dark:from-background/30"
        data-ad-placeholder={L.labelKey}
      >
        {/* Paste AdSense `ins.adsbygoogle` here via your ad loader, or use GPT slot IDs bound to data-ad-slot-id */}
        <span className="sr-only">{label}</span>
      </div>
    </aside>
  );
}

/** Call after conversion milestones; bind to GPT interstitial or AdSense rewarded in production. */
export function triggerInterstitial() {
  if (import.meta.env.DEV) {
    console.debug("[ads] Interstitial milestone (wire googletag / adsbygoogle in production)");
  }
}
