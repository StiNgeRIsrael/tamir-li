import { useLayoutEffect, useState, type RefObject } from "react";
import type { AdPlacementType } from "@/lib/ads/adsterra";

export type AdSlotScaleMode = "fill" | "native-max";

/** Ignore transient layout glitches (sticky reflow, zero-width frames) that collapse scale. */
export const MIN_CREDIBLE_AD_SLOT_WIDTH = 48;

/** Banner/inline fill container width; sidebar stays at native max width. */
export function scaleModeForPlacement(type: AdPlacementType): AdSlotScaleMode {
  return type === "sidebar" ? "native-max" : "fill";
}

export function computeAdSlotScale(
  containerWidth: number,
  nativeWidth: number,
  mode: AdSlotScaleMode,
  fallbackScale = 1
): number {
  if (nativeWidth <= 0) return fallbackScale;
  if (containerWidth < MIN_CREDIBLE_AD_SLOT_WIDTH) return fallbackScale;
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
        const next = computeAdSlotScale(w, nativeWidth, mode, prev);
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
