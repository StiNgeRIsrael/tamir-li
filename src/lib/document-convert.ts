/** Client-side document conversions that run in the browser. */

export function usesClientDocumentConversion(toolId: string): boolean {
  return toolId === "word-to-pdf";
}
