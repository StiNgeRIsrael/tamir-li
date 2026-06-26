import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { SEOHead } from "@/components/SEOHead";
import { BrandWordmark } from "@/components/BrandWordmark";
import { useLocale, localePath } from "@/lib/i18n";
import { SITE_ORIGIN } from "@/lib/site";
import { enTranslations } from "@/lib/translations/en";

export default function PressPage() {
  const { locale, t } = useLocale();
  const p = t.pressPage ?? enTranslations.pressPage;

  return (
    <AppLayout>
      <SEOHead title={p.seoTitle} description={p.seoDesc} />
      <article className="mx-auto max-w-2xl space-y-8 px-4 py-8 lg:py-12">
        <header className="space-y-3">
          <h1 className="text-3xl font-extrabold text-foreground">{p.title}</h1>
          <p className="text-muted-foreground leading-relaxed">{p.intro}</p>
        </header>

        <section className="rounded-xl border border-border bg-card p-8 flex flex-col items-center gap-4">
          <BrandWordmark locale={locale} size="lg" />
          <p className="text-center text-sm text-muted-foreground max-w-md">{p.tagline}</p>
          <a href={`${SITE_ORIGIN}/`} className="text-primary font-medium hover:underline">
            tamir.li
          </a>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">{p.logoTitle}</h2>
          <p className="text-sm text-muted-foreground">{p.logoDesc}</p>
          <a href="/pwa-512x512.png" download="tamir-li-logo.png" className="text-sm text-primary hover:underline">
            {p.downloadLogo}
          </a>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">{p.linkTitle}</h2>
          <p className="text-sm text-muted-foreground">{p.linkDesc}</p>
          <div className="rounded-lg bg-muted/50 border border-border p-4 text-sm space-y-1">
            <p>{p.suggestedAnchor}</p>
            <p className="text-primary">{SITE_ORIGIN}/</p>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-foreground">{p.contactTitle}</h2>
          <p className="text-sm text-muted-foreground">
            {p.contactDesc}{" "}
            <Link to={localePath("/contact", locale)} className="text-primary hover:underline">
              {p.contactLink}
            </Link>
          </p>
        </section>
      </article>
    </AppLayout>
  );
}
