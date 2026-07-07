import { describe, it, expect, beforeEach } from "vitest";
import {
  ONBOARDING_DONE_KEY,
  ONBOARDING_OFFER_DEADLINE_KEY,
  ONBOARDING_SEEN_GENERATION_KEY,
  ONBOARDING_STEPS,
  applyServerOnboardingGeneration,
  canDismissAtStep,
  isOnboardingDoneForGeneration,
  markOnboardingDone,
  quizStepPosition,
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

describe("onboarding step model", () => {
  it("keeps offer before auth and after the quiz", () => {
    const offer = ONBOARDING_STEPS.indexOf("offer");
    const auth = ONBOARDING_STEPS.indexOf("auth");
    const analyzing = ONBOARDING_STEPS.indexOf("analyzing");
    expect(analyzing).toBeLessThan(offer);
    expect(offer).toBeLessThan(auth);
  });

  it("only allows dismiss from the offer step onward", () => {
    expect(canDismissAtStep("hook")).toBe(false);
    expect(canDismissAtStep("quiz_category")).toBe(false);
    expect(canDismissAtStep("quiz_attribution")).toBe(false);
    expect(canDismissAtStep("analyzing")).toBe(false);
    expect(canDismissAtStep("result")).toBe(false);
    expect(canDismissAtStep("offer")).toBe(true);
    expect(canDismissAtStep("auth")).toBe(true);
  });

  it("reports quiz dot position only inside the quiz", () => {
    expect(quizStepPosition("hook")).toBeNull();
    expect(quizStepPosition("analyzing")).toBeNull();
    expect(quizStepPosition("quiz_category")).toEqual({ index: 0, total: 4 });
    expect(quizStepPosition("quiz_attribution")).toEqual({ index: 3, total: 4 });
  });
});
