import { describe, it, expect, beforeEach } from "vitest";
import {
  clearPostConvertAdSession,
  isPostConvertAdSatisfied,
  markPostConvertAdSatisfied,
} from "@/lib/ads/post-convert-ad-session";

describe("post-convert ad session", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("marks and reads satisfaction for download gate skip", () => {
    expect(isPostConvertAdSatisfied()).toBe(false);
    markPostConvertAdSatisfied();
    expect(isPostConvertAdSatisfied()).toBe(true);
    clearPostConvertAdSession();
    expect(isPostConvertAdSatisfied()).toBe(false);
  });
});
