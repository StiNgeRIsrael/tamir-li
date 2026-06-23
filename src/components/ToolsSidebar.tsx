import { Link, useLocation } from "react-router-dom";
import { categoryIcons, getDefaultSlug, getToolsByCategory, type ToolCategory } from "@/lib/tools-data";
import { useToolConfig } from "@/contexts/ToolConfigContext";
import { Home, Crown, ChevronDown, PanelRight, PanelRightClose } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useLocale, localePath } from "@/lib/i18n";
import { BrandWordmark } from "@/components/BrandWordmark";
import { isToolFunctional } from "@/lib/tool-availability";
import { ToolSoonBadge } from "@/components/ToolSoonBadge";
import { cn } from "@/lib/utils";

const categories: ToolCategory[] = ["image", "video", "audio", "document", "ai"];

export function ToolsSidebar() {
  const location = useLocation();
  const { locale, t } = useLocale();
  const { filterTools } = useToolConfig();
  const catLabels = t.categories as Record<ToolCategory, string>;
  const toolNames = t.toolNames as Record<string, string>;
  const [collapsed, setCollapsed] = useState(true);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    image: true, video: true, audio: true, document: true, ai: true,
  });

  const toggleCategory = (cat: string) =>
    setOpenCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));

  if (collapsed) {
    return (
      <aside className="w-14 bg-card border-s border-border h-screen sticky top-0 hidden lg:flex flex-col items-center py-3 gap-2 shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8 mb-1" onClick={() => setCollapsed(false)}>
          <PanelRight className="w-4 h-4" />
        </Button>
        <Link
          to={localePath("/", locale)}
          className="flex w-9 flex-col items-center justify-center rounded-lg border border-border/80 bg-card px-1 py-1.5 shadow-sm"
          title={t.brandName}
        >
          <BrandWordmark locale={locale} size="sm" className="scale-[0.72] leading-none" />
        </Link>
        <div className="flex-1" />
        <ThemeToggle />
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-card border-s border-border h-screen sticky top-0 overflow-y-auto hidden lg:flex flex-col shrink-0">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <Link to={localePath("/", locale)} className="flex min-w-0 flex-col gap-0.5">
          <BrandWordmark locale={locale} size="sm" className="leading-none" />
          <span className="text-[10px] leading-tight text-muted-foreground">{t.brandTagline}</span>
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCollapsed(true)}>
            <PanelRightClose className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        <Link
          to={localePath("/", locale)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            location.pathname === "/" || location.pathname === `/${locale}`
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Home className="w-4 h-4" />
          {t.sidebarHome}
        </Link>

        {categories.map((cat) => {
          const Icon = categoryIcons[cat];
          const catTools = filterTools(getToolsByCategory(cat));
          const isOpen = openCategories[cat];

          if (catTools.length === 0) return null;

          return (
            <div key={cat}>
              <button
                onClick={() => toggleCategory(cat)}
                className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  {catLabels[cat]}
                </div>
                <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "" : "-rotate-90"}`} />
              </button>

              {isOpen && (
                <div className="ms-4 space-y-0.5 mt-0.5">
                  {catTools.map((tool) => {
                    const toolSlug = getDefaultSlug(tool);
                    const toolPath = localePath(`/${toolSlug}`, locale);
                    const functional = isToolFunctional(tool.id);
                    const label = (
                      <>
                        {tool.premium && <Crown className="w-3 h-3 text-premium" />}
                        <span className="truncate inline-flex items-center gap-1.5">
                          {toolNames[tool.id] || tool.name}
                          {!functional && <ToolSoonBadge />}
                        </span>
                      </>
                    );
                    return functional ? (
                      <Link
                        key={tool.id}
                        to={toolPath}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors",
                          location.pathname === toolPath
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        {label}
                      </Link>
                    ) : (
                      <div
                        key={tool.id}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-muted-foreground opacity-50 cursor-not-allowed"
                        aria-disabled="true"
                      >
                        {label}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border">
        <Link to={localePath("/premium", locale)} className="premium-banner p-3 text-center block">
          <Crown className="w-5 h-5 mx-auto mb-1" />
          <p className="text-xs font-bold">{t.sidebarUpgrade}</p>
          <p className="text-[10px] opacity-80 mt-0.5">{t.sidebarNoAds}</p>
        </Link>
      </div>
    </aside>
  );
}
