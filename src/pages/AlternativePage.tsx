import { Link, Navigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { SEOHead } from "@/components/SEOHead";
import { useLocale, localePath } from "@/lib/i18n";
import { enTranslations } from "@/lib/translations/en";
import { siteUrl } from "@/lib/site";
import { buildBreadcrumbJsonLd } from "@/lib/structured-data";
import {
  ALTERNATIVE_SLUGS,
  FREECONVERT_COMPARISON_ROWS,
  getAlternativePath,
  type AlternativeSlug,
} from "@/lib/alternative-pages-data";

function isAlternativeSlug(value: string | undefined): value is AlternativeSlug {
  return !!value && (ALTERNATIVE_SLUGS as readonly string[]).includes(value);
}

export default function AlternativePage() {
  const { slug } = useParams();
  const { locale, t } = useLocale();

  if (!isAlternativeSlug(slug)) {
    return <Navigate to={localePath("/", locale)} replace />;
  }

  const alt = t.alternativePage?.[slug] ?? enTranslations.alternativePage?.[slug];
  if (!alt) {
    return <Navigate to={localePath("/", locale)} replace />;
  }

  const pagePath = getAlternativePath(slug);
  const pageUrl = siteUrl(localePath(pagePath, locale));
  const homeUrl = siteUrl(localePath("/", locale));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: alt.seoTitle,
        description: alt.seoDesc,
        url: pageUrl,
      },
      buildBreadcrumbJsonLd([
        { name: t.tool.breadcrumbHome, item: homeUrl },
        { name: alt.title, item: pageUrl },
      ]),
    ],
  };

  const rowLabels = alt.rowLabels as Record<string, string>;
  const cellLabels = alt.cellLabels as Record<string, string>;

  return (
    <AppLayout>
      <SEOHead title={alt.seoTitle} description={alt.seoDesc} jsonLd={jsonLd} />
      <article className="mx-auto max-w-3xl space-y-8 px-4 py-8 lg:py-12">
        <header className="space-y-3">
          <nav aria-label="breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to={localePath("/", locale)} className="hover:text-foreground transition-colors">
              {t.tool.breadcrumbHome}
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">{alt.title}</span>
          </nav>
          <h1 className="text-3xl font-extrabold text-foreground">{alt.title}</h1>
          <p className="text-base leading-relaxed text-muted-foreground">{alt.intro}</p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">{alt.tableTitle}</h2>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-start font-semibold text-foreground">{alt.tableHeaders.feature}</th>
                  <th className="px-4 py-3 text-start font-semibold text-primary">{alt.tableHeaders.tamir}</th>
                  <th className="px-4 py-3 text-start font-semibold text-muted-foreground">{alt.tableHeaders.competitor}</th>
                </tr>
              </thead>
              <tbody>
                {FREECONVERT_COMPARISON_ROWS.map((row) => (
                  <tr key={row.featureKey} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium text-foreground">{rowLabels[row.featureKey]}</td>
                    <td className="px-4 py-3 text-foreground">{cellLabels[row.tamir] ?? row.tamir}</td>
                    <td className="px-4 py-3 text-muted-foreground">{cellLabels[row.competitor] ?? row.competitor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">{alt.disclaimer}</p>
        </section>

        <section className="rounded-xl border border-primary/20 bg-primary/5 p-6 space-y-3">
          <p className="text-sm text-foreground">{alt.cta}</p>
          <Link
            to={localePath("/", locale)}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {alt.ctaButton}
          </Link>
        </section>
      </article>
    </AppLayout>
  );
}
