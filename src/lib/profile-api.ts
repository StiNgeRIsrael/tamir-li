import { getApiBaseUrl, responseLooksLikeJson } from "@/lib/api/client";
import type { AuthUser } from "@/contexts/AuthContext";

export type ProfilePatch = {
  displayName?: string | null;
  locale?: string;
  preferredCategory?: string | null;
  /** ISO timestamp, `true` for now, or null to clear. */
  onboardingCompletedAt?: string | true | null;
};

export async function patchAuthProfile(
  token: string,
  patch: ProfilePatch
): Promise<AuthUser> {
  const apiBase = getApiBaseUrl();
  if (!apiBase) throw new Error("NO_API");

  const res = await fetch(`${apiBase}/api/auth/profile`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(patch),
  });

  if (!responseLooksLikeJson(res)) throw new Error("API_UNAVAILABLE");
  const body = (await res.json().catch(() => ({}))) as {
    user?: AuthUser;
    error?: string;
    message?: string;
  };
  if (!res.ok || !body.user) {
    throw new Error(body.error || body.message || "PROFILE_UPDATE_FAILED");
  }
  return body.user;
}
