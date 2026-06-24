import { useEffect, useState } from "react";

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

type Segment = { target: number; durationMs: number };

function buildSegments(totalMs: number): Segment[] {
  const count = 8 + Math.floor(Math.random() * 6);
  const weights = Array.from({ length: count }, () => 0.3 + Math.random() * 0.7);
  const weightSum = weights.reduce((a, b) => a + b, 0);

  let cumulative = 0;
  const segments: Segment[] = [];
  for (let i = 0; i < count; i++) {
    cumulative += (weights[i] / weightSum) * 100;
    segments.push({
      target: Math.min(100, cumulative),
      durationMs: (weights[i] / weightSum) * totalMs * (0.65 + Math.random() * 0.7),
    });
  }
  segments[segments.length - 1].target = 100;

  const durSum = segments.reduce((s, seg) => s + seg.durationMs, 0);
  segments.forEach((seg) => {
    seg.durationMs = (seg.durationMs / durSum) * totalMs;
  });

  return segments;
}

/** Animate 0→100 over ~durationMs with organic variable speed. */
export function useOrganicProgress(durationMs: number, enabled = true) {
  const [progress, setProgress] = useState(0);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setProgress(100);
      setComplete(true);
      return;
    }

    setProgress(0);
    setComplete(false);

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      const timer = window.setTimeout(() => {
        setProgress(100);
        setComplete(true);
      }, Math.min(durationMs, 800));
      return () => window.clearTimeout(timer);
    }

    const segments = buildSegments(durationMs);
    let segIdx = 0;
    let fromProgress = 0;
    let rafId = 0;
    let segStart = 0;
    const timeouts: number[] = [];

    const finish = () => {
      setProgress(100);
      setComplete(true);
    };

    const runSegment = () => {
      if (segIdx >= segments.length) {
        finish();
        return;
      }
      const seg = segments[segIdx];
      segStart = performance.now();

      const animate = (now: number) => {
        const t = Math.min(1, (now - segStart) / seg.durationMs);
        const eased = easeInOutCubic(t);
        const value = fromProgress + (seg.target - fromProgress) * eased;
        setProgress(Math.round(value * 10) / 10);

        if (t < 1) {
          rafId = requestAnimationFrame(animate);
        } else {
          fromProgress = seg.target;
          segIdx++;
          const pause = 30 + Math.random() * 120;
          timeouts.push(
            window.setTimeout(() => {
              if (segIdx >= segments.length) finish();
              else runSegment();
            }, pause)
          );
        }
      };
      rafId = requestAnimationFrame(animate);
    };

    runSegment();

    return () => {
      cancelAnimationFrame(rafId);
      timeouts.forEach(clearTimeout);
    };
  }, [durationMs, enabled]);

  return { progress, complete };
}
