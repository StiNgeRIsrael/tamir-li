import { Link } from "react-router-dom";
import { tools, categoryIcons, getDefaultSlug, type ToolCategory, getToolsByCategory } from "@/lib/tools-data";
import { useToolConfig } from "@/contexts/ToolConfigContext";
import { AppLayout } from "@/components/AppLayout";
import { AdSlot } from "@/components/AdSlot";
import { PremiumBanner } from "@/components/PremiumComponents";
import { ArrowLeft, ArrowRight, Crown, Sparkles, Shield, Zap, Globe, CheckCircle2, Image, FileVideo, FileAudio, FileText, LayoutGrid, FileType2, Layers, Gift } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { HeroMediaCollage } from "@/components/HeroMediaCollage";
import { useLocale, localePath } from "@/lib/i18n";
import { getDerivedHomeStatsFromTools } from "@/lib/public-stats";

const categories: ToolCategory[] = ["image", "video", "audio", "document", "ai"];
const categoryColors: Record<ToolCategory, string> = {
  image: "bg-tool-image/10 text-tool-image border-tool-image/20",
  video: "bg-tool-video/10 text-tool-video border-tool-video/20",
  audio: "bg-tool-audio/10 text-tool-audio border-tool-audio/20",
  document: "bg-tool-document/10 text-tool-document border-tool-document/20",
  ai: "bg-premium/10 text-premium border-premium/20",
};
const categoryBg: Record<ToolCategory, string> = {
  image: "from-tool-image/15 via-tool-image/5 to-transparent",
  video: "from-tool-video/15 via-tool-video/5 to-transparent",
  audio: "from-tool-audio/15 via-tool-audio/5 to-transparent",
  document: "from-tool-document/15 via-tool-document/5 to-transparent",
  ai: "from-premium/15 via-amber-500/10 to-transparent",
};

const categoryAccentBorder: Record<ToolCategory, string> = {
  image: "border-s-tool-image/50",
  video: "border-s-tool-video/50",
  audio: "border-s-tool-audio/50",
  document: "border-s-tool-document/50",
  ai: "border-s-premium/50",
};

const statIconStyles = [
  "bg-gradient-to-br from-tool-image/30 to-primary/10 text-tool-image",
  "bg-gradient-to-br from-tool-video/30 to-tool-video/5 text-tool-video",
  "bg-gradient-to-br from-premium/35 to-amber-500/10 text-amber-600 dark:text-premium",
  "bg-gradient-to-br from-success/25 to-emerald-600/10 text-success",
];

const iconMap = [LayoutGrid, FileType2, Layers, Gift];
const formatIcons = [Image, FileVideo, FileAudio, FileText];

const Index = () => {
  const { locale, t, dir } = useLocale();
  const { filterTools } = useToolConfig();
  const isRtl = dir === "rtl";
  const Arrow = isRtl ? ArrowLeft : ArrowRight;

  const catLabels = t.categories as Record<ToolCategory, string>;
  const toolNames = t.toolNames as Record<string, string>;
  const toolDescs = t.toolDescriptions as Record<string, string>;
  const visibleTools = filterTools(tools);
  const derived = getDerivedHomeStatsFromTools(visibleTools);
  const statLabels = t.homeStatLabels as { tools: string; formats: string; categories: string; freeDaily: string };
  const statValues = t.homeStatValues as { freeDaily: string };
  const homeStats = [
    { value: String(derived.toolCount), label: statLabels.tools },
    { value: String(derived.formatCount), label: statLabels.formats },
    { value: String(derived.categoryCount), label: statLabels.categories },
    { value: statValues.freeDaily, label: statLabels.freeDaily },
  ];

  return (
    <AppLayout>
      <SEOHead
        title={t.seo?.homeTitle ?? ""}
        description={t.seo?.homeDesc ?? ""}
      />
      <div className="w-full">

        {/* Hero + collage + stats */}
        <section className="relative overflow-hidden py-8 lg:py-12 xl:py-16 px-4 animate-fade-in">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.18),transparent)] dark:bg-[radial-gradient(ellipse_70%_45%_at_50%_-10%,hsl(var(--tool-image)/0.2),transparent)]" />
          <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto relative">
            <div className="flex flex-col xl:flex-row xl:items-center xl:gap-10 2xl:gap-14">
              <div className={`xl:flex-1 text-center ${isRtl ? "xl:text-right" : "xl:text-left"} space-y-3 lg:space-y-4`}>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-gradient-to-l from-primary/15 via-tool-video/10 to-transparent px-4 py-1.5 text-xs font-semibold text-primary shadow-sm shadow-primary/10 lg:text-sm dark:from-primary/25">
                  <Sparkles className="h-3.5 w-3.5 shrink-0 text-accent lg:h-4 lg:w-4" />
                  {t.hero.badge}
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-tight text-foreground">
                  {t.hero.title}{" "}
                  <span className="hero-gradient-text">{t.hero.titleHighlight}</span>
                </h1>
                <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base lg:text-lg xl:mx-0 xl:max-w-none">
                  {t.hero.subtitle}
                  <br className="hidden sm:block" />
                  {t.hero.subtitleLine2}
                </p>
              </div>

              <HeroMediaCollage className="my-4 shrink-0 xl:my-0 xl:w-[min(100%,340px)] 2xl:w-[380px]" />

              <div className="mt-2 shrink-0 xl:mt-0 xl:w-[300px] 2xl:w-[340px]">
                <div className="grid grid-cols-2 gap-3">
                  {homeStats.map((s, i) => {
                    const SIcon = iconMap[i];
                    return (
                      <div
                        key={i}
                        className="media-card-shine flex items-center gap-3 rounded-xl border border-border/80 bg-card/80 p-3 shadow-md shadow-black/5 backdrop-blur-sm dark:bg-card/60 dark:shadow-black/20"
                      >
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg lg:h-10 lg:w-10 ${statIconStyles[i % statIconStyles.length]}`}
                        >
                          <SIcon className="h-4 w-4 lg:h-5 lg:w-5" />
                        </div>
                        <div>
                          <p className="text-lg font-extrabold leading-none text-foreground lg:text-xl">{s.value}</p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground lg:text-xs">{s.label}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main content */}
        <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pb-8 lg:pb-12 space-y-6 lg:space-y-8">

          <AdSlot type="banner" slotId="home-top-banner" />

          {/* Tools by category */}
          {categories.map((cat) => {
            const Icon = categoryIcons[cat];
            const catTools = filterTools(getToolsByCategory(cat));
            if (catTools.length === 0) return null;
            return (
              <section
                key={cat}
                className={`space-y-3 lg:space-y-4 rounded-2xl border border-border/80 bg-gradient-to-br ${categoryBg[cat]} p-4 lg:p-6 shadow-lg shadow-black/[0.03] backdrop-blur-[1px] dark:shadow-black/25 border-s-4 ${categoryAccentBorder[cat]}`}
              >
                <h2 className="text-base lg:text-lg font-bold flex items-center gap-2">
                  <div className={`w-7 h-7 lg:w-8 lg:h-8 rounded-lg flex items-center justify-center ${categoryColors[cat]}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {catLabels[cat]}
                  <span className="text-xs font-normal text-muted-foreground">{t.toolCount(catTools.length)}</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 lg:gap-3">
                  {catTools.map((tool) => {
                    const TIcon = tool.icon;
                    return (
                      <Link
                        key={tool.id}
                        to={localePath(`/${getDefaultSlug(tool)}`, locale)}
                        className="media-card-shine group flex items-center gap-2.5 rounded-xl border border-border/60 bg-card/90 p-3 shadow-sm transition-all duration-200 hover:border-primary/35 hover:bg-card hover:shadow-lg hover:shadow-primary/5 lg:p-3.5 dark:bg-card/70"
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary/5 group-hover:bg-primary/10 flex items-center justify-center shrink-0 transition-colors">
                          <TIcon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-sm text-foreground">{toolNames[tool.id] || tool.name}</span>
                            {tool.premium && <Crown className="w-3 h-3 text-premium" />}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{toolDescs[tool.id] || tool.description}</p>
                        </div>
                        <Arrow className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary shrink-0 transition-colors" />
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}

          <PremiumBanner />

          {/* Why choose us */}
          <section className="space-y-4">
            <h2 className="text-lg lg:text-xl font-bold text-foreground">{t.whyChoose}</h2>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              {(t.features as { title: string; desc: string }[]).map((f, i) => {
                const FIcon = iconMap[i];
                return (
                  <article key={i} className="bg-card border border-border rounded-xl p-3.5 lg:p-4 text-center space-y-2">
                    <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <FIcon className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-xs lg:text-sm text-foreground">{f.title}</h3>
                    <p className="text-[11px] lg:text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                  </article>
                );
              })}
            </div>
          </section>

          {/* Supported formats + How it works */}
          <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 xl:gap-8">
            <div className="space-y-4">
              <h2 className="text-lg lg:text-xl font-bold text-foreground">{t.supportedFormats}</h2>
              <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
                {(t.formatCategories as { cat: string; formats: string }[]).map((f, i) => {
                  const FmtIcon = formatIcons[i];
                  return (
                    <div key={i} className="flex items-center gap-3 p-3 lg:p-3.5">
                      <FmtIcon className="w-4 h-4 text-primary shrink-0" />
                      <span className="font-medium text-sm text-foreground w-14 shrink-0">{f.cat}</span>
                      <p className="text-[11px] lg:text-xs text-muted-foreground font-mono">{f.formats}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg lg:text-xl font-bold text-foreground">{t.howItWorks}</h2>
              <div className="grid grid-cols-3 gap-3">
                {(t.steps as { step: string; title: string; desc: string }[]).map((s, i) => (
                  <div key={i} className="bg-card border border-border rounded-xl p-3.5 lg:p-4 text-center space-y-2">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center mx-auto">
                      {s.step}
                    </div>
                    <h3 className="font-semibold text-xs lg:text-sm text-foreground">{s.title}</h3>
                    <p className="text-[11px] lg:text-xs text-muted-foreground">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <AdSlot type="inline" slotId="home-mid-inline" />

          {/* FAQ */}
          <section className="space-y-3" itemScope itemType="https://schema.org/FAQPage">
            <h2 className="text-lg lg:text-xl font-bold text-foreground">{t.faqTitle}</h2>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
              {[0, 1, 2].map((col) => (
                <div key={col} className="space-y-2">
                  {(t.faqs as { q: string; a: string }[]).slice(col * 2, col * 2 + 2).map((faq, i) => (
                    <details key={i} className="bg-card border border-border rounded-xl group" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                      <summary className="p-3 lg:p-3.5 cursor-pointer font-medium text-foreground text-sm flex items-center justify-between" itemProp="name">
                        {faq.q}
                        <Arrow className="w-3.5 h-3.5 text-muted-foreground transition-transform group-open:-rotate-90 shrink-0" />
                      </summary>
                      <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                        <p className="px-3 lg:px-3.5 pb-3 lg:pb-3.5 text-sm text-muted-foreground leading-relaxed" itemProp="text">{faq.a}</p>
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
