import { Link, useParams, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { SEOHead } from "@/components/SEOHead";
import {
  tools,
  categoryIcons,
  getDefaultSlug,
  CATEGORY_HUB_CATEGORIES,
  type ToolCategory,
} from "@/lib/tools-data";
import { isToolFunctional } from "@/lib/tool-availability";
import { useLocale, localePath } from "@/lib/i18n";
import { siteUrl } from "@/lib/site";
import { buildBreadcrumbJsonLd } from "@/lib/structured-data";
import { useToolConfig } from "@/contexts/ToolConfigContext";
import { ToolSoonBadge } from "@/components/ToolSoonBadge";
import { enTranslations } from "@/lib/translations/en";

function isToolCategory(value: string | undefined): value is ToolCategory {
  return !!value && CATEGORY_HUB_CATEGORIES.includes(value as ToolCategory);
}

export default function CategoryHubPage() {
  const { category } = useParams();
  const { locale, t } = useLocale();
  const { filterTools } = useToolConfig();

  if (!isToolCategory(category)) {
    return <Navigate to={localePath("/", locale)} replace />;
  }

  const hub = t.categoryHub ?? enTranslations.categoryHub;
  const catLabels = t.categories as Record<string, string>;
  const toolNames = t.toolNames as Record<string, string>;
  const categoryLabel = catLabels[category] ?? category;

  const categoryTools = filterTools(tools.filter((tool) => tool.category === category));
  const functionalTools = categoryTools.filter((tool) => isToolFunctional(tool.id));

  const hubPath = localePath(`/tools/${category}`, locale);
  const hubUrl = siteUrl(hubPath);
  const homeUrl = siteUrl(localePath("/", locale));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: hub.seoTitle(categoryLabel),
        description: hub.seoDesc(categoryLabel),
        url: hubUrl,
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: functionalTools.length,
          itemListElement: functionalTools.map((tool, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: toolNames[tool.id] ?? tool.name,
            url: siteUrl(localePath(`/${getDefaultSlug(tool)}`, locale)),
          })),
        },
      },
      buildBreadcrumbJsonLd([
        { name: t.tool.breadcrumbHome, item: homeUrl },
        { name: categoryLabel, item: hubUrl },
      ]),
    ],
  };

  const CatIcon = categoryIcons[category];

  return (
    <AppLayout>
      <SEOHead
        title={hub.seoTitle(categoryLabel)}
        description={hub.seoDesc(categoryLabel)}
        jsonLd={jsonLd}
      />
      <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8 lg:py-12 space-y-8">
        <header className="space-y-3">
          <nav aria-label="breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to={localePath("/", locale)} className="hover:text-foreground transition-colors">
              {t.tool.breadcrumbHome}
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">{categoryLabel}</span>
          </nav>
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CatIcon className="h-5 w-5" />
            </div>
            <div className="space-y-2 min-w-0">
              <h1 className="text-2xl lg:text-3xl font-extrabold text-foreground">{categoryLabel}</h1>
              <p className="text-sm text-muted-foreground max-w-2xl">{hub.intro(categoryLabel)}</p>
            </div>
          </div>
        </header>

        {categoryTools.length === 0 ? (
          <p className="text-sm text-muted-foreground">{hub.empty}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryTools.map((tool) => {
              const functional = isToolFunctional(tool.id);
              const slug = getDefaultSlug(tool);
              const name = toolNames[tool.id] ?? tool.name;
              return (
                <Link
                  key={tool.id}
                  to={localePath(`/${slug}`, locale)}
                  className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-md transition-all space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-foreground">{name}</h2>
                    {!functional && <ToolSoonBadge />}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{tool.description}</p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
