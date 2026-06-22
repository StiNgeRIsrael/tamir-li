import { tools, type Tool, type ToolCategory } from "@/lib/tools-data";
import { isToolFunctional } from "@/lib/tool-availability";

const ALL_CATEGORIES: ToolCategory[] = ["image", "video", "audio", "document", "ai"];

/** מספרים שמחושבים מהקוד — בלי נתוני דמה. */
export function getDerivedHomeStats() {
  return getDerivedHomeStatsFromTools(tools);
}

/** כמו getDerivedHomeStats אבל רק עבור רשימת כלים (למשל אחרי סינון לפי תצוגה). */
export function getDerivedHomeStatsFromTools(toolList: Tool[]) {
  const toolCount = toolList.length;
  const functionalToolCount = toolList.filter((tool) => isToolFunctional(tool.id)).length;
  const formatSet = new Set<string>();
  for (const tool of toolList) {
    tool.fromFormats.forEach((f) => formatSet.add(f.toUpperCase()));
    tool.toFormats.forEach((f) => formatSet.add(f.toUpperCase()));
  }
  const formatCount = formatSet.size;
  const categoryCount = ALL_CATEGORIES.filter((c) => toolList.some((t) => t.category === c)).length;

  return { toolCount, functionalToolCount, formatCount, categoryCount };
}
