import type { QuizCategory } from "@/lib/onboarding";
import type { ToolCategory } from "@/lib/tools-data";

const QUIZ_TO_TOOL: Record<QuizCategory, ToolCategory | null> = {
  images: "image",
  documents: "document",
  media: "video",
  mixed: null,
};

export function quizCategoryToToolCategory(quiz: QuizCategory): ToolCategory | null {
  return QUIZ_TO_TOOL[quiz] ?? null;
}

export function parsePreferredCategory(value: string | null | undefined): ToolCategory | null {
  if (!value) return null;
  const allowed: ToolCategory[] = ["image", "video", "audio", "document", "ai"];
  return allowed.includes(value as ToolCategory) ? (value as ToolCategory) : null;
}
