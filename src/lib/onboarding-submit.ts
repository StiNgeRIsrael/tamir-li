import { getApiBaseUrl } from "@/lib/api/client";
import type {
  OfferDecision,
  QuizAttribution,
  QuizCategory,
  QuizFrequency,
  QuizPain,
} from "@/lib/onboarding";

export type OnboardingSubmitPayload = {
  category: QuizCategory;
  frequency: QuizFrequency;
  pain: QuizPain;
  attribution: QuizAttribution;
  offerDecision: OfferDecision;
  selectedPlan: "yearly" | "monthly" | null;
  offerGeneration: number;
};

function getAuthHeaders(): HeadersInit {
  try {
    const token = localStorage.getItem("tamir_auth_token");
    if (token) return { Authorization: `Bearer ${token}` };
  } catch {
    /* private mode */
  }
  return {};
}

/** Best-effort submit of quiz answers + attribution for admin analytics. Never throws. */
export async function submitOnboardingResponse(payload: OnboardingSubmitPayload): Promise<void> {
  const api = getApiBaseUrl();
  if (!api) return;
  try {
    await fetch(`${api}/api/app/onboarding/submit`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    /* analytics submit is best-effort */
  }
}
