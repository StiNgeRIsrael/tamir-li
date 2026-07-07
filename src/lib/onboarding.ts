/** First-visit onboarding funnel — storage + offer window (honest 24h from first offer view). */

export const ONBOARDING_DONE_KEY = "tamir_onboarding_done";
export const ONBOARDING_OFFER_DEADLINE_KEY = "tamir_onboarding_offer_deadline";
export const ONBOARDING_SEEN_GENERATION_KEY = "tamir_onboarding_seen_gen";

/** Welcome offer window — fixed per device, does not reset on refresh. */
export const ONBOARDING_OFFER_MS = 24 * 60 * 60 * 1000;

export type QuizCategory = "images" | "documents" | "media" | "mixed";
export type QuizFrequency = "daily" | "weekly" | "occasional";
export type QuizPain = "limit" | "ads" | "size" | "speed";

export type QuizAnswers = {
  category: QuizCategory;
  frequency: QuizFrequency;
  pain: QuizPain;
};

export type OnboardingStepId =
  | "welcome"
  | "quiz_category"
  | "quiz_frequency"
  | "quiz_pain"
  | "result"
  | "auth"
  | "offer";

export const ONBOARDING_STEPS: OnboardingStepId[] = [
  "welcome",
  "quiz_category",
  "quiz_frequency",
  "quiz_pain",
  "result",
  "auth",
  "offer",
];

export function getLocalSeenGeneration(): number {
  try {
    const raw = localStorage.getItem(ONBOARDING_SEEN_GENERATION_KEY);
    const parsed = raw ? Number(raw) : 0;
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

export function resetOnboardingLocalState(): void {
  try {
    localStorage.removeItem(ONBOARDING_DONE_KEY);
    localStorage.removeItem(ONBOARDING_OFFER_DEADLINE_KEY);
  } catch {
    /* private mode */
  }
}

/** When server generation advances, clear local dismiss state so the funnel can show again. */
export function applyServerOnboardingGeneration(serverGeneration: number): boolean {
  if (serverGeneration <= getLocalSeenGeneration()) return false;
  resetOnboardingLocalState();
  return true;
}

export function isOnboardingDoneForGeneration(serverGeneration: number): boolean {
  if (serverGeneration > getLocalSeenGeneration()) return false;
  return isOnboardingDone();
}

export function isOnboardingDone(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_DONE_KEY) === "1";
  } catch {
    return false;
  }
}

export function markOnboardingDone(serverGeneration?: number): void {
  try {
    localStorage.setItem(ONBOARDING_DONE_KEY, "1");
    if (serverGeneration !== undefined) {
      localStorage.setItem(ONBOARDING_SEEN_GENERATION_KEY, String(serverGeneration));
    }
  } catch {
    /* private mode */
  }
}

/** Returns deadline timestamp (ms). Creates one on first call if missing. */
export function getOrCreateOfferDeadline(): number {
  try {
    const raw = localStorage.getItem(ONBOARDING_OFFER_DEADLINE_KEY);
    const parsed = raw ? Number(raw) : NaN;
    if (Number.isFinite(parsed) && parsed > Date.now()) {
      return parsed;
    }
    const deadline = Date.now() + ONBOARDING_OFFER_MS;
    localStorage.setItem(ONBOARDING_OFFER_DEADLINE_KEY, String(deadline));
    return deadline;
  } catch {
    return Date.now() + ONBOARDING_OFFER_MS;
  }
}

export function getOfferRemainingMs(deadline: number): number {
  return Math.max(0, deadline - Date.now());
}

export function formatCountdown(ms: number): string {
  const totalSec = Math.ceil(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export function stepIndex(step: OnboardingStepId): number {
  return ONBOARDING_STEPS.indexOf(step);
}

export function progressPercent(step: OnboardingStepId, skipAuth: boolean): number {
  const steps = skipAuth ? ONBOARDING_STEPS.filter((s) => s !== "auth") : ONBOARDING_STEPS;
  const idx = steps.indexOf(step);
  if (idx < 0) return 0;
  return Math.round(((idx + 1) / steps.length) * 100);
}
