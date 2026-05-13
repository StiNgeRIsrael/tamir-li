/** בסיס ה-API לפרודקשן; ריק = אין שרת (ההמרה לא תרוץ מקומית). */
export function getApiBaseUrl(): string | null {
  const raw = import.meta.env.VITE_API_URL;
  if (!raw || !String(raw).trim()) return null;
  return String(raw).replace(/\/$/, "");
}
