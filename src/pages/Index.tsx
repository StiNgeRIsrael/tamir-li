import { useMemo, useState, useEffect, lazy, Suspense } from "react";

import { Link, useSearchParams } from "react-router-dom";

import { tools, categoryIcons, getDefaultSlug, type ToolCategory, getToolsByCategory } from "@/lib/tools-data";

import { useToolConfig } from "@/contexts/ToolConfigContext";

import { AppLayout } from "@/components/AppLayout";

import { AdSlot } from "@/components/AdSlot";

import { Input } from "@/components/ui/input";

import { ArrowLeft, ArrowRight, Shield, Zap, Globe, CheckCircle2, Image, FileVideo, FileAudio, FileText, LayoutGrid, FileCheck, Gift, Search, X } from "lucide-react";

import { SEOHead } from "@/components/SEOHead";
import { buildHomeJsonLd } from "@/lib/home-json-ld";

import { useLocale, localePath } from "@/lib/i18n";

import { getDerivedHomeStatsFromTools, formatPublicStatCount } from "@/lib/public-stats";
import { usePublicStats } from "@/hooks/usePublicStats";

import { cn } from "@/lib/utils";

import { getFunctionalToolIds } from "@/lib/tool-availability";
import { ToolIconGrid } from "@/components/ToolIconGrid";

const TOOL_CATEGORIES: ToolCategory[] = ["image", "video", "audio", "document", "ai"];

function parseCategoryParam(value: string | null): ToolCategory | "all" {
  if (value && TOOL_CATEGORIES.includes(value as ToolCategory)) {
    return value as ToolCategory;
  }
  return "all";
}



const InternalToolLinks = lazy(() =>

  import("@/components/InternalToolLinks").then((m) => ({ default: m.InternalToolLinks }))

);

const PremiumBanner = lazy(() =>

  import("@/components/PremiumComponents").then((m) => ({ default: m.PremiumBanner }))

);

const AdNativeSlot = lazy(() =>

  import("@/components/ads/AdNativeSlot").then((m) => ({ default: m.AdNativeSlot }))

);



const categories: ToolCategory[] = ["image", "video", "audio", "document", "ai"];



const statIcons = [LayoutGrid, Zap, FileCheck, Gift];

const formatIcons = [Image, FileVideo, FileAudio, FileText];



/** Preferred order for hero quick links (functional tools only). */

const FEATURED_FUNCTIONAL_ORDER = [

  "image-converter",

  "image-compressor",

  "image-resizer",

  "svg-to-png",

  "png-to-ico",

  "merge-pdf",

  "word-to-pdf",

  "text-tools",

  "audio-converter",

] as const;



const Index = () => {

  const { locale, t, dir } = useLocale();
  const [searchParams, setSearchParams] = useSearchParams();

  const { filterTools } = useToolConfig();

  const isRtl = dir === "rtl";

  const Arrow = isRtl ? ArrowLeft : ArrowRight;

  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");

  const [activeCategory, setActiveCategory] = useState<ToolCategory | "all">(() =>
    parseCategoryParam(searchParams.get("category")),
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const q = search.trim();
      const currentQ = searchParams.get("q") ?? "";
      if (q === currentQ) return;
      const next = new URLSearchParams(searchParams);
      if (q) {
        next.set("q", q);
      } else {
        next.delete("q");
      }
      setSearchParams(next, { replace: true });
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [search, searchParams, setSearchParams]);

  useEffect(() => {
    const fromUrl = searchParams.get("q") ?? "";
    if (fromUrl !== search) {
      setSearch(fromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only sync when URL q changes externally
  }, [searchParams.get("q")]);

  useEffect(() => {
    setActiveCategory(parseCategoryParam(searchParams.get("category")));
  }, [searchParams.get("category")]);

  const setCategoryFilter = (cat: ToolCategory | "all") => {
    setActiveCategory(cat);
    const next = new URLSearchParams(searchParams);
    if (cat === "all") {
      next.delete("category");
    } else {
      next.set("category", cat);
    }
    setSearchParams(next, { replace: true });
  };



  const catLabels = t.categories as Record<ToolCategory, string>;

  const toolNames = t.toolNames as Record<string, string>;

  const toolDescs = t.toolDescriptions as Record<string, string>;

  const homeSearch = t.homeSearch as { placeholder: string; all: string; noResults: string; results: (n: number) => string };

  const homePicker = t.homePicker as { title: string; popular: string; allTools: string; familyTitle: string };

  const visibleTools = filterTools(tools);

  const featuredTools = useMemo(() => {

    const functional = new Set(getFunctionalToolIds());

    return FEATURED_FUNCTIONAL_ORDER.filter((id) => functional.has(id))

      .map((id) => visibleTools.find((tool) => tool.id === id))

      .filter((tool): tool is NonNullable<typeof tool> => !!tool);

  }, [visibleTools]);

  const { data: publicStats } = usePublicStats();

  const derived = getDerivedHomeStatsFromTools(visibleTools);

  const statLabels = t.homeStatLabels as {
    tools: string;
    conversionsToday: string;
    conversionsTotal: string;
    freeDaily: string;
  };

  const statValues = t.homeStatValues as { freeDaily: string; toolsLive: (live: number, total: number) => string };

  const homeStats = [

    { value: statValues.toolsLive(derived.functionalToolCount, derived.toolCount), label: statLabels.tools },

    { value: formatPublicStatCount(publicStats?.conversionsToday, locale), label: statLabels.conversionsToday },

    { value: formatPublicStatCount(publicStats?.conversionsTotal, locale), label: statLabels.conversionsTotal },

    { value: statValues.freeDaily, label: statLabels.freeDaily },

  ];



  const filteredBySearch = useMemo(() => {

    const q = search.trim().toLowerCase();

    if (!q) return visibleTools;

    return visibleTools.filter((tool) => {

      const name = (toolNames[tool.id] || tool.name).toLowerCase();

      const desc = (toolDescs[tool.id] || tool.description).toLowerCase();

      const formats = [...tool.fromFormats, ...tool.toFormats].join(" ").toLowerCase();

      return name.includes(q) || desc.includes(q) || formats.includes(q) || tool.id.includes(q);

    });

  }, [search, visibleTools, toolNames, toolDescs]);



  const gridTools = useMemo(() => {

    if (activeCategory === "all") return filteredBySearch;

    return filteredBySearch.filter((tool) => tool.category === activeCategory);

  }, [filteredBySearch, activeCategory]);



  const totalShown = gridTools.length;

  const homeJsonLd = useMemo(
    () =>
      buildHomeJsonLd({
        locale,
        brandName: t.brandName,
        homeDesc: t.seo?.homeDesc ?? "",
        faqs: t.faqs,
        navLabels: {
          "jpg-to-png": (t.toolNames as Record<string, string>)["jpg-to-png"] ?? "JPG to PNG",
          "pdf-to-word": (t.toolNames as Record<string, string>)["pdf-to-word"] ?? "PDF to Word",
          "image-compressor": (t.toolNames as Record<string, string>)["image-compressor"] ?? "Image Compressor",
          premium: (t.premium as { upgradeTo: string }).upgradeTo,
          blog: (t.footer as { blogAndGuides: string }).blogAndGuides,
        },
      }),
    [locale, t],
  );

  return (

    <AppLayout>

      <SEOHead

        title={t.seo?.homeTitle ?? ""}

        description={t.seo?.homeDesc ?? ""}

        siteName={t.brandName}

        jsonLd={homeJsonLd}

      />

      <div className="w-full">



        {/* Hero */}

        <section className="border-b border-border/80 bg-card/75 px-4 py-7 backdrop-blur-sm sm:px-6 sm:py-8 lg:py-10">

          <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto">

            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-8">

              <div className={`space-y-2 text-center ${isRtl ? "lg:text-right" : "lg:text-left"}`}>

                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t.hero.badge}</p>

                <h1 className="mx-auto max-w-xl text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl lg:mx-0 lg:max-w-2xl lg:text-4xl min-h-[2.5rem] sm:min-h-[2.75rem] lg:min-h-[2.5rem]">

                  {t.hero.title}{" "}

                  <span className="text-primary">{t.hero.titleHighlight}</span>

                </h1>

                <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground lg:mx-0">

                  {t.hero.subtitle}

                  <span className="mt-1 block">{t.hero.subtitleLine2}</span>

                </p>

              </div>



              <div className="grid w-full shrink-0 grid-cols-2 gap-2 sm:w-auto sm:grid-cols-4 sm:gap-1.5">

                {homeStats.map((s, i) => {

                  const SIcon = statIcons[i];

                  return (

                    <div

                      key={i}

                      className="flex flex-col items-center rounded border border-border bg-background px-2.5 py-2.5 text-center sm:px-2 sm:py-2"

                    >

                      <SIcon className="mb-0.5 h-3.5 w-3.5 text-primary" />

                      <p className="text-base font-bold leading-none text-foreground">{s.value}</p>

                      <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground">{s.label}</p>

                    </div>

                  );

                })}

              </div>

            </div>



            {featuredTools.length > 0 && (

              <div className="mt-6 border-t border-border/60 pt-4 sm:pt-5">

                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">

                  {homePicker.popular}

                </p>

                <div className="flex flex-wrap items-center gap-1.5">

                  {featuredTools.map((tool) => {

                    const TIcon = tool.icon;

                    return (

                      <Link

                        key={tool.id}

                        to={localePath(`/${getDefaultSlug(tool)}`, locale)}

                        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"

                      >

                        <TIcon className="h-3 w-3 shrink-0 text-muted-foreground" />

                        {toolNames[tool.id] || tool.name}

                      </Link>

                    );

                  })}

                  <a

                    href="#home-tools"

                    className="inline-flex items-center rounded-md border border-dashed border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"

                  >

                    {homePicker.allTools}

                  </a>

                </div>

              </div>

            )}

          </div>

        </section>



        {/* Main content */}

        <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pb-8 lg:pb-12 space-y-5 lg:space-y-6">



          {/* Search + filter */}

          <div id="home-tools" className="space-y-2.5 scroll-mt-16">

            <h2 className="text-sm font-bold text-foreground">{homePicker.title}</h2>

            <div className="relative">

              <Search className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground pointer-events-none" />

              <Input

                type="search"

                value={search}

                onChange={(e) => setSearch(e.target.value)}

                placeholder={homeSearch.placeholder}

                className="ps-9 pe-9 h-9 text-sm rounded-md border-border bg-card"

              />

              {search && (

                <button

                  type="button"

                  onClick={() => setSearch("")}

                  className="absolute top-1/2 -translate-y-1/2 end-3 text-muted-foreground hover:text-foreground"

                  aria-label="Clear"

                >

                  <X className="h-4 w-4" />

                </button>

              )}

            </div>

            <div className="flex flex-wrap gap-1.5">

              <button

                type="button"

                onClick={() => setCategoryFilter("all")}

                className={cn(

                  "rounded border px-2.5 py-1 text-xs font-medium transition-colors",

                  activeCategory === "all"

                    ? "border-primary bg-primary/10 text-primary"

                    : "border-border bg-card text-muted-foreground hover:text-foreground"

                )}

              >

                {homeSearch.all}

              </button>

              {categories.map((cat) => {

                const Icon = categoryIcons[cat];

                return (

                  <button

                    key={cat}

                    type="button"

                    onClick={() => setCategoryFilter(cat)}

                    className={cn(

                      "inline-flex items-center gap-1 rounded border px-2.5 py-1 text-xs font-medium transition-colors",

                      activeCategory === cat

                        ? "border-primary bg-primary/10 text-primary"

                        : "border-border bg-card text-muted-foreground hover:text-foreground"

                    )}

                  >

                    <Icon className="h-3 w-3" />

                    {catLabels[cat]}

                  </button>

                );

              })}

            </div>

            {(search || activeCategory !== "all") && (

              <p className="text-xs text-muted-foreground">{homeSearch.results(totalShown)}</p>

            )}

          </div>



          <ToolIconGrid
            tools={gridTools}
            locale={locale}
            toolNames={toolNames}
            title={homePicker.familyTitle}
            className="pt-2"
          />

          <AdSlot type="banner" slotId="home-top-banner" />

          {totalShown === 0 && (

            <p className="text-center text-sm text-muted-foreground py-8">{homeSearch.noResults}</p>

          )}



          <Suspense fallback={null}>

            <InternalToolLinks />

          </Suspense>



          <Suspense fallback={null}>

            <PremiumBanner />

          </Suspense>



          {/* Why choose us */}

          <section className="space-y-3">

            <h2 className="text-base font-bold text-foreground">{t.whyChoose}</h2>

            <div className="grid grid-cols-2 xl:grid-cols-4 gap-2">

              {(t.features as { title: string; desc: string }[]).map((f, i) => {

                const FIcon = [Shield, Zap, Globe, CheckCircle2][i];

                return (

                  <article key={i} className="rounded-md border border-border bg-card p-3 text-center space-y-1.5">

                    <FIcon className="w-4 h-4 text-primary mx-auto" />

                    <h3 className="font-semibold text-xs text-foreground">{f.title}</h3>

                    <p className="text-[11px] text-muted-foreground leading-relaxed">{f.desc}</p>

                  </article>

                );

              })}

            </div>

          </section>



          {/* Supported formats + How it works */}

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">

            <div className="space-y-3">

              <h2 className="text-base font-bold text-foreground">{t.supportedFormats}</h2>

              <div className="rounded-md border border-border bg-card divide-y divide-border overflow-hidden">

                {(t.formatCategories as { cat: string; formats: string }[]).map((f, i) => {

                  const FmtIcon = formatIcons[i];

                  return (

                    <div key={i} className="flex items-center gap-2.5 px-3 py-2">

                      <FmtIcon className="w-3.5 h-3.5 text-primary shrink-0" />

                      <span className="font-medium text-xs text-foreground w-12 shrink-0">{f.cat}</span>

                      <p className="text-[11px] text-muted-foreground font-mono">{f.formats}</p>

                    </div>

                  );

                })}

              </div>

            </div>



            <div className="space-y-3">

              <h2 className="text-base font-bold text-foreground">{t.howItWorks}</h2>

              <div className="grid grid-cols-3 gap-2">

                {(t.steps as { step: string; title: string; desc: string }[]).map((s, i) => (

                  <div key={i} className="rounded-md border border-border bg-card p-3 text-center space-y-1.5">

                    <div className="w-7 h-7 rounded border border-primary/30 bg-primary/10 text-primary font-bold text-xs flex items-center justify-center mx-auto">

                      {s.step}

                    </div>

                    <h3 className="font-semibold text-xs text-foreground">{s.title}</h3>

                    <p className="text-[10px] text-muted-foreground">{s.desc}</p>

                  </div>

                ))}

              </div>

            </div>

          </section>



          <AdSlot type="inline" slotId="home-mid-inline" />

          <Suspense fallback={null}>

            <AdNativeSlot slotId="home-mid-native" className="mt-4" />

          </Suspense>



          {/* FAQ */}

          <section className="space-y-3" itemScope itemType="https://schema.org/FAQPage">

            <h2 className="text-base font-bold text-foreground">{t.faqTitle}</h2>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-2">

              {[0, 1, 2].map((col) => (

                <div key={col} className="space-y-2">

                  {(t.faqs as { q: string; a: string }[]).slice(col * 2, col * 2 + 2).map((faq, i) => (

                    <details key={i} className="rounded-md border border-border bg-card group" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">

                      <summary className="px-3 py-2.5 cursor-pointer font-medium text-foreground text-sm flex items-center justify-between" itemProp="name">

                        {faq.q}

                        <Arrow className="w-3.5 h-3.5 text-muted-foreground transition-transform group-open:-rotate-90 shrink-0" />

                      </summary>

                      <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">

                        <p className="px-3 pb-2.5 text-sm text-muted-foreground leading-relaxed" itemProp="text">{faq.a}</p>

                      </div>

                    </details>

                  ))}

                </div>

              ))}

            </div>

          </section>

        </div>



      </div>

    </AppLayout>

  );

};



export default Index;


