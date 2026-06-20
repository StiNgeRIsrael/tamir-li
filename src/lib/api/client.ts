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
