import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { NativeHomeMonetization } from "@/components/NativeHomeMonetization";
import { NativeToolGrid } from "@/components/NativeToolGrid";
import { Input } from "@/components/ui/input";
import { useToolConfig } from "@/contexts/ToolConfigContext";
import { useLocale } from "@/lib/i18n";
import { parsePreferredCategory } from "@/lib/profile-category";
import { categoryIcons, tools, type Tool, type ToolCategory } from "@/lib/tools-data";
import { cn } from "@/lib/utils";
import { enTranslations } from "@/lib/translations/en";

const TOOL_CATEGORIES: ToolCategory[] = ["image", "video", "audio", "document", "ai"];

function parseCategoryParam(value: string | null): ToolCategory | "all" {
  if (value && TOOL_CATEGORIES.includes(value as ToolCategory)) {
    return value as ToolCategory;
  }
  return "all";
}

function sortToolsByPreference(list: Tool[], preferred: ToolCategory | null): Tool[] {
  if (!preferred) return list;
  const preferredTools = list.filter((tool) => tool.category === preferred);
  const rest = list.filter((tool) => tool.category !== preferred);
  return [...preferredTools, ...rest];
}

/** Tools-first native home — search, category pills, personalized greeting. */
export function NativeHomeView() {
  const { locale, t } = useLocale();
  const { user } = useAuth();
  const { filterTools } = useToolConfig();
  const [searchParams, setSearchParams] = useSearchParams();

  const nativeCopy =
    (t as { nativeHome?: typeof enTranslations.nativeHome }).nativeHome ?? enTranslations.nativeHome;

  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const [activeCategory, setActiveCategory] = useState<ToolCategory | "all">(() =>
    parseCategoryParam(searchParams.get("category"))
  );

  const toolNames = t.toolNames as Record<string, string>;
  const toolDescs = t.toolDescriptions as Record<string, string>;
  const catLabels = t.categories as Record<ToolCategory, string>;
  const homePicker = t.homePicker as { title: string };
  const homeSearch = t.homeSearch as {
    placeholder: string;
    all: string;
    results: (n: number) => string;
    noResults: string;
  };

  const preferredCategory = parsePreferredCategory(user?.preferredCategory);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    const q = search.trim();
    if (q) next.set("q", q);
    else next.delete("q");
    if (activeCategory !== "all") next.set("category", activeCategory);
    else next.delete("category");
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [search, activeCategory, searchParams, setSearchParams]);

  const visibleTools = useMemo(() => filterTools(tools), [filterTools]);

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
    const base =
      activeCategory === "all"
        ? filteredBySearch
        : filteredBySearch.filter((tool) => tool.category === activeCategory);
    return sortToolsByPreference(base, preferredCategory);
  }, [filteredBySearch, activeCategory, preferredCategory]);

  const greetingName = user?.displayName?.trim() || null;

  return (
    <div className="w-full pb-6">
      <section className="border-b border-border/80 bg-card/75 px-4 py-5 backdrop-blur-sm sm:px-6">
        <div className="mx-auto max-w-7xl space-y-1">
          <p className="text-sm font-semibold text-foreground">
            {greetingName ? nativeCopy.greeting(greetingName) : nativeCopy.greetingAnonymous}
          </p>
          <p className="text-xs text-muted-foreground">{nativeCopy.subtitle}</p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-5 px-4 pt-4 sm:px-6 lg:px-8">
        <NativeHomeMonetization className="native-home-monetization" />

        <div id="home-tools" className="scroll-mt-16 space-y-2.5">
          <h2 className="text-sm font-bold text-foreground">{homePicker.title}</h2>

          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={homeSearch.placeholder}
              className="h-11 rounded-md border-border bg-card ps-9 pe-9 text-sm"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveCategory("all")}
              className={cn(
                "min-h-[40px] rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                activeCategory === "all"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              {homeSearch.all}
            </button>
            {TOOL_CATEGORIES.map((cat) => {
              const Icon = categoryIcons[cat];
              const isPreferred = preferredCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "inline-flex min-h-[40px] items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    activeCategory === cat
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:text-foreground",
                    isPreferred && activeCategory !== cat && "ring-1 ring-primary/30"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {catLabels[cat]}
                </button>
              );
            })}
          </div>

          {(search || activeCategory !== "all") && (
            <p className="text-xs text-muted-foreground">{homeSearch.results(gridTools.length)}</p>
          )}
        </div>

        <NativeToolGrid
          tools={gridTools}
          locale={locale}
          toolNames={toolNames}
          title={homePicker.title}
          className="pt-2"
        />

        {gridTools.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">{homeSearch.noResults}</p>
        )}
      </div>
    </div>
  );
}
