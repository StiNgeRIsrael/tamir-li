/** סימולציית המרה בדפדפן — רק בפיתוח (ברירת מחדל), או בפרודקשן אם מפורשים VITE_USE_MOCK_CONVERSION=true */
export function allowMockFileConversion(): boolean {
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_USE_MOCK_CONVERSION === "true";
  }
  return import.meta.env.VITE_USE_MOCK_CONVERSION !== "false";
}
