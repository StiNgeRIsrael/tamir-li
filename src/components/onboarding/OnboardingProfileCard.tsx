import { Sparkles } from "lucide-react";
import { getProfileTheme, type ProfileTrait } from "@/lib/onboarding-profiles";
import type { QuizCategory } from "@/lib/onboarding";
import { cn } from "@/lib/utils";

type OnboardingProfileCardProps = {
  category: QuizCategory;
  badge: string;
  title: string;
  subtitle: string;
  traits: ProfileTrait[];
  insightLines: string[];
  matchLabel: string;
};

/** The "wow" reveal — a personalized profile with a hero orb, trait chips and a match ring. */
export function OnboardingProfileCard({
  category,
  badge,
  title,
  subtitle,
  traits,
  insightLines,
  matchLabel,
}: OnboardingProfileCardProps) {
  const theme = getProfileTheme(category);
  const HeroIcon = theme.icon;

  return (
    <div className="onboarding-reveal flex flex-col items-center gap-5 text-center">
      <div className="relative">
        <div
          className={cn(
            "flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br shadow-2xl",
            theme.gradient
          )}
          style={{ boxShadow: `0 0 48px -8px ${theme.accentVar}` }}
        >
          <HeroIcon className="h-12 w-12 text-white drop-shadow" aria-hidden />
        </div>
        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground shadow-lg">
          {theme.matchPercent}% {matchLabel}
        </span>
      </div>

      <div className="space-y-1.5 pt-2">
        <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          {badge}
        </p>
        <h2 className="text-2xl font-extrabold tracking-tight text-foreground">{title}</h2>
        <p className="text-sm leading-relaxed text-foreground/70">{subtitle}</p>
      </div>

      {traits.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {traits.map((trait) => (
            <span
              key={trait.key}
              className="onboarding-glass-card px-3 py-1.5 text-sm font-semibold text-foreground"
            >
              {trait.label}
            </span>
          ))}
        </div>
      )}

      {insightLines.length > 0 && (
        <div className="onboarding-panel w-full space-y-2 p-4 text-start">
          {insightLines.map((line) => (
            <p key={line} className="flex items-start gap-2 text-sm font-medium text-foreground">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              <span>{line}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
