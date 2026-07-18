import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Loader2, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { OnboardingProfileCard } from "@/components/onboarding/OnboardingProfileCard";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useEnsureGoogleSignIn } from "@/hooks/useEnsureGoogleSignIn";
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
import { quizCategoryToToolCategory } from "@/lib/profile-category";
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
  quiz_goal: "quiz_frequency",
  quiz_attribution: "quiz_goal",
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
  const { user, loading: authLoading, updateProfile } = useAuth();
  const { checkout, checkoutLoading, isPremium, nativeBilling } = useSubscription();
  const { ensureSignedIn, canNativeSignIn, nativePluginReady } = useEnsureGoogleSignIn();

  const [step, setStep] = useState<OnboardingStepId>("hook");
  const [answers, setAnswers] = useState<Partial<QuizAnswers>>({});
  const [plan, setPlan] = useState<"yearly" | "monthly">("yearly");
  const [offerDecision, setOfferDecision] = useState<OfferDecision | null>(null);
  const [analyzeIndex, setAnalyzeIndex] = useState(0);
  const [purchaseBusy, setPurchaseBusy] = useState(false);
  const submittedRef = useRef(false);

  const onOffer = step === "offer";
  const { countdown, expired, urgent } = useOnboardingOffer(onOffer && open);
  const busy = checkoutLoading || purchaseBusy;

  const goTo = useCallback((next: OnboardingStepId, via?: string) => {
    setStep(next);
    trackEvent(ANALYTICS_EVENTS.ONBOARDING_STEP, { step: next, ...(via ? { via } : {}) });
  }, []);

  const goBack = useCallback(() => {
    if (busy) return;
    const prev = BACK_MAP[step];
    if (prev) setStep(prev);
  }, [step, busy]);

  useEffect(() => {
    if (!open) return;
    setStep("hook");
    setAnswers({});
    setPlan("yearly");
    setOfferDecision(null);
    setAnalyzeIndex(0);
    setPurchaseBusy(false);
    submittedRef.current = false;
    trackEvent(ANALYTICS_EVENTS.ONBOARDING_START, {});
  }, [open]);

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

  useEffect(() => {
    if (isPremium && open) {
      markOnboardingDone(offerGeneration);
      onOpenChange(false);
    }
  }, [isPremium, open, onOpenChange, offerGeneration]);

  const syncProfile = useCallback(async () => {
    const preferredCategory = quizCategoryToToolCategory(answers.category ?? "mixed");
    const patch: Parameters<typeof updateProfile>[0] = {
      onboardingCompletedAt: true,
    };
    if (preferredCategory) patch.preferredCategory = preferredCategory;
    if (user) {
      try {
        await updateProfile(patch);
      } catch {
        /* best-effort */
      }
    }
  }, [answers.category, updateProfile, user]);

  const persistAnalytics = useCallback(
    (decision: OfferDecision) => {
      void submitOnboardingResponse({
        category: answers.category ?? "mixed",
        frequency: answers.frequency ?? "occasional",
        goal: answers.goal ?? "convert",
        attribution: answers.attribution ?? "other",
        offerDecision: decision,
        selectedPlan: decision === "accepted" ? plan : null,
        offerGeneration,
      });
    },
    [answers, plan, offerGeneration]
  );

  /** High-converting path: Google account sheet → Play purchase sheet. */
  const purchasePremium = useCallback(async () => {
    if (purchaseBusy || checkoutLoading) return;
    setPurchaseBusy(true);
    setOfferDecision("accepted");
    hapticSuccess();

    trackUpgradeClick(plan, "onboarding_offer");
    trackBeginCheckout({ plan, source: "onboarding_offer" });
    persistAnalytics("accepted");

    try {
      if (!user) {
        if (nativeBilling && canNativeSignIn) {
          try {
            await ensureSignedIn();
          } catch (signInErr) {
            const code = signInErr instanceof Error ? signInErr.message : "";
            const cancelled = /cancel|NATIVE_GOOGLE_CANCELLED/i.test(code);
            if (cancelled) {
              setPurchaseBusy(false);
              return;
            }
            // Show auth step with Google button (never GIS). Update-app hint if plugin missing.
            setPurchaseBusy(false);
            goTo("auth", "offer_accept_need_login");
            return;
          }
        } else {
          setPurchaseBusy(false);
          goTo("auth", "offer_accept_need_login");
          return;
        }
      }

      await checkout(plan);
      await syncProfile();
      markOnboardingDone(offerGeneration);
      trackEvent(ANALYTICS_EVENTS.ONBOARDING_COMPLETE, { plan, offerGeneration });
      onOpenChange(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : copy.offer.checkoutError;
      const cancelled =
        /cancel|dismiss|USER_CANCELED|BillingResponse|NATIVE_GOOGLE_CANCELLED/i.test(msg) ||
        msg === "SIGN_IN_REQUIRED";
      if (!cancelled) {
        trackCheckoutError(plan, msg);
        const authCopy = copy.auth as { signInRequired?: string; signInUpdateApp?: string };
        toast.error(
          msg === "SIGN_IN_REQUIRED" || msg === "NATIVE_GOOGLE_UPDATE_REQUIRED"
            ? (msg === "NATIVE_GOOGLE_UPDATE_REQUIRED"
                ? authCopy.signInUpdateApp
                : authCopy.signInRequired) ?? copy.offer.checkoutError
            : msg
        );
      }
    } finally {
      setPurchaseBusy(false);
    }
  }, [
    purchaseBusy,
    checkoutLoading,
    plan,
    persistAnalytics,
    user,
    nativeBilling,
    canNativeSignIn,
    ensureSignedIn,
    checkout,
    syncProfile,
    offerGeneration,
    onOpenChange,
    goTo,
    copy.offer.checkoutError,
    copy.auth,
  ]);

  const declineOffer = useCallback(() => {
    persistAnalytics("declined");
    void syncProfile();
    markOnboardingDone(offerGeneration);
    trackEvent(ANALYTICS_EVENTS.ONBOARDING_DISMISS, {
      step: "offer",
      reason: "declined",
      offerGeneration,
    });
    onOpenChange(false);
  }, [persistAnalytics, syncProfile, offerGeneration, onOpenChange]);

  const skipAuth = () => {
    persistAnalytics(offerDecision ?? "declined");
    void syncProfile().finally(() => {
      markOnboardingDone(offerGeneration);
      trackEvent(ANALYTICS_EVENTS.ONBOARDING_DISMISS, {
        step: "auth",
        reason: "skipped_auth",
        offerGeneration,
      });
      onOpenChange(false);
    });
  };

  // Auth fallback: after login, open Play / checkout immediately.
  useEffect(() => {
    if (step !== "auth" || authLoading || !user || offerDecision !== "accepted") return;
    if (submittedRef.current) return;
    submittedRef.current = true;
    void (async () => {
      setPurchaseBusy(true);
      try {
        await checkout(plan);
        await syncProfile();
        markOnboardingDone(offerGeneration);
        trackEvent(ANALYTICS_EVENTS.ONBOARDING_COMPLETE, { plan, offerGeneration });
        onOpenChange(false);
      } catch (e) {
        submittedRef.current = false;
        const msg = e instanceof Error ? e.message : copy.offer.checkoutError;
        trackCheckoutError(plan, msg);
        toast.error(msg);
      } finally {
        setPurchaseBusy(false);
      }
    })();
  }, [
    step,
    user,
    authLoading,
    offerDecision,
    checkout,
    plan,
    syncProfile,
    offerGeneration,
    onOpenChange,
    copy.offer.checkoutError,
  ]);

  const resultProfile = useMemo(() => {
    const category = answers.category ?? "mixed";
    const goal = answers.goal ?? "convert";
    const frequency = answers.frequency ?? "occasional";
    const base = copy.results[category] ?? copy.results.mixed;
    const insightLines = [
      copy.frequencyBenefits[frequency],
      copy.goalBenefits[goal],
    ].filter(Boolean) as string[];
    return { ...base, insightLines };
  }, [answers.category, answers.goal, answers.frequency, copy]);

  const profileTraits = useMemo(
    () =>
      buildProfileTraits(answers, {
        category: copy.profile.traits.category,
        frequency: copy.profile.traits.frequency,
        goal: copy.profile.traits.goal,
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
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  {b}
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
            {renderQuizOptions("frequency", copy.questions.frequency.options, "quiz_goal")}
          </QuizLayout>
        );

      case "quiz_goal":
        return (
          <QuizLayout question={copy.questions.goal.question} hint={copy.questions.hint}>
            {renderQuizOptions("goal", copy.questions.goal.options, "quiz_attribution")}
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
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">{copy.analyzing.title}</h2>
              <p className="text-sm text-foreground/70">
                {copy.analyzing.steps[analyzeIndex] ?? copy.analyzing.steps[0]}
              </p>
            </div>
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
          <div className="space-y-3">
            <div className="onboarding-panel px-4 py-3.5 text-center">
              <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
                {copy.offer.badge}
              </p>
              <h2 className="mt-0.5 text-xl font-extrabold text-foreground">{copy.offer.title}</h2>
              <p className="mt-0.5 text-xs text-foreground/70">{copy.offer.subtitle}</p>

              <p className="mt-2.5 text-[11px] font-semibold uppercase tracking-wide text-foreground/60">
                {copy.offer.timerLabel}
              </p>
              {!expired ? (
                <div
                  className={cn(
                    "onboarding-countdown mt-0.5 font-mono text-3xl font-extrabold",
                    urgent && "onboarding-countdown--urgent"
                  )}
                  aria-live="polite"
                >
                  {countdown}
                </div>
              ) : (
                <p className="mt-1.5 text-sm font-medium text-foreground/70">{copy.offer.expiredNote}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <PlanCard
                selected={plan === "yearly"}
                onClick={() => {
                  hapticLight();
                  setPlan("yearly");
                }}
                planLabel={copy.offer.yearlyLabel}
                saveBadge={copy.offer.yearlySave}
                bestValueBadge={copy.offer.bestValue}
                price={copy.offer.priceYearly}
                anchor={copy.offer.anchorYearly}
                period={copy.offer.perYear}
                equiv={copy.offer.perMonthEquiv}
                highlight
              />
              <PlanCard
                selected={plan === "monthly"}
                onClick={() => {
                  hapticLight();
                  setPlan("monthly");
                }}
                planLabel={copy.offer.monthlyLabel}
                price={copy.offer.priceMonthly}
                anchor={copy.offer.anchorMonthly}
                period={copy.offer.perMonth}
              />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {copy.offer.trustBadges.map((label) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-800 dark:text-emerald-300"
                >
                  <ShieldCheck className="h-3 w-3 shrink-0" aria-hidden />
                  {label}
                </span>
              ))}
            </div>

            <ul className="onboarding-glass-card space-y-1.5 px-3 py-2.5 text-[13px]">
              {copy.offer.benefits.map((b) => (
                <li key={b} className="flex items-center gap-2 font-medium text-foreground">
                  <Check className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                  {b}
                </li>
              ))}
            </ul>
          </div>
        );

      case "auth":
        return (
          <div className="flex flex-1 flex-col justify-center gap-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-xl">
              <Zap className="h-7 w-7 text-white" aria-hidden />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-extrabold text-foreground">{copy.auth.titlePurchase}</h2>
              <p className="text-sm text-foreground/70">
                {nativeBilling && !nativePluginReady
                  ? ((copy.auth as { signInUpdateApp?: string }).signInUpdateApp ??
                    copy.auth.subtitlePurchase)
                  : copy.auth.subtitlePurchase}
              </p>
            </div>
            {user || busy ? (
              <div className="flex items-center justify-center gap-2 text-sm text-foreground/70">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                {copy.offer.ctaLoading}
              </div>
            ) : (
              <GoogleLoginButton fullWidth />
            )}
            <button
              type="button"
              onClick={skipAuth}
              className="mx-auto block cursor-pointer text-xs font-medium text-foreground/60 underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              {copy.auth.skip}
            </button>
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
              onClick={() => void purchasePremium()}
              disabled={busy}
            >
              {busy ? (
                <>
                  <Loader2 className="me-2 h-5 w-5 animate-spin" aria-hidden />
                  {copy.offer.ctaLoading}
                </>
              ) : nativeBilling ? (
                copy.offer.ctaPlay
              ) : (
                copy.offer.cta
              )}
            </Button>
            <button
              type="button"
              onClick={declineOffer}
              disabled={busy}
              className="mx-auto block cursor-pointer text-xs font-medium text-foreground/60 underline-offset-4 transition-colors hover:text-foreground hover:underline disabled:opacity-50"
            >
              {copy.offer.decline}
            </button>
            <p className="flex items-center justify-center gap-1.5 text-center text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {copy.offer.guarantee}
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  if (!open) return null;

  const quizProgress = quizStepPosition(step);
  const showBack = !!BACK_MAP[step] && step !== "analyzing" && !busy;
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
  planLabel,
  saveBadge,
  bestValueBadge,
  price,
  anchor,
  period,
  equiv,
  highlight,
}: {
  selected: boolean;
  onClick: () => void;
  planLabel: string;
  saveBadge?: string;
  bestValueBadge?: string;
  price: string;
  anchor: string;
  period: string;
  equiv?: string;
  highlight?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center gap-0.5 rounded-2xl border px-2.5 pb-3 pt-4 text-center transition-all active:scale-[0.98]",
        highlight
          ? "border-primary/40 bg-gradient-to-b from-primary/15 via-card to-card shadow-md"
          : "onboarding-glass-card",
        selected
          ? "onboarding-plan-card--selected ring-2 ring-primary shadow-lg scale-[1.02]"
          : "opacity-95 hover:opacity-100"
      )}
    >
      {(bestValueBadge || saveBadge) && (
        <span className="absolute -top-2.5 inline-flex max-w-[95%] items-center gap-1 truncate rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground shadow-sm">
          {bestValueBadge ?? saveBadge}
        </span>
      )}
      <span
        className={cn(
          "text-[11px] font-bold uppercase tracking-wide",
          highlight ? "text-primary" : "text-foreground/55"
        )}
      >
        {planLabel}
      </span>
      <span className="text-[11px] font-medium text-foreground/45 line-through decoration-foreground/35">
        {anchor}
      </span>
      <span
        className={cn(
          "text-[1.35rem] font-black leading-none tracking-tight text-foreground",
          highlight && "text-primary"
        )}
        dir="ltr"
      >
        {price}
      </span>
      <span className="text-[10px] font-medium text-foreground/60">{period}</span>
      {equiv && (
        <span className="mt-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
          {equiv}
        </span>
      )}
      {highlight && saveBadge && bestValueBadge && (
        <span className="mt-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
          {saveBadge}
        </span>
      )}
      {selected && (
        <span className="mt-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
        </span>
      )}
    </button>
  );
}
