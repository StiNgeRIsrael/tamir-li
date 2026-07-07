import { type ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type OnboardingShellProps = {
  children: ReactNode;
  /** Quiz progress dots — omit outside the quiz. */
  quizProgress?: { index: number; total: number } | null;
  onBack?: () => void;
  showBack?: boolean;
  backLabel: string;
  /** Sticky bottom area (CTA / decline) — pinned in the safe zone. */
  footer?: ReactNode;
  /** Key that changes per step to retrigger the enter animation. */
  stepKey: string;
};

/** Full-screen glassmorphism takeover for the native onboarding funnel. */
export function OnboardingShell({
  children,
  quizProgress,
  onBack,
  showBack,
  backLabel,
  footer,
  stepKey,
}: OnboardingShellProps) {
  const { dir } = useLocale();
  const BackIcon = dir === "rtl" ? ArrowRight : ArrowLeft;

  return (
    <div className="onboarding-overlay" role="dialog" aria-modal="true">
      <div className="onboarding-blob onboarding-blob--1" aria-hidden />
      <div className="onboarding-blob onboarding-blob--2" aria-hidden />

      <div className="relative z-10 flex flex-1 flex-col overflow-hidden px-5 pt-4">
        <header className="flex items-center justify-between gap-3 py-2">
          {showBack && onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex min-h-[44px] cursor-pointer items-center gap-1 text-sm font-semibold text-foreground/70 transition-colors hover:text-foreground"
            >
              <BackIcon className="h-4 w-4" aria-hidden />
              {backLabel}
            </button>
          ) : (
            <span className="min-h-[44px]" />
          )}

          {quizProgress && (
            <div
              className="flex items-center gap-1.5"
              role="progressbar"
              aria-valuenow={quizProgress.index + 1}
              aria-valuemin={1}
              aria-valuemax={quizProgress.total}
            >
              {Array.from({ length: quizProgress.total }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    i <= quizProgress.index ? "w-6 bg-primary" : "w-1.5 bg-foreground/20"
                  )}
                />
              ))}
            </div>
          )}
        </header>

        <div
          key={stepKey}
          className="onboarding-step-enter flex flex-1 flex-col overflow-y-auto py-4"
        >
          {children}
        </div>
      </div>

      {footer && (
        <div className="relative z-10 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
          {footer}
        </div>
      )}
    </div>
  );
}
