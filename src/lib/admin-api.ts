import { getApiBaseUrl } from "@/lib/api/client";

export async function adminFetch<T>(
  path: string,
  token: string | null,
  init?: RequestInit
): Promise<T> {
  const base = getApiBaseUrl();
  if (!base || !token) {
    throw new Error("NO_ADMIN_API");
  }
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers as Record<string, string>),
    },
  });
  const body = (await res.json().catch(() => ({}))) as T & { message?: string; error?: string };
  if (!res.ok) {
    const msg = (body as { message?: string }).message || res.statusText;
    throw new Error(msg);
  }
  return body as T;
}
