import { FileImage, FileText, Film, Layers, type LucideIcon } from "lucide-react";
import type { QuizAnswers, QuizCategory } from "@/lib/onboarding";

/** Visual theming for the personalized profile reveal, keyed by primary quiz category. */
export type ProfileTheme = {
  icon: LucideIcon;
  /** Tailwind gradient utility classes for the hero orb. */
  gradient: string;
  /** HSL var token used for glow / ring accents. */
  accentVar: string;
  /** Compatibility ring percentage shown on the profile card (marketing, not a real score). */
  matchPercent: number;
};

export const PROFILE_THEMES: Record<QuizCategory, ProfileTheme> = {
  images: {
    icon: FileImage,
    gradient: "from-sky-400 to-blue-600",
    accentVar: "var(--tool-image)",
    matchPercent: 92,
  },
  documents: {
    icon: FileText,
    gradient: "from-amber-400 to-orange-600",
    accentVar: "var(--tool-document)",
    matchPercent: 90,
  },
  media: {
    icon: Film,
    gradient: "from-fuchsia-500 to-purple-600",
    accentVar: "var(--tool-video)",
    matchPercent: 88,
  },
  mixed: {
    icon: Layers,
    gradient: "from-primary to-accent",
    accentVar: "var(--primary)",
    matchPercent: 95,
  },
};

export function getProfileTheme(category: QuizCategory | undefined): ProfileTheme {
  return PROFILE_THEMES[category ?? "mixed"];
}

export type ProfileTraitLabels = {
  category: Record<QuizCategory, string>;
  frequency: Record<string, string>;
  goal: Record<string, string>;
};

export type ProfileTrait = { key: string; label: string };

/** Build the 3 trait chips (category, frequency, goal) shown on the profile card. */
export function buildProfileTraits(
  answers: Partial<QuizAnswers>,
  labels: ProfileTraitLabels
): ProfileTrait[] {
  const traits: ProfileTrait[] = [];
  const category = answers.category ?? "mixed";
  traits.push({ key: "category", label: labels.category[category] });

  if (answers.frequency) {
    traits.push({ key: "frequency", label: labels.frequency[answers.frequency] });
  }
  if (answers.goal) {
    traits.push({ key: "goal", label: labels.goal[answers.goal] });
  }
  return traits;
}
