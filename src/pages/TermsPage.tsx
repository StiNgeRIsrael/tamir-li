import { AppLayout } from "@/components/AppLayout";
import { SEOHead } from "@/components/SEOHead";
import { useLocale } from "@/lib/i18n";
import { enTranslations } from "@/lib/translations/en";

type LegalSection = { heading: string; body: string[] };

export default function TermsPage() {
  const { t } = useLocale();
  const p = t.termsPage ?? enTranslations.termsPage;
  const sections = (p.sections ?? []) as LegalSection[];

  return (
    <AppLayout>
      <SEOHead title={p.seoTitle} description={p.seoDesc} />
      <article className="mx-auto max-w-3xl space-y-8 px-4 py-8 lg:py-12">
        <header className="space-y-2">
          <h1 className="text-3xl font-extrabold text-foreground">{p.title}</h1>
          <p className="text-sm text-muted-foreground">{p.lastUpdated}</p>
        </header>
        {sections.map((section, i) => (
          <section key={i} className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">{section.heading}</h2>
            {section.body.map((paragraph, j) => (
              <p key={j} className="text-sm leading-relaxed text-muted-foreground">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </article>
    </AppLayout>
  );
}
