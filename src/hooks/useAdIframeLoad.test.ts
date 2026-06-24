import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAdIframeLoad } from "@/hooks/useAdIframeLoad";

describe("useAdIframeLoad", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("marks loaded on postMessage and never regresses", () => {
    const { result } = renderHook(() => useAdIframeLoad(true, "home-banner", "home-banner:abc"));

    act(() => {
      window.dispatchEvent(
        new MessageEvent("message", {
          data: { tamirAdSlot: "home-banner", status: "loaded" },
        })
      );
    });

    expect(result.current.adStatus).toBe("loaded");
    expect(result.current.showFailedOverlay).toBe(false);

    act(() => {
      window.dispatchEvent(
        new MessageEvent("message", {
          data: { tamirAdSlot: "home-banner", status: "timeout" },
        })
      );
    });

    expect(result.current.adStatus).toBe("loaded");
  });

  it("retries once on timeout before failing", () => {
    const { result } = renderHook(() => useAdIframeLoad(true, "tool-mid", "tool-mid:xyz"));

    act(() => {
      window.dispatchEvent(
        new MessageEvent("message", {
          data: { tamirAdSlot: "tool-mid", status: "timeout" },
        })
      );
    });

    expect(result.current.adStatus).toBe("loading");
    expect(result.current.retryKey).toBe(1);

    act(() => {
      window.dispatchEvent(
        new MessageEvent("message", {
          data: { tamirAdSlot: "tool-mid", status: "timeout" },
        })
      );
    });

    expect(result.current.adStatus).toBe("failed");
    expect(result.current.showFailedOverlay).toBe(true);
  });

  it("ignores messages for other slots", () => {
    const { result } = renderHook(() => useAdIframeLoad(true, "slot-a", "slot-a:key"));

    act(() => {
      window.dispatchEvent(
        new MessageEvent("message", {
          data: { tamirAdSlot: "slot-b", status: "loaded" },
        })
      );
    });

    expect(result.current.adStatus).toBe("loading");
  });
});
