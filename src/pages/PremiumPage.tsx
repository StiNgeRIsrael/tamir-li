import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { useLocale, localePath } from "@/lib/i18n";
import {
  Crown, Zap, Check, Star, Shield, Sparkles,
  ImageIcon, Gauge, FileStack, Headphones, ChevronDown
} from "lucide-react";
import { useState } from "react";

const featureIcons = [FileStack, Shield, Sparkles, Gauge, ImageIcon, Headphones];

export default function PremiumPage() {
  const { locale, t } = useLocale();
  const u = t.upgradePage || {};
  const features = u.features || [];
  const rows = u.comparisonRows || [];
  const headers = u.comparisonHeaders || {};
  const testimonials = u.testimonials || [];
  const faqs = u.faqs || [];
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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

          {/* Price card */}
          <div className="max-w-sm mx-auto bg-card border-2 border-premium rounded-2xl p-6 shadow-lg shadow-premium/10 space-y-4">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-5xl font-black text-foreground">{u.price}</span>
              <span className="text-lg text-muted-foreground font-medium">{u.period}</span>
            </div>
            <p className="text-xs text-muted-foreground">{u.billedNote}</p>
            <Button size="lg" className="w-full bg-premium text-premium-foreground hover:bg-premium/90 font-bold text-base py-6 rounded-xl shadow-md">
              <Zap className="w-5 h-5 me-2" />
              {u.ctaMain}
            </Button>
            <Button variant="outline" size="lg" className="w-full font-semibold border-premium/30 text-premium hover:bg-premium/5 rounded-xl">
              {u.ctaSecondary}
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
                  {row.premium === "Unlimited" || row.premium === "None" || row.premium === "Priority" || row.premium === "Priority Email" || row.premium === "200MB"
                    ? <span className="inline-flex items-center gap-1"><Check className="w-4 h-4" />{row.premium}</span>
                    : row.premium}
                </div>
              </div>
            ))}
          </div>
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
            <Button size="lg" className="bg-premium text-premium-foreground hover:bg-premium/90 font-bold px-10 py-6 text-base rounded-xl shadow-md">
              <Zap className="w-5 h-5 me-2" />
              {u.ctaMain} — {u.price}{u.period}
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
