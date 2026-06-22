import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { Link, useSearchParams } from "react-router-dom";
import { useLocale, localePath } from "@/lib/i18n";
import {
  Crown, Zap, Check, Star, Shield, Sparkles,
  ImageIcon, Gauge, FileStack, Headphones, ChevronDown, ShieldCheck
} from "lucide-react";
import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics/events";
import { useSubscription, type CheckoutPlan } from "@/hooks/useSubscription";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const featureIcons = [FileStack, Shield, Sparkles, Gauge, ImageIcon, Headphones];

export default function PremiumPage() {
  const { locale, t } = useLocale();
  const { user } = useAuth();
  const { checkout, checkoutLoading, refetch, captureOrder } = useSubscription();
  const [searchParams, setSearchParams] = useSearchParams();
  const u = t.upgradePage || {};
  const features = u.features || [];
  const rows = u.comparisonRows || [];
  const headers = u.comparisonHeaders || {};
  const testimonials = u.testimonials || [];
  const faqs = u.faqs || [];
  const guaranteeItems = u.guaranteeItems || [];
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isYearly, setIsYearly] = useState(true);

  useEffect(() => {
    const checkoutResult = searchParams.get("checkout");
    const plan = searchParams.get("plan");
    const paypalToken = searchParams.get("token");

    const finishCheckout = async () => {
      if (checkoutResult === "success") {
        if (paypalToken && plan?.startsWith("credits_")) {
          try {
            await captureOrder(paypalToken);
          } catch {
            /* webhook may have already captured */
          }
        }
        trackEvent("purchase", { plan: plan ?? undefined, source: "paypal_return" });
        refetch();
        toast.success(u.checkoutSuccess ?? "Welcome to Premium!");
        setSearchParams({}, { replace: true });
      } else if (checkoutResult === "canceled") {
        setSearchParams({}, { replace: true });
      }
    };

    void finishCheckout();
  }, [searchParams, setSearchParams, refetch, captureOrder, u.checkoutSuccess]);

  const startCheckout = async (source: string) => {
    const plan: CheckoutPlan = isYearly ? "yearly" : "monthly";
    trackEvent("upgrade_click", { plan, source });
    trackEvent("begin_checkout", { plan, source });

    if (!user) {
      toast.error(t.auth?.signInRequired ?? "Sign in to upgrade");
      return;
    }

    try {
      await checkout(plan);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Checkout failed");
    }
  };

  const displayPrice = isYearly ? u.priceYearlyPerMonth : u.priceMonthly;
  const displayPeriod = u.periodMonthly;
  const billedNote = isYearly ? u.billedYearly : u.billedMonthly;
  const totalPrice = isYearly ? u.priceYearly : u.priceMonthly;
  const totalPeriod = isYearly ? u.periodYearly : u.periodMonthly;

  return (
    <AppLayout>
      <SEOHead title={u.seoTitle || ""} description={u.seoDesc || ""} />
      <div className="max-w-4xl mx-auto px-4 py-8 lg:py-14 space-y-12">

        {/* Hero */}
        <section className="text-center space-y-6 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-premium/10 text-premium text-sm font-bold px-4 py-1.5 rounded-full border border-premium/20">
            <Crown className="w-4 h-4" />
            {u.badge}
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-foreground leading-tight tracking-tight">
            {u.headline}
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            {u.subheadline}
          </p>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3">
            <span className={`text-sm font-medium ${!isYearly ? "text-foreground" : "text-muted-foreground"}`}>
              {u.monthlyLabel}
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`relative w-14 h-7 rounded-full transition-colors ${isYearly ? "bg-premium" : "bg-muted"}`}
            >
              <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all ${isYearly ? "start-7" : "start-0.5"}`} />
            </button>
            <span className={`text-sm font-medium ${isYearly ? "text-foreground" : "text-muted-foreground"}`}>
              {u.yearlyLabel}
            </span>
            {isYearly && (
              <span className="text-xs font-bold text-success bg-success/10 px-2 py-0.5 rounded-full animate-fade-in">
                {u.yearlySave}
              </span>
            )}
          </div>

          {/* Price card */}
          <div className="max-w-sm mx-auto bg-card border-2 border-premium rounded-2xl p-6 shadow-lg shadow-premium/10 space-y-4">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-5xl font-black text-foreground">{displayPrice}</span>
              <span className="text-lg text-muted-foreground font-medium">{displayPeriod}</span>
            </div>
            {isYearly && (
              <p className="text-xs text-muted-foreground">
                {totalPrice}{totalPeriod}
              </p>
            )}
            <p className="text-xs text-muted-foreground">{billedNote}</p>
            <Button
              size="lg"
              className="w-full bg-premium text-premium-foreground hover:bg-premium/90 font-bold text-base py-6 rounded-xl shadow-md"
              onClick={() => startCheckout("hero")}
              disabled={checkoutLoading}
            >
              <Zap className="w-5 h-5 me-2" />
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
            {features.map((f: any, i: number) => {
              const Icon = featureIcons[i] || Zap;
              return (
                <article key={i} className="bg-card border border-border rounded-xl p-5 space-y-3 hover:border-premium/30 hover:shadow-sm transition-all">
                  <div className="w-11 h-11 rounded-xl bg-premium/10 flex items-center justify-center">
                    <Icon className="w-5.5 h-5.5 text-premium" />
                  </div>
                  <h3 className="font-bold text-foreground">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </article>
              );
            })}
          </div>
        </section>

        {/* Comparison table */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground text-center">{u.comparisonTitle}</h2>
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="grid grid-cols-3 text-sm font-bold border-b border-border">
              <div className="p-4 text-muted-foreground">{headers.feature}</div>
              <div className="p-4 text-center text-muted-foreground">{headers.free}</div>
              <div className="p-4 text-center text-premium bg-premium/5">{headers.premium}</div>
            </div>
            {rows.map((row: any, i: number) => (
              <div key={i} className={`grid grid-cols-3 text-sm ${i % 2 === 0 ? "" : "bg-muted/30"} ${i === rows.length - 1 ? "" : "border-b border-border/50"}`}>
                <div className="p-4 font-medium text-foreground">{row.feature}</div>
                <div className="p-4 text-center text-muted-foreground">{row.free}</div>
                <div className="p-4 text-center font-semibold text-premium bg-premium/5">
                  {typeof row.premium === "string" && row.premium !== "—"
                    ? <span className="inline-flex items-center gap-1"><Check className="w-4 h-4" />{row.premium}</span>
                    : row.premium}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Money-Back Guarantee */}
        <section className="bg-card border border-border rounded-2xl p-6 lg:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-success" />
            </div>
            <h2 className="text-xl font-bold text-foreground">{u.guaranteeTitle}</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{u.guaranteeDesc}</p>
          <ul className="space-y-2">
            {guaranteeItems.map((item: string, i: number) => (
              <li key={i} className="flex items-center gap-2 text-sm text-foreground">
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
              {testimonials.map((t: any, i: number) => (
                <div key={i} className="bg-card border border-border rounded-xl p-5 space-y-3">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 text-premium fill-premium" />
                    ))}
                  </div>
                  <p className="text-sm text-foreground leading-relaxed italic">"{t.text}"</p>
                  <div>
                    <p className="text-sm font-bold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* FAQ */}
        {faqs.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground text-center">{u.faqTitle}</h2>
            <div className="max-w-2xl mx-auto space-y-2">
              {faqs.map((faq: any, i: number) => (
                <div key={i} className="bg-card border border-border rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-4 text-start font-medium text-foreground hover:bg-muted/30 transition-colors"
                  >
                    {faq.q}
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
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
          <p className="text-sm text-muted-foreground max-w-md mx-auto">{u.finalDesc}</p>
          <div className="flex flex-col items-center gap-3">
            <Button
              size="lg"
              className="bg-premium text-premium-foreground hover:bg-premium/90 font-bold px-10 py-6 text-base rounded-xl shadow-md"
              onClick={() => startCheckout("footer")}
              disabled={checkoutLoading}
            >
              <Zap className="w-5 h-5 me-2" />
              {u.ctaMain} — {displayPrice}{displayPeriod}
            </Button>
            <p className="text-xs text-muted-foreground">
              <Link to={localePath("/", locale)} className="text-primary hover:underline">{u.orGoHome}</Link>
            </p>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}