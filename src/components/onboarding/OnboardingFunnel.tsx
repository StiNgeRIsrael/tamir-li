import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Loader2, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { OnboardingProfileCard } from "@/components/onboarding/OnboardingProfileCard";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useOnboardingOffer } from "@/hooks/useOnboardingOffer";
import { useLocale } from "@/lib/i18n";
import { enTranslations } from "@/lib/translations/en";
import { cn } from "@/lib/utils";
import { hapticLight, hapticSuccess } from "@/lib/haptics";
import { buildProfileTraits } from "@/lib/onboarding-profiles";
import { submitOnboardingResponse } from "@/lib/onboarding-submit";
import {
  markOnboardingDone,
  quizStepPosition,
  type OfferDecision,
  type OnboardingStepId,
  type QuizAnswers,
} from "@/lib/onboarding";
import { ANALYTICS_EVENTS, trackEvent } from "@/lib/analytics/events";
import {
  trackBeginCheckout,
  trackCheckoutError,
  trackUpgradeClick,
} from "@/lib/analytics/purchase-tracking";

type OnboardingCopy = (typeof enTranslations)["onboarding"];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offerGeneration: number;
};

const ANALYZING_MS = 2600;

const BACK_MAP: Partial<Record<OnboardingStepId, OnboardingStepId>> = {
  quiz_category: "hook",
  quiz_frequency: "quiz_category",
  quiz_pain: "quiz_frequency",
  quiz_attribution: "quiz_pain",
  result: "quiz_attribution",
  offer: "result",
  auth: "offer",
};

function getCopy(t: { onboarding?: OnboardingCopy }): OnboardingCopy {
  return t.onboarding ?? enTranslations.onboarding;
}

export function OnboardingFunnel({ open, onOpenChange, offerGeneration }: Props) {
  const { t } = useLocale();
  const copy = getCopy(t);
  const { user, loading: authLoading } = useAuth();
  const { checkout, checkoutLoading, isPremium, nativeBilling } = useSubscription();

  const [step, setStep] = useState<OnboardingStepId>("hook");
  const [answers, setAnswers] = useState<Partial<QuizAnswers>>({});
  const [plan, setPlan] = useState<"yearly" | "monthly">("yearly");
  const [offerDecision, setOfferDecision] = useState<OfferDecision | null>(null);
  const [analyzeIndex, setAnalyzeIndex] = useState(0);
  const submittedRef = useRef(false);

  const onOffer = step === "offer";
  const { countdown, expired, urgent } = useOnboardingOffer(onOffer && open);

  const goTo = useCallback((next: OnboardingStepId, via?: string) => {
    setStep(next);
    trackEvent(ANALYTICS_EVENTS.ONBOARDING_STEP, { step: next, ...(via ? { via } : {}) });
  }, []);

  const goBack = useCallback(() => {
    const prev = BACK_MAP[step];
    if (prev) setStep(prev);
  }, [step]);

  useEffect(() => {
    if (!open) return;
    setStep("hook");
    setAnswers({});
    setPlan("yearly");
    setOfferDecision(null);
    setAnalyzeIndex(0);
    submittedRef.current = false;
    trackEvent(ANALYTICS_EVENTS.ONBOARDING_START, {});
  }, [open]);

  // Analyzing loader: staged micro-labels then reveal profile
  useEffect(() => {
    if (step !== "analyzing") return;
    setAnalyzeIndex(0);
    const total = copy.analyzing.steps.length;
    const stepMs = ANALYZING_MS / total;
    const tick = window.setInterval(() => {
      setAnalyzeIndex((i) => Math.min(i + 1, total - 1));
    }, stepMs);
    const done = window.setTimeout(() => goTo("result", "analyzing_done"), ANALYZING_MS);
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(done);
    };
  }, [step, copy.analyzing.steps.length, goTo]);

  // Premium already active — no need to onboard
  useEffect(() => {
    if (isPremium && open) {
      markOnboardingDone(offerGeneration);
      onOpenChange(false);
    }
  }, [isPremium, open, onOpenChange, offerGeneration]);

  const finalize = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const decision: OfferDecision = offerDecision ?? "declined";

    void submitOnboardingResponse({
      category: answers.category ?? "mixed",
      frequency: answers.frequency ?? "occasional",
      pain: answers.pain ?? "limit",
      attribution: answers.attribution ?? "other",
      offerDecision: decision,
      selectedPlan: decision === "accepted" ? plan : null,
      offerGeneration,
    });

    if (decision === "accepted") {
      trackUpgradeClick(plan, "onboarding_offer");
      trackBeginCheckout({ plan, source: "onboarding_offer" });
      try {
        await checkout(plan);
        markOnboardingDone(offerGeneration);
        trackEvent(ANALYTICS_EVENTS.ONBOARDING_COMPLETE, { plan, offerGeneration });
        onOpenChange(false);
      } catch (e) {
        submittedRef.current = false;
        const msg = e instanceof Error ? e.message : copy.offer.checkoutError;
        trackCheckoutError(plan, msg);
        toast.error(msg);
      }
      return;
    }

    markOnboardingDone(offerGeneration);
    trackEvent(ANALYTICS_EVENTS.ONBOARDING_DISMISS, {
      step: "auth",
      reason: "declined",
      offerGeneration,
    });
    onOpenChange(false);
  }, [answers, offerDecision, plan, offerGeneration, checkout, copy.offer.checkoutError, onOpenChange]);

  // Auth finale — proceed once the user is signed in
  useEffect(() => {
    if (step !== "auth" || authLoading || !user) return;
    void finalize();
  }, [step, user, authLoading, finalize]);

  const resultProfile = useMemo(() => {
    const category = answers.category ?? "mixed";
    const pain = answers.pain ?? "limit";
    const frequency = answers.frequency ?? "occasional";
    const base = copy.results[category] ?? copy.results.mixed;
    const insightLines = [
      copy.frequencyBenefits[frequency],
      copy.painBenefits[pain],
    ].filter(Boolean) as string[];
    return { ...base, insightLines };
  }, [answers.category, answers.pain, answers.frequency, copy]);

  const profileTraits = useMemo(
    () =>
      buildProfileTraits(answers, {
        category: copy.profile.traits.category,
        frequency: copy.profile.traits.frequency,
        pain: copy.profile.traits.pain,
      }),
    [answers, copy.profile.traits]
  );

  const selectAnswer = <K extends keyof QuizAnswers>(
    key: K,
    value: QuizAnswers[K],
    nextStep: OnboardingStepId
  ) => {
    hapticLight();
    setAnswers((prev) => ({ ...prev, [key]: value }));
    trackEvent(ANALYTICS_EVENTS.ONBOARDING_STEP, { step, answer: key, value });
    window.setTimeout(() => goTo(nextStep), 240);
  };

  const acceptOffer = () => {
    hapticSuccess();
    setOfferDecision("accepted");
    goTo("auth", "offer_accept");
  };

  const declineOffer = () => {
    setOfferDecision("declined");
    goTo("auth", "offer_decline");
  };

  const renderQuizOptions = <K extends keyof QuizAnswers>(
    key: K,
    options: readonly { id: QuizAnswers[K]; label: string }[],
    nextStep: OnboardingStepId
  ) => (
    <div className="flex flex-col gap-3">
      {options.map((opt) => {
        const selected = answers[key] === opt.id;
        return (
          <button
            key={String(opt.id)}
            type="button"
            onClick={() => selectAnswer(key, opt.id, nextStep)}
            className={cn(
              "onboarding-glass-card flex min-h-[56px] items-center px-5 text-start text-base font-semibold text-foreground transition-transform",
              "active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              selected && "ring-2 ring-primary"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );

  const renderBody = () => {
    switch (step) {
      case "hook":
        return (
          <div className="flex flex-1 flex-col justify-center gap-6 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-accent shadow-2xl">
              <Sparkles className="h-10 w-10 text-white" aria-hidden />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                {copy.hook.title}
              </h1>
              <p className="text-base leading-relaxed text-foreground/70">{copy.hook.subtitle}</p>
            </div>
            <ul className="mx-auto max-w-xs space-y-2.5 text-start">
              {copy.hook.bullets.map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-sm font-medium text-foreground/80">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        );

      case "quiz_category":
        return (
          <QuizLayout question={copy.questions.category.question} hint={copy.questions.hint}>
            {renderQuizOptions("category", copy.questions.category.options, "quiz_frequency")}
          </QuizLayout>
        );

      case "quiz_frequency":
        return (
          <QuizLayout question={copy.questions.frequency.question} hint={copy.questions.hint}>
            {renderQuizOptions("frequency", copy.questions.frequency.options, "quiz_pain")}
          </QuizLayout>
        );

      case "quiz_pain":
        return (
          <QuizLayout question={copy.questions.pain.question} hint={copy.questions.hint}>
            {renderQuizOptions("pain", copy.questions.pain.options, "quiz_attribution")}
          </QuizLayout>
        );

      case "quiz_attribution":
        return (
          <QuizLayout question={copy.questions.attribution.question} hint={copy.questions.hint}>
            {renderQuizOptions("attribution", copy.questions.attribution.options, "analyzing")}
          </QuizLayout>
        );

      case "analyzing":
        return (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" aria-hidden />
            <h2 className="text-xl font-extrabold text-foreground">{copy.analyzing.title}</h2>
            <ul className="space-y-2" aria-live="polite">
              {copy.analyzing.steps.map((label, i) => (
                <li
                  key={label}
                  className={cn(
                    "flex items-center justify-center gap-2 text-sm font-medium transition-opacity duration-300",
                    i <= analyzeIndex ? "text-foreground opacity-100" : "text-foreground/40 opacity-60"
                  )}
                >
                  {i < analyzeIndex ? (
                    <Check className="h-4 w-4 text-primary" aria-hidden />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                  )}
                  {label}
                </li>
              ))}
            </ul>
          </div>
        );

      case "result":
        return (
          <div className="flex flex-1 flex-col justify-center">
            <OnboardingProfileCard
              category={answers.category ?? "mixed"}
              badge={copy.profile.badge}
              title={resultProfile.title}
              subtitle={copy.profile.subtitle}
              traits={profileTraits}
              insightLines={resultProfile.insightLines}
              matchLabel={copy.profile.matchLabel}
            />
          </div>
        );

      case "offer":
        return (
          <div className="space-y-4">
            <div className="onboarding-panel p-5 text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                {copy.offer.badge}
              </p>
              <h2 className="mt-1 text-2xl font-extrabold text-foreground">{copy.offer.title}</h2>
              <p className="mt-1 text-sm text-foreground/70">{copy.offer.subtitle}</p>

              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-foreground/60">
                {copy.offer.timerLabel}
              </p>
              {!expired ? (
                <div
                  className={cn(
                    "onboarding-countdown mt-1 font-mono text-4xl font-extrabold",
                    urgent && "onboarding-countdown--urgent"
                  )}
                  aria-live="polite"
                >
                  {countdown}
                </div>
              ) : (
                <p className="mt-2 text-sm font-medium text-foreground/70">{copy.offer.expiredNote}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <PlanCard
                selected={plan === "yearly"}
                onClick={() => {
                  hapticLight();
                  setPlan("yearly");
                }}
                badge={copy.offer.yearlySave}
                price={nativeBilling ? copy.offer.playYearlyLabel : copy.offer.priceYearly}
                sub={nativeBilling ? copy.offer.playBillingNote : copy.offer.perYear}
                highlight
              />
              <PlanCard
                selected={plan === "monthly"}
                onClick={() => {
                  hapticLight();
                  setPlan("monthly");
                }}
                badge={copy.offer.monthlyLabel}
                price={nativeBilling ? copy.offer.playMonthlyLabel : copy.offer.priceMonthly}
                sub={nativeBilling ? copy.offer.playBillingNote : copy.offer.perMonth}
              />
            </div>

            <ul className="onboarding-glass-card space-y-2 p-4 text-sm">
              {copy.offer.benefits.map((b) => (
                <li key={b} className="flex items-center gap-2 font-medium text-foreground">
                  <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  {b}
                </li>
              ))}
            </ul>
          </div>
        );

      case "auth":
        return (
          <div className="flex flex-1 flex-col justify-center gap-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-xl">
              {offerDecision === "accepted" ? (
                <Zap className="h-8 w-8 text-white" aria-hidden />
              ) : (
                <Check className="h-8 w-8 text-white" aria-hidden />
              )}
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-foreground">{copy.auth.title}</h2>
              <p className="text-sm text-foreground/70">
                {offerDecision === "accepted" ? copy.auth.subtitleAccepted : copy.auth.subtitle}
              </p>
            </div>
            {profileTraits.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2">
                {profileTraits.map((trait) => (
                  <span
                    key={trait.key}
                    className="onboarding-glass-card px-3 py-1 text-xs font-semibold text-foreground"
                  >
                    {trait.label}
                  </span>
                ))}
              </div>
            )}
            {user ? (
              <div className="flex items-center justify-center gap-2 text-sm text-foreground/70">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                {copy.offer.ctaLoading}
              </div>
            ) : (
              <GoogleLoginButton fullWidth />
            )}
            <p className="text-xs text-foreground/60">{copy.auth.note}</p>
          </div>
        );

      default:
        return null;
    }
  };

  const renderFooter = () => {
    switch (step) {
      case "hook":
        return (
          <Button
            size="lg"
            className="h-14 w-full rounded-2xl text-base font-bold shadow-lg"
            onClick={() => goTo("quiz_category")}
          >
            {copy.hook.cta}
          </Button>
        );
      case "result":
        return (
          <Button
            size="lg"
            className="h-14 w-full rounded-2xl text-base font-bold shadow-lg"
            onClick={() => goTo("offer")}
          >
            {copy.profile.cta}
          </Button>
        );
      case "offer":
        return (
          <div className="space-y-2">
            <Button
              size="lg"
              className="h-14 w-full rounded-2xl text-base font-bold shadow-lg"
              onClick={acceptOffer}
            >
              {nativeBilling ? copy.offer.ctaPlay : copy.offer.cta}
            </Button>
            <button
              type="button"
              onClick={declineOffer}
              className="mx-auto block cursor-pointer text-xs font-medium text-foreground/60 underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              {copy.offer.decline}
            </button>
            <p className="text-center text-xs text-foreground/60">{copy.offer.guarantee}</p>
          </div>
        );
      default:
        return null;
    }
  };

  if (!open) return null;

  const quizProgress = quizStepPosition(step);
  const showBack = !!BACK_MAP[step] && step !== "analyzing" && !checkoutLoading;
  const footer = renderFooter();

  return (
    <OnboardingShell
      stepKey={step}
      quizProgress={quizProgress}
      onBack={goBack}
      showBack={showBack}
      backLabel={copy.back}
      footer={footer ?? undefined}
    >
      {renderBody()}
    </OnboardingShell>
  );
}

function QuizLayout({
  question,
  hint,
  children,
}: {
  question: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col gap-6 pt-2">
      <div className="space-y-1.5 text-center">
        <h2 className="text-2xl font-extrabold tracking-tight text-foreground">{question}</h2>
        <p className="text-sm text-foreground/60">{hint}</p>
      </div>
      {children}
    </div>
  );
}

function PlanCard({
  selected,
  onClick,
  badge,
  price,
  sub,
  highlight,
}: {
  selected: boolean;
  onClick: () => void;
  badge: string;
  price: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "onboarding-glass-card flex flex-col items-center gap-0.5 p-4 text-center transition-transform active:scale-[0.98]",
        selected ? "ring-2 ring-primary" : "opacity-90"
      )}
    >
      <span
        className={cn(
          "text-xs font-bold",
          highlight ? "text-primary" : "text-foreground/60"
        )}
      >
        {badge}
      </span>
      <span className="text-lg font-extrabold text-foreground">{price}</span>
      <span className="text-xs text-foreground/60">{sub}</span>
    </button>
  );
}
