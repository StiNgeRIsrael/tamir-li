interface AdSlotProps {
  type: "banner" | "sidebar" | "inline";
  className?: string;
}

export function AdSlot({ type, className = "" }: AdSlotProps) {
  const sizes: Record<string, string> = {
    banner: "w-full min-h-[90px]",
    sidebar: "w-full min-h-[250px]",
    inline: "w-full min-h-[120px]",
  };

  return (
    <div className={`ad-slot ${sizes[type]} ${className}`}>
      <span className="text-xs">מודעה • Google Ads</span>
    </div>
  );
}

// Call this function at strategic moments (after conversion, page transitions)
export function triggerInterstitial() {
  // In production, replace with: googletag.cmd.push(() => { ... });
  console.log("Trigger Google Ads Vignette/Interstitial");
}
