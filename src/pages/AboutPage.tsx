import { AppLayout } from "@/components/AppLayout";
import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { useLocale, localePath } from "@/lib/i18n";
import { enTranslations } from "@/lib/translations/en";

type AboutSection = { heading: string; body: string[] };

export default function AboutPage() {
  const { locale, t } = useLocale();
  const p = t.aboutPage ?? enTranslations.aboutPage;
  const sections = (p.sections ?? []) as AboutSection[];

  return (
    <AppLayout>
      <SEOHead title={p.seoTitle} description={p.seoDesc} />
      <article className="mx-auto max-w-3xl space-y-8 px-4 py-8 lg:py-12">
        <header className="space-y-3">
          <h1 className="text-3xl font-extrabold text-foreground">{p.title}</h1>
          <p className="text-base leading-relaxed text-muted-foreground">{p.intro}</p>
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
        <p className="text-sm text-muted-foreground">
          {p.contactPrompt}{" "}
          <Link to={localePath("/contact", locale)} className="text-primary underline-offset-4 hover:underline">
            {p.contactLink}
          </Link>
        </p>
      </article>
    </AppLayout>
  );
}
