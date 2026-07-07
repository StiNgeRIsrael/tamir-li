import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useOnboardingOffer } from "./useOnboardingOffer";

vi.mock("@/lib/onboarding", () => ({
  getOrCreateOfferDeadline: vi.fn(() => 1_000_000),
  getOfferRemainingMs: vi.fn((deadline: number) => Math.max(0, deadline - Date.now())),
  formatCountdown: vi.fn((ms: number) => {
    const totalSec = Math.ceil(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
  }),
}));

describe("useOnboardingOffer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(500_000);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("initializes deadline when active becomes true after mount", async () => {
    const { result, rerender } = renderHook(({ active }) => useOnboardingOffer(active), {
      initialProps: { active: false },
    });

    expect(result.current.expired).toBe(false);
    expect(result.current.deadline).toBe(0);

    rerender({ active: true });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.deadline).toBe(1_000_000);
    expect(result.current.expired).toBe(false);
    expect(result.current.countdown).not.toBe("00:00:00");
  });
});
