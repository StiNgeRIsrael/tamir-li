import { Link, Navigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { SEOHead } from "@/components/SEOHead";
import { useLocale, localePath } from "@/lib/i18n";
import { enTranslations } from "@/lib/translations/en";
import { siteUrl } from "@/lib/site";
import { buildBreadcrumbJsonLd } from "@/lib/structured-data";
import {
  USE_CASE_TOOL_LINKS,
  getUseCasePath,
  isUseCaseSlug,
  type UseCaseSlug,
} from "@/lib/use-case-pages-data";

export default function UseCasePage() {
  const { slug } = useParams();
  const { locale, t } = useLocale();

  if (!isUseCaseSlug(slug)) {
    return <Navigate to={localePath("/", locale)} replace />;
  }

  const page = t.useCasePage?.[slug as UseCaseSlug] ?? enTranslations.useCasePage?.[slug as UseCaseSlug];
  if (!page) {
    return <Navigate to={localePath("/", locale)} replace />;
  }

  const pagePath = getUseCasePath(slug as UseCaseSlug);
  const pageUrl = siteUrl(localePath(pagePath, locale));
  const homeUrl = siteUrl(localePath("/", locale));
  const toolHrefs = USE_CASE_TOOL_LINKS[slug as UseCaseSlug];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: page.seoTitle,
        description: page.seoDesc,
        url: pageUrl,
      },
      buildBreadcrumbJsonLd([
        { name: t.tool.breadcrumbHome, item: homeUrl },
        { name: page.title, item: pageUrl },
      ]),
    ],
  };

  return (
    <AppLayout>
      <SEOHead title={page.seoTitle} description={page.seoDesc} jsonLd={jsonLd} />
      <article className="mx-auto max-w-3xl space-y-8 px-4 py-8 lg:py-12">
        <header className="space-y-3">
          <nav aria-label="breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to={localePath("/", locale)} className="hover:text-foreground transition-colors">
              {t.tool.breadcrumbHome}
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">{page.title}</span>
          </nav>
          <h1 className="text-3xl font-extrabold text-foreground">{page.title}</h1>
          <p className="text-base leading-relaxed text-muted-foreground">{page.intro}</p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">{page.stepsTitle}</h2>
          <ol className="list-decimal list-inside space-y-3 text-sm text-muted-foreground leading-relaxed">
            {page.steps.map((step, i) => (
              <li key={i} className="ps-1">{step}</li>
            ))}
          </ol>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">{page.toolsTitle}</h2>
          <ul className="space-y-2">
            {toolHrefs.map((href) => {
              const labels = page.toolLabels as Record<string, string> | undefined;
              const label = labels?.[href] ?? href.replace(/^\//, "");
              return (
                <li key={href}>
                  <Link
                    to={localePath(href, locale)}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {label} →
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="rounded-xl border border-primary/20 bg-primary/5 p-6 space-y-3">
          <p className="text-sm text-foreground">{page.cta}</p>
          <Link
            to={localePath(toolHrefs[0], locale)}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {page.ctaButton}
          </Link>
        </section>
      </article>
    </AppLayout>
  );
}
