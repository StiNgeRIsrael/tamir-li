import type { Tool } from "@/lib/tools-data";
import { allowMockFileConversion } from "@/lib/feature-flags";
import { isNativeApp } from "@/lib/platform";

/** Tools that run fully in the browser without the conversion API. */
export function isClientSideTool(tool: Tool): boolean {
  return !!tool.customComponent;
}

/** Block generic server conversions in the native app until API is production-ready. */
export function isConversionBlockedOnNative(tool: Tool): boolean {
  return isNativeApp() && !isClientSideTool(tool) && !allowMockFileConversion();
}
