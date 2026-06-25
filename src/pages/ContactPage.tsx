import { AppLayout } from "@/components/AppLayout";
import { SEOHead } from "@/components/SEOHead";
import { Mail } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { enTranslations } from "@/lib/translations/en";
import { siteUrl } from "@/lib/site";

export default function ContactPage() {
  const { t } = useLocale();
  const p = t.contactPage ?? enTranslations.contactPage;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: t.brandName,
    url: siteUrl("/"),
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: p.email,
      availableLanguage: ["Hebrew", "English"],
      areaServed: "IL",
    },
  };

  return (
    <AppLayout>
      <SEOHead title={p.seoTitle} description={p.seoDesc} jsonLd={jsonLd} />
      <article className="mx-auto max-w-3xl space-y-8 px-4 py-8 lg:py-12">
        <header className="space-y-3">
          <h1 className="text-3xl font-extrabold text-foreground">{p.title}</h1>
          <p className="text-base leading-relaxed text-muted-foreground">{p.intro}</p>
        </header>
        <section className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-bold text-foreground">{p.emailHeading}</h2>
          <a
            href={`mailto:${p.email}`}
            className="inline-flex items-center gap-2 text-primary underline-offset-4 hover:underline"
          >
            <Mail className="h-4 w-4" aria-hidden />
            {p.email}
          </a>
          <p className="text-sm leading-relaxed text-muted-foreground">{p.responseTime}</p>
        </section>
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-foreground">{p.supportHeading}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{p.supportBody}</p>
        </section>
      </article>
    </AppLayout>
  );
}
