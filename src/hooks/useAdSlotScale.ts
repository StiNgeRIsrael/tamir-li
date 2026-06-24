import { useLayoutEffect, useState, type RefObject } from "react";
import type { AdPlacementType } from "@/lib/ads/adsterra";

export type AdSlotScaleMode = "fill" | "native-max";

/** Banner/inline fill container width; sidebar stays at native max width. */
export function scaleModeForPlacement(type: AdPlacementType): AdSlotScaleMode {
  return type === "sidebar" ? "native-max" : "fill";
}

export function computeAdSlotScale(
  containerWidth: number,
  nativeWidth: number,
  mode: AdSlotScaleMode
): number {
  if (containerWidth <= 0 || nativeWidth <= 0) return 1;
  const ratio = containerWidth / nativeWidth;
  return mode === "native-max" ? Math.min(1, ratio) : ratio;
}

/** Scale Adsterra iframe from native unit size to match the slot container width. */
export function useAdSlotScale(
  containerRef: RefObject<HTMLElement | null>,
  nativeWidth: number,
  mode: AdSlotScaleMode
): number {
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el || nativeWidth <= 0) return;

    const update = () => {
      const w = el.getBoundingClientRect().width;
      setScale((prev) => {
        const next = computeAdSlotScale(w, nativeWidth, mode);
        return Math.abs(prev - next) < 0.001 ? prev : next;
      });
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [containerRef, nativeWidth, mode]);

  return scale;
}
