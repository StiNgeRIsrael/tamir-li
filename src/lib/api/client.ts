/** API base URL; empty in dev = no backend. In production, falls back to same origin (monolith). */
export function getApiBaseUrl(): string | null {
  const raw = import.meta.env.VITE_API_URL;
  if (raw && String(raw).trim()) {
    return String(raw).replace(/\/$/, "");
  }
  if (import.meta.env.PROD && typeof window !== "undefined") {
    return window.location.origin;
  }
  return null;
}

/** True when the response Content-Type indicates JSON (not SPA index.html). */
export function responseLooksLikeJson(res: Response): boolean {
  const ct = res.headers.get("content-type") ?? "";
  return ct.includes("application/json");
}

/** Probe /health — returns false when static Apache layer returns SPA HTML instead of Express. */
export async function probeApiReachable(base: string): Promise<boolean> {
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/health`, {
      method: "GET",
      credentials: "omit",
    });
    return responseLooksLikeJson(res);
  } catch {
    return false;
  }
}
