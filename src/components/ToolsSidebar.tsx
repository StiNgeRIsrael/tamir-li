import { Link, useLocation } from "react-router-dom";
import { tools, categoryIcons, getDefaultSlug, getToolsByCategory, type ToolCategory } from "@/lib/tools-data";
import { Home, Crown, ChevronDown, Wrench, PanelRight, PanelRightClose } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useLocale, localePath } from "@/lib/i18n";

const categories: ToolCategory[] = ["image", "video", "audio", "document", "ai"];

export function ToolsSidebar() {
  const location = useLocation();
  const { locale, t } = useLocale();
  const catLabels = t.categories as Record<ToolCategory, string>;
  const toolNames = t.toolNames as Record<string, string>;
  const [collapsed, setCollapsed] = useState(true);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    image: true, video: true, audio: true, document: true,
  });

  const toggleCategory = (cat: string) =>
    setOpenCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));

  if (collapsed) {
    return (
      <aside className="w-14 bg-card border-s border-border h-screen sticky top-0 hidden lg:flex flex-col items-center py-3 gap-2 shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8 mb-1" onClick={() => setCollapsed(false)}>
          <PanelRight className="w-4 h-4" />
        </Button>
        <Link to={localePath("/", locale)} className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
          <Wrench className="w-4 h-4 text-primary-foreground" />
        </Link>
        <div className="flex-1" />
        <ThemeToggle />
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-card border-s border-border h-screen sticky top-0 overflow-y-auto hidden lg:flex flex-col shrink-0">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <Link to={localePath("/", locale)} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Wrench className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-foreground leading-tight">{t.brandName}</span>
            <span className="text-[10px] text-muted-foreground leading-tight">{t.brandTagline}</span>
          </div>
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
          const catTools = getToolsByCategory(cat);
          const isOpen = openCategories[cat];

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
                    return (
                      <Link
                        key={tool.id}
                        to={toolPath}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                          location.pathname === toolPath
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        {tool.premium && <Crown className="w-3 h-3 text-premium" />}
                        <span className="truncate">{toolNames[tool.id] || tool.name}</span>
                      </Link>
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
