import { describe, it, expect, beforeEach } from "vitest";
import {
  ONBOARDING_DONE_KEY,
  ONBOARDING_OFFER_DEADLINE_KEY,
  ONBOARDING_SEEN_GENERATION_KEY,
  applyServerOnboardingGeneration,
  isOnboardingDoneForGeneration,
  markOnboardingDone,
} from "@/lib/onboarding";

describe("onboarding generation sync", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("clears local dismiss when server generation advances", () => {
    markOnboardingDone(1);
    localStorage.setItem(ONBOARDING_OFFER_DEADLINE_KEY, "999");

    expect(isOnboardingDoneForGeneration(1)).toBe(true);

    const reset = applyServerOnboardingGeneration(2);
    expect(reset).toBe(true);
    expect(localStorage.getItem(ONBOARDING_DONE_KEY)).toBeNull();
    expect(localStorage.getItem(ONBOARDING_OFFER_DEADLINE_KEY)).toBeNull();
    expect(isOnboardingDoneForGeneration(2)).toBe(false);
  });

  it("marks done for current generation after dismiss", () => {
    applyServerOnboardingGeneration(3);
    markOnboardingDone(3);
    expect(localStorage.getItem(ONBOARDING_SEEN_GENERATION_KEY)).toBe("3");
    expect(isOnboardingDoneForGeneration(3)).toBe(true);
    expect(isOnboardingDoneForGeneration(4)).toBe(false);
  });
});
