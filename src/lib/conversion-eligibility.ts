import type { Tool } from "@/lib/tools-data";
import { allowMockFileConversion } from "@/lib/feature-flags";
import { usesClientDocumentConversion } from "@/lib/document-convert";
import { usesClientImageConversion } from "@/lib/image-convert";
import { isNativeApp } from "@/lib/platform";

/** Tools that run fully in the browser without the conversion API. */
export function isClientSideTool(tool: Tool): boolean {
  return !!tool.customComponent;
}

/** True when this tool cannot run in the Capacitor Android shell. */
export function isConversionBlockedOnNative(tool: Tool): boolean {
  if (!isNativeApp() || allowMockFileConversion()) return false;
  if (isClientSideTool(tool)) return false;
  if (usesClientImageConversion(tool.id, tool.fromFormats, tool.toFormats)) return false;
  if (usesClientDocumentConversion(tool.id)) return false;
  // Server-queue tools (audio/video) use the same tamir.li API as the website.
  return false;
}
