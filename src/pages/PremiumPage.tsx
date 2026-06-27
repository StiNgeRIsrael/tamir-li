import { AppLayout } from "@/components/AppLayout";

import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { SEOHead } from "@/components/SEOHead";

import { Link, useSearchParams } from "react-router-dom";

import { useLocale, localePath } from "@/lib/i18n";
import { siteUrl } from "@/lib/site";

import {
  Crown,
  Zap,
  Check,
  Star,
  Shield,
  Sparkles,
  ImageIcon,
  Gauge,
  FileStack,
  Headphones,
  ChevronDown,
  ShieldCheck,
  X,
} from "lucide-react";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { trackEvent, ANALYTICS_EVENTS } from "@/lib/analytics/events";

import { getPlanEcommerceParams } from "@/lib/analytics/purchase";
import {
  trackBeginCheckout,
  trackCheckoutCanceled,
  trackCheckoutError,
  trackPurchase,
  trackUpgradeClick,
} from "@/lib/analytics/purchase-tracking";
import { isCheckoutPlan } from "@/lib/analytics/purchase";

import { useSubscription, type CheckoutPlan } from "@/hooks/useSubscription";

import { useAuth } from "@/contexts/AuthContext";

import { toast } from "sonner";

import { GoogleLoginButton } from "@/components/GoogleLoginButton";
import { buildFaqPageJsonLd } from "@/lib/structured-data";

const featureIcons = [
  FileStack,
  Shield,
  Sparkles,
  Gauge,
  ImageIcon,
  Headphones,
];

const EXIT_INTENT_KEY = "tamir_premium_exit_intent_shown";

type ComparisonRow = {
  feature: string;

  free: string;

  premium: string;

  highlight?: boolean;

  freeNegative?: boolean;
};

export default function PremiumPage() {
  const { locale, t } = useLocale();

  const { user } = useAuth();

  const auth = t.auth as { signInRequired?: string } | undefined;

  const { checkout, checkoutLoading, refetch, captureOrder, activateSubscription, isPremium, nativeBilling } =
    useSubscription();

  const [searchParams, setSearchParams] = useSearchParams();

  const u = t.upgradePage;

  const exitIntent = u.exitIntent as
    | {
        title?: string;

        body?: string;

        cta?: string;

        dismiss?: string;
      }
    | undefined;

  const features = u.features;

  const rows = u.comparisonRows as ComparisonRow[];

  const headers = u.comparisonHeaders;

  const testimonials = u.testimonials;

  const faqs = u.faqs;

  const guaranteeItems = u.guaranteeItems;

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const [isYearly, setIsYearly] = useState(true);

  const [exitIntentOpen, setExitIntentOpen] = useState(false);

  const promotionTracked = useRef(false);

  useEffect(() => {
    if (promotionTracked.current) return;

    promotionTracked.current = true;

    const plan: CheckoutPlan = "yearly";

    trackEvent(ANALYTICS_EVENTS.VIEW_PROMOTION, {
      promotion_name: "premium_yearly",

      creative_name: "premium_page",

      location_id: "premium_hero",

      plan,

      ...getPlanEcommerceParams(plan),
    });
  }, []);

  useEffect(() => {
    const checkoutResult = searchParams.get("checkout");

    const plan = searchParams.get("plan");

    const paypalToken = searchParams.get("token");

    const subscriptionId = searchParams.get("subscription_id");

    const finishCheckout = async () => {
      if (checkoutResult === "success") {
        if (paypalToken && plan?.startsWith("credits_")) {
          try {
            await captureOrder(paypalToken);
          } catch {
            /* webhook may have already captured */
          }
        } else if (
          subscriptionId &&
          (plan === "monthly" || plan === "yearly")
        ) {
          try {
            await activateSubscription(subscriptionId);
          } catch {
            /* webhook may have already synced */
          }
        }

        trackPurchase({
          plan: isCheckoutPlan(plan) ? plan : isYearly ? "yearly" : "monthly",
          source: "paypal_return",
          transactionId: paypalToken ?? subscriptionId ?? undefined,
          provider: "paypal",
        });

        refetch();

        toast.success(u.checkoutSuccess ?? "Welcome to Premium!");

        setSearchParams({}, { replace: true });
      } else if (checkoutResult === "canceled") {
        trackCheckoutCanceled(isCheckoutPlan(plan) ? plan : undefined);
        setSearchParams({}, { replace: true });
      }
    };

    void finishCheckout();
  }, [searchParams, setSearchParams, refetch, captureOrder, activateSubscription, u.checkoutSuccess]);

  const handleExitIntent = useCallback(
    (e: MouseEvent) => {
      if (e.clientY > 0) return;

      if (isPremium) return;

      if (sessionStorage.getItem(EXIT_INTENT_KEY)) return;

      if (window.matchMedia("(pointer: coarse)").matches) return;

      sessionStorage.setItem(EXIT_INTENT_KEY, "1");

      setExitIntentOpen(true);

      trackEvent(ANALYTICS_EVENTS.VIEW_PROMOTION, {
        promotion_name: isYearly
          ? "premium_yearly_exit"
          : "premium_monthly_exit",

        creative_name: "premium_exit_intent",

        location_id: "exit_modal",

        plan: isYearly ? "yearly" : "monthly",

        ...getPlanEcommerceParams(isYearly ? "yearly" : "monthly"),
      });
    },
    [isPremium, isYearly],
  );

  useEffect(() => {
    document.addEventListener("mouseleave", handleExitIntent);

    return () => document.removeEventListener("mouseleave", handleExitIntent);
  }, [handleExitIntent]);

  const startCheckout = async (source: string) => {
    const plan: CheckoutPlan = isYearly ? "yearly" : "monthly";

    if (!user) {
      toast.error(auth?.signInRequired ?? "Sign in to continue");
      return;
    }

    trackUpgradeClick(plan, source);
    trackBeginCheckout({ plan, source });

    try {
      await checkout(plan);
      if (nativeBilling) {
        await refetch();
        toast.success(u.checkoutSuccess ?? "Welcome to Premium!");
      }
    } catch (e) {
      trackCheckoutError(plan, e instanceof Error ? e.message : "Checkout failed");
      toast.error(e instanceof Error ? e.message : "Checkout failed");
    }
  };

  const renderFreeCell = (row: ComparisonRow) => {
    if (row.freeNegative) {
      return (
        <span className="inline-flex items-center gap-1 text-destructive/80">
          <X className="w-4 h-4 shrink-0" aria-hidden />

          {row.free}
        </span>
      );
    }

    return row.free;
  };

  const renderPremiumCell = (row: ComparisonRow) => {
    if (row.premium === "—") return row.premium;

    return (
      <span className="inline-flex items-center gap-1">
        <Check className="w-4 h-4 shrink-0" aria-hidden />

        {row.premium}
      </span>
    );
  };

  const displayAnchorPrice = isYearly
    ? u.anchorPriceYearlyPerMonth
    : u.anchorPriceMonthly;

  const displayPrice = isYearly ? u.priceYearlyPerMonth : u.priceMonthly;

  const displayPeriod = u.periodMonthly;

  const billedNote = isYearly ? u.billedYearly : u.billedMonthly;

  const totalAnchorPrice = isYearly
    ? u.anchorPriceYearly
    : u.anchorPriceMonthly;

  const totalPrice = isYearly ? u.priceYearly : u.priceMonthly;

  const totalPeriod = isYearly ? u.periodYearly : u.periodMonthly;

  const yearlyBestValue = u.yearlyBestValue as string | undefined;

  const premiumJsonLd = useMemo(() => {
    const faqLd = buildFaqPageJsonLd(faqs as { q: string; a: string }[]);
    const pageUrl = siteUrl(localePath("/premium", locale));
    const graph = [
      {
        "@type": "WebPage",
        name: u.seoTitle || "",
        description: u.seoDesc || "",
        url: pageUrl,
      },
      ...(faqLd ? [faqLd] : []),
    ];
    return { "@context": "https://schema.org", "@graph": graph };
  }, [faqs, locale, u.seoTitle, u.seoDesc]);

  return (
    <AppLayout>
      <SEOHead title={u.seoTitle || ""} description={u.seoDesc || ""} jsonLd={premiumJsonLd} />

      <div className="max-w-4xl mx-auto px-4 py-8 lg:py-14 space-y-12">
        {/* Hero */}

        <section className="text-center space-y-6 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-premium/10 text-premium text-sm font-bold px-4 py-1.5 rounded-full border border-premium/20">
            <Crown className="w-4 h-4" />

            {u.badge}
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground leading-tight tracking-tight">
            {u.headline}
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            {u.subheadline}
          </p>

          {/* Billing toggle — yearly selected by default */}

          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
            <button
              type="button"
              onClick={() => setIsYearly(false)}
              className={`text-sm font-medium transition-colors ${!isYearly ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {u.monthlyLabel}
            </button>

            <button
              type="button"
              onClick={() => setIsYearly(!isYearly)}
              aria-label={`${u.monthlyLabel} / ${u.yearlyLabel}`}
              className={`relative w-14 h-7 rounded-full transition-colors ${isYearly ? "bg-premium" : "bg-muted"}`}
            >
              <div
                className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all ${isYearly ? "start-7" : "start-0.5"}`}
              />
            </button>

            <button
              type="button"
              onClick={() => setIsYearly(true)}
              className={`text-sm font-medium transition-colors ${isYearly ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {u.yearlyLabel}
            </button>

            {isYearly && (
              <span className="text-xs font-bold text-success bg-success/10 px-2 py-0.5 rounded-full animate-fade-in">
                {yearlyBestValue ?? u.yearlySave}
              </span>
            )}
          </div>

          {/* Price card */}

          <div className="max-w-sm mx-auto bg-card border-2 border-premium rounded-2xl p-6 shadow-lg shadow-premium/10 space-y-4">
            {isYearly && yearlyBestValue && (
              <p className="text-xs font-bold text-premium uppercase tracking-wide">
                {yearlyBestValue}
              </p>
            )}

            <div className="flex items-baseline justify-center gap-2 flex-wrap">
              <span className="text-2xl font-semibold text-muted-foreground line-through decoration-muted-foreground/70">
                {displayAnchorPrice}
              </span>

              <span className="text-5xl font-black text-premium">
                {displayPrice}
              </span>

              <span className="text-lg text-muted-foreground font-medium">
                {displayPeriod}
              </span>
            </div>

            {isYearly && (
              <p className="text-xs text-muted-foreground">
                <span className="line-through me-1.5 text-muted-foreground/80">
                  {totalAnchorPrice}
                </span>

                <span className="font-semibold text-foreground">
                  {totalPrice}
                </span>

                {totalPeriod}
              </p>
            )}

            <p className="text-xs text-muted-foreground">{billedNote}</p>

            {!user && (
              <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">
                  {auth?.signInRequired ?? "Sign in to continue"}
                </p>

                <GoogleLoginButton fullWidth />
              </div>
            )}

            <Button
              size="lg"
              className="w-full bg-premium text-premium-foreground hover:bg-premium/90 font-bold text-base py-6 rounded-xl shadow-md"
              onClick={() => startCheckout("hero")}
              disabled={checkoutLoading}
            >
              {u.ctaMain}
            </Button>

            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />

              {u.guarantee}
            </p>
          </div>
        </section>

        {/* Features grid */}

        <section className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(features as { title: string; desc: string }[]).map(
              (f, i: number) => {
                const Icon = featureIcons[i] || Zap;

                return (
                  <article
                    key={i}
                    className="bg-card border border-border rounded-xl p-5 space-y-3 hover:border-premium/30 hover:shadow-sm transition-all"
                  >
                    <div className="w-11 h-11 rounded-xl bg-premium/10 flex items-center justify-center">
                      <Icon className="w-5.5 h-5.5 text-premium" />
                    </div>

                    <h3 className="font-bold text-foreground">{f.title}</h3>

                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {f.desc}
                    </p>
                  </article>
                );
              },
            )}
          </div>
        </section>

        {/* Comparison table */}

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground text-center">
            {u.comparisonTitle}
          </h2>

          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="bg-card border border-border rounded-2xl overflow-hidden min-w-[300px]">
              <div className="grid grid-cols-3 text-xs sm:text-sm font-bold border-b border-border">
                <div className="p-2.5 sm:p-4 text-muted-foreground">
                  {headers.feature}
                </div>

                <div className="p-2.5 sm:p-4 text-center text-muted-foreground">
                  {headers.free}
                </div>

                <div className="p-2.5 sm:p-4 text-center text-premium bg-premium/5">
                  {headers.premium}
                </div>
              </div>

              {rows.map((row, i: number) => (
                <div
                  key={i}
                  className={`grid grid-cols-3 text-xs sm:text-sm ${row.highlight ? "bg-premium/[0.04] ring-1 ring-inset ring-premium/15" : i % 2 === 0 ? "" : "bg-muted/30"} ${i === rows.length - 1 ? "" : "border-b border-border/50"}`}
                >
                  <div
                    className={`p-2.5 sm:p-4 font-medium text-foreground ${row.highlight ? "font-semibold" : ""}`}
                  >
                    {row.feature}
                  </div>

                  <div className="p-2.5 sm:p-4 text-center text-muted-foreground">
                    {renderFreeCell(row)}
                  </div>

                  <div
                    className={`p-2.5 sm:p-4 text-center font-semibold text-premium bg-premium/5 ${row.highlight ? "text-base sm:text-sm" : ""}`}
                  >
                    {renderPremiumCell(row)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Money-Back Guarantee */}

        <section className="bg-card border border-border rounded-2xl p-6 lg:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-success" />
            </div>

            <h2 className="text-xl font-bold text-foreground">
              {u.guaranteeTitle}
            </h2>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            {u.guaranteeDesc}
          </p>

          <ul className="space-y-2">
            {guaranteeItems.map((item: string, i: number) => (
              <li
                key={i}
                className="flex items-center gap-2 text-sm text-foreground"
              >
                <Check className="w-4 h-4 text-success flex-shrink-0" />

                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Testimonials */}

        {testimonials.length > 0 && (
          <section className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(
                testimonials as { text: string; name: string; role: string }[]
              ).map((item, i: number) => (
                <div
                  key={i}
                  className="bg-card border border-border rounded-xl p-5 space-y-3"
                >
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, j) => (
                      <Star
                        key={j}
                        className="w-4 h-4 text-premium fill-premium"
                      />
                    ))}
                  </div>

                  <p className="text-sm text-foreground leading-relaxed italic">
                    "{item.text}"
                  </p>

                  <div>
                    <p className="text-sm font-bold text-foreground">
                      {item.name}
                    </p>

                    <p className="text-xs text-muted-foreground">{item.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* FAQ */}

        {faqs.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground text-center">
              {u.faqTitle}
            </h2>

            <div className="max-w-2xl mx-auto space-y-2">
              {(faqs as { q: string; a: string }[]).map((faq, i: number) => (
                <div
                  key={i}
                  className="bg-card border border-border rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-4 text-start font-medium text-foreground hover:bg-muted/30 transition-colors"
                  >
                    {faq.q}

                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                    />
                  </button>

                  {openFaq === i && (
                    <div className="px-4 pb-4 text-sm text-muted-foreground animate-fade-in">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Final CTA */}

        <section className="text-center space-y-5 bg-gradient-to-br from-premium/10 via-premium/5 to-transparent border border-premium/20 rounded-2xl p-8">
          <Crown className="w-10 h-10 text-premium mx-auto" />

          <h2 className="text-2xl font-bold text-foreground">{u.finalCta}</h2>

          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {u.finalDesc}
          </p>

          <div className="flex flex-col items-center gap-3">
            <Button
              size="lg"
              className="bg-premium text-premium-foreground hover:bg-premium/90 font-bold px-10 py-6 text-base rounded-xl shadow-md"
              onClick={() => startCheckout("footer")}
              disabled={checkoutLoading}
            >
              {u.ctaMain}
            </Button>

            <p className="text-xs text-muted-foreground">
              <Link
                to={localePath("/", locale)}
                className="text-primary hover:underline"
              >
                {u.orGoHome}
              </Link>
            </p>
          </div>
        </section>
      </div>

      {/* Exit-intent modal — soft CTA, once per session */}

      <Dialog open={exitIntentOpen} onOpenChange={setExitIntentOpen}>
        <DialogContent className="sm:max-w-md border-premium/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Crown className="w-5 h-5 text-premium shrink-0" />

              {exitIntent?.title ?? "Before you go"}
            </DialogTitle>

            <DialogDescription className="text-start pt-1 leading-relaxed">
              {exitIntent?.body ??
                "Yearly Premium saves 20% — unlimited conversions, no ads, bigger files."}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex-col sm:flex-col gap-2 sm:gap-2">
            <Button
              className="w-full bg-premium text-premium-foreground hover:bg-premium/90 font-semibold"
              onClick={() => {
                setIsYearly(true);

                setExitIntentOpen(false);

                void startCheckout("exit_intent");
              }}
              disabled={checkoutLoading}
            >
              {exitIntent?.cta ?? u.ctaMain}
            </Button>

            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => setExitIntentOpen(false)}
            >
              {exitIntent?.dismiss ?? u.orGoHome}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
