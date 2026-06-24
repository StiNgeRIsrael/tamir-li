import { tools, type Tool } from "@/lib/tools-data";
import { isToolFunctional } from "@/lib/tool-availability";
import type { Locale } from "@/lib/i18n";
import { htmlLangTag } from "@/lib/i18n";

/** מספרים שמחושבים מהקוד — בלי נתוני דמה. */
export function getDerivedHomeStats() {
  return getDerivedHomeStatsFromTools(tools);
}

/** כמו getDerivedHomeStats אבל רק עבור רשימת כלים (למשל אחרי סינון לפי תצוגה). */
export function getDerivedHomeStatsFromTools(toolList: Tool[]) {
  const toolCount = toolList.length;
  const functionalToolCount = toolList.filter((tool) => isToolFunctional(tool.id)).length;

  return { toolCount, functionalToolCount };
}

export type PublicStatsResponse = {
  conversionsToday: number;
  conversionsTotal: number;
  updatedAt: string;
};

/** Format aggregate counts for hero social proof — honest, no inflation. */
export function formatPublicStatCount(
  count: number | null | undefined,
  locale: Locale = "he",
): string {
  if (count == null || count <= 0) return "—";
  if (count < 1000) return count.toLocaleString(htmlLangTag(locale));

  const lang = htmlLangTag(locale);
  if (count < 10_000) {
    const rounded = Math.floor(count / 100) * 100;
    return `${rounded.toLocaleString(lang)}+`;
  }
  const rounded = Math.floor(count / 1000) * 1000;
  return `${rounded.toLocaleString(lang)}+`;
}
