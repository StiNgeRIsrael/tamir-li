import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Crown,
  FileImage,
  FileText,
  Film,
  Layers,
  Sparkles,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useOnboardingOffer } from "@/hooks/useOnboardingOffer";
import { useLocale } from "@/lib/i18n";
import { enTranslations } from "@/lib/translations/en";
import { isNativeApp } from "@/lib/platform";
import { cn } from "@/lib/utils";
import {
  markOnboardingDone,
  progressPercent,
  type OnboardingStepId,
  type QuizAnswers,
  type QuizCategory,
  type QuizFrequency,
  type QuizPain,
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

const CATEGORY_ICONS: Record<QuizCategory, typeof FileImage> = {
  images: FileImage,
  documents: FileText,
  media: Film,
  mixed: Layers,
};

function getCopy(t: { onboarding?: OnboardingCopy }): OnboardingCopy {
  return t.onboarding ?? enTranslations.onboarding;
}

function nextStep(step: OnboardingStepId, skipAuth: boolean): OnboardingStepId | null {
  const order: OnboardingStepId[] = [
    "welcome",
    "quiz_category",
    "quiz_frequency",
    "quiz_pain",
    "result",
    "auth",
    "offer",
  ];
  const idx = order.indexOf(step);
  if (idx < 0 || idx >= order.length - 1) return null;
  let next = order[idx + 1];
  if (next === "auth" && skipAuth) next = "offer";
  return next;
}

function prevStep(step: OnboardingStepId, skipAuth: boolean): OnboardingStepId | null {
  const order: OnboardingStepId[] = [
    "welcome",
    "quiz_category",
    "quiz_frequency",
    "quiz_pain",
    "result",
    "auth",
    "offer",
  ];
  const idx = order.indexOf(step);
  if (idx <= 0) return null;
  let prev = order[idx - 1];
  if (prev === "auth" && skipAuth) prev = "result";
  return prev;
}

export function OnboardingFunnel({ open, onOpenChange, offerGeneration }: Props) {
  const { t, dir } = useLocale();
  const copy = getCopy(t);
  const { user, loading: authLoading } = useAuth();
  const { checkout, checkoutLoading, isPremium, nativeBilling } = useSubscription();
  const nativeApp = isNativeApp();

  const [step, setStep] = useState<OnboardingStepId>("welcome");
  const [answers, setAnswers] = useState<Partial<QuizAnswers>>({});
  const [plan, setPlan] = useState<"yearly" | "monthly">("yearly");

  const skipAuth = !!user;
  const onOffer = step === "offer";
  const { countdown, expired } = useOnboardingOffer(onOffer && open);

  const BackIcon = dir === "rtl" ? ArrowRight : ArrowLeft;

  const dismiss = useCallback(
    (reason: "skip" | "close" | "expired") => {
      markOnboardingDone(offerGeneration);
      trackEvent(ANALYTICS_EVENTS.ONBOARDING_DISMISS, { step, reason, offerGeneration });
      onOpenChange(false);
    },
    [onOpenChange, step, offerGeneration]
  );

  const goNext = useCallback(() => {
    const next = nextStep(step, skipAuth);
    if (!next) return;
    setStep(next);
    trackEvent(ANALYTICS_EVENTS.ONBOARDING_STEP, { step: next });
  }, [step, skipAuth]);

  const goBack = useCallback(() => {
    const prev = prevStep(step, skipAuth);
    if (!prev) return;
    setStep(prev);
  }, [step, skipAuth]);

  useEffect(() => {
    if (!open) return;
    setStep("welcome");
    setAnswers({});
    setPlan("yearly");
    trackEvent(ANALYTICS_EVENTS.ONBOARDING_START, {});
  }, [open]);

  useEffect(() => {
    if (step === "auth" && user && !authLoading) {
      setStep("offer");
      trackEvent(ANALYTICS_EVENTS.ONBOARDING_STEP, { step: "offer", via: "auth_complete" });
    }
  }, [step, user, authLoading]);

  useEffect(() => {
    if (isPremium && open) {
      markOnboardingDone(offerGeneration);
      onOpenChange(false);
    }
  }, [isPremium, open, onOpenChange, offerGeneration]);

  const resultProfile = useMemo(() => {
    const category = answers.category ?? "mixed";
    const pain = answers.pain ?? "limit";
    const frequency = answers.frequency ?? "occasional";
    const profiles = copy.results;
    const base = profiles[category] ?? profiles.mixed;
    const painLine = copy.painBenefits[pain] ?? "";
    const frequencyLine = copy.frequencyBenefits[frequency] ?? "";
    return { ...base, painLine, frequencyLine };
  }, [answers.category, answers.pain, answers.frequency, copy]);

  const handleCheckout = async () => {
    if (!user) {
      setStep("auth");
      return;
    }
    trackUpgradeClick(plan, "onboarding_offer");
    trackBeginCheckout({ plan, source: "onboarding_offer" });
    try {
      await checkout(plan);
      markOnboardingDone(offerGeneration);
      trackEvent(ANALYTICS_EVENTS.ONBOARDING_COMPLETE, { plan, offerGeneration });
      onOpenChange(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : copy.offer.checkoutError;
      trackCheckoutError(plan, msg);
      toast.error(msg);
    }
  };

  const selectAnswer = <K extends keyof QuizAnswers>(key: K, value: QuizAnswers[K]) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    trackEvent(ANALYTICS_EVENTS.ONBOARDING_STEP, { step, answer: key, value });
    window.setTimeout(goNext, 280);
  };

  const progress = progressPercent(step, skipAuth);

  const renderQuizOptions = <K extends keyof QuizAnswers>(
    key: K,
    options: { id: QuizAnswers[K]; label: string }[]
  ) => (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((opt) => {
        const selected = answers[key] === opt.id;
        return (
          <button
            key={String(opt.id)}
            type="button"
            onClick={() => selectAnswer(key, opt.id)}
            className={cn(
              "cursor-pointer rounded-xl border p-4 text-start transition-all duration-200",
              "hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected ? "border-primary bg-primary/10 shadow-sm" : "border-border bg-card"
            )}
          >
            <span className="font-semibold text-foreground">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );

  const renderBody = () => {
    switch (step) {
      case "welcome":
        return (
          <div className="space-y-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Sparkles className="h-8 w-8 text-primary" aria-hidden />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold tracking-tight text-foreground">{copy.welcome.title}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{copy.welcome.subtitle}</p>
            </div>
            <ul className="space-y-2 text-start text-sm text-muted-foreground">
              {(nativeApp ? copy.welcome.bulletsApp : copy.welcome.bullets).map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <Button size="lg" className="w-full rounded-xl font-bold" onClick={goNext}>
              {copy.welcome.cta}
            </Button>
          </div>
        );

      case "quiz_category":
        return (
          <div className="space-y-4">
            <DialogHeader className="text-center sm:text-center">
              <DialogTitle className="text-xl font-bold">{copy.questions.category.question}</DialogTitle>
              <DialogDescription>{copy.questions.hint}</DialogDescription>
            </DialogHeader>
            {renderQuizOptions("category", copy.questions.category.options)}
          </div>
        );

      case "quiz_frequency":
        return (
          <div className="space-y-4">
            <DialogHeader className="text-center sm:text-center">
              <DialogTitle className="text-xl font-bold">{copy.questions.frequency.question}</DialogTitle>
              <DialogDescription>{copy.questions.hint}</DialogDescription>
            </DialogHeader>
            {renderQuizOptions("frequency", copy.questions.frequency.options)}
          </div>
        );

      case "quiz_pain":
        return (
          <div className="space-y-4">
            <DialogHeader className="text-center sm:text-center">
              <DialogTitle className="text-xl font-bold">{copy.questions.pain.question}</DialogTitle>
              <DialogDescription>{copy.questions.hint}</DialogDescription>
            </DialogHeader>
            {renderQuizOptions("pain", copy.questions.pain.options)}
          </div>
        );

      case "result": {
        const CatIcon = CATEGORY_ICONS[answers.category ?? "mixed"];
        return (
          <div className="space-y-5 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <CatIcon className="h-7 w-7 text-primary" aria-hidden />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">{copy.result.badge}</p>
              <h2 className="text-xl font-extrabold text-foreground">{resultProfile.title}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{resultProfile.desc}</p>
            </div>
            {resultProfile.frequencyLine ? (
              <p className="text-xs font-medium text-primary">{resultProfile.frequencyLine}</p>
            ) : null}
            {resultProfile.painLine ? (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm font-medium text-foreground">
                <Zap className="mb-1 inline h-4 w-4 text-primary" aria-hidden /> {resultProfile.painLine}
              </div>
            ) : null}
            <Button size="lg" className="w-full rounded-xl font-bold" onClick={goNext}>
              {copy.result.cta}
            </Button>
          </div>
        );
      }

      case "auth":
        return (
          <div className="space-y-5 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Crown className="h-7 w-7 text-primary" aria-hidden />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-foreground">{copy.auth.title}</h2>
              <p className="text-sm text-muted-foreground">{copy.auth.subtitle}</p>
            </div>
            <GoogleLoginButton fullWidth />
            <p className="text-xs text-muted-foreground">{copy.auth.note}</p>
          </div>
        );

      case "offer":
        return (
          <div className="space-y-5">
            <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-primary/5 to-background p-4 text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                {copy.offer.badge}
              </p>
              <h2 className="mt-1 text-xl font-extrabold text-foreground">{copy.offer.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{copy.offer.subtitle}</p>
              {!expired ? (
                <div
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 font-mono text-lg font-bold tracking-widest text-background"
                  aria-live="polite"
                >
                  <Clock className="h-4 w-4" aria-hidden />
                  {countdown}
                </div>
              ) : (
                <p className="mt-3 text-sm font-medium text-muted-foreground">{copy.offer.expiredNote}</p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">{copy.offer.countdownHint}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPlan("yearly")}
                className={cn(
                  "cursor-pointer rounded-xl border p-3 text-center transition-colors",
                  plan === "yearly" ? "border-primary bg-primary/10" : "border-border"
                )}
              >
                <p className="text-xs font-semibold text-primary">{copy.offer.yearlySave}</p>
                {nativeBilling ? (
                  <p className="text-sm font-extrabold text-foreground">{copy.offer.playYearlyLabel}</p>
                ) : (
                  <p className="text-lg font-extrabold text-foreground">{copy.offer.priceYearly}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {nativeBilling ? copy.offer.playBillingNote : copy.offer.perYear}
                </p>
              </button>
              <button
                type="button"
                onClick={() => setPlan("monthly")}
                className={cn(
                  "cursor-pointer rounded-xl border p-3 text-center transition-colors",
                  plan === "monthly" ? "border-primary bg-primary/10" : "border-border"
                )}
              >
                <p className="text-xs text-muted-foreground">{copy.offer.monthlyLabel}</p>
                {nativeBilling ? (
                  <p className="text-sm font-extrabold text-foreground">{copy.offer.playMonthlyLabel}</p>
                ) : (
                  <p className="text-lg font-extrabold text-foreground">{copy.offer.priceMonthly}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {nativeBilling ? copy.offer.playBillingNote : copy.offer.perMonth}
                </p>
              </button>
            </div>

            <ul className="space-y-2 text-sm">
              {copy.offer.benefits.map((b) => (
                <li key={b} className="flex items-center gap-2 text-foreground">
                  <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  {b}
                </li>
              ))}
            </ul>

            <Button
              size="lg"
              className="w-full rounded-xl font-bold shadow-lg"
              disabled={checkoutLoading}
              onClick={() => void handleCheckout()}
            >
              {checkoutLoading
                ? copy.offer.ctaLoading
                : nativeBilling
                  ? copy.offer.ctaPlay
                  : copy.offer.cta}
            </Button>
            <p className="text-center text-xs text-muted-foreground">{copy.offer.guarantee}</p>
          </div>
        );

      default:
        return null;
    }
  };

  const showBack = step !== "welcome" && step !== "quiz_category";

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(true) : dismiss("close"))}>
      <DialogContent
        className={cn(
          "gap-0 overflow-hidden p-0 sm:max-w-md",
          "max-h-[min(92vh,720px)] w-[calc(100%-1rem)]"
        )}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="border-b border-border bg-muted/30 px-4 py-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            {showBack ? (
              <button
                type="button"
                onClick={goBack}
                className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <BackIcon className="h-3.5 w-3.5" aria-hidden />
                {copy.back}
              </button>
            ) : (
              <span />
            )}
            <span className="text-xs font-medium text-muted-foreground">
              {copy.progressLabel(progress)}
            </span>
          </div>
          <Progress value={progress} className="h-1.5" aria-label={copy.progressAria} />
        </div>

        <div className="overflow-y-auto px-5 py-6">{renderBody()}</div>

        <div className="border-t border-border bg-muted/20 px-5 py-3 text-center">
          <button
            type="button"
            onClick={() => dismiss("skip")}
            className="cursor-pointer text-xs font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            {copy.skipFree}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
