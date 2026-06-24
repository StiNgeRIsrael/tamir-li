import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, X, Download, ChevronDown, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BrandWordmark } from "@/components/BrandWordmark";
import { categoryIcons, getToolsByCategory, getDefaultSlug, type ToolCategory } from "@/lib/tools-data";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { UserAuthSection } from "@/components/UserAuthSection";
import { UsageNavPill } from "@/components/UsageNavPill";
import { useLocale, localePath } from "@/lib/i18n";
import { useToolConfig } from "@/contexts/ToolConfigContext";
import { useAuth } from "@/contexts/AuthContext";
import { isToolFunctional } from "@/lib/tool-availability";
import { ToolSoonBadge } from "@/components/ToolSoonBadge";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const categories: ToolCategory[] = ["image", "video", "audio", "document", "ai"];

export function TopNavbar() {
  const location = useLocation();
  const { locale, t } = useLocale();
  const { filterTools } = useToolConfig();
  const { user } = useAuth();
  const adminNav = t.admin as Record<string, string> | undefined;
  const [menuOpen, setMenuOpen] = useState(false);
  const [openCat, setOpenCat] = useState<ToolCategory | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setOpenCat(null);
  }, [location.pathname]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    } else {
      window.location.href = localePath("/install", locale);
    }
  };

  const catLabels = t.categories as Record<ToolCategory, string>;
  const toolNames = t.toolNames as Record<string, string>;
  const toolDescs = t.toolDescriptions as Record<string, string>;

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-border bg-card">
        <div className="mx-auto max-w-[1920px] px-4 xl:px-6">
          <div className="flex h-12 items-center justify-between gap-4">
            <Link
              to={localePath("/", locale)}
              className="shrink-0 py-1 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <BrandWordmark locale={locale} size="md" />
            </Link>

            <div className="hidden lg:flex items-center gap-0.5">
              {categories.map((cat) => {
                const Icon = categoryIcons[cat];
                const catTools = filterTools(getToolsByCategory(cat));
                const isOpen = openCat === cat;

                if (catTools.length === 0) return null;

                return (
                  <div key={cat} className="relative">
                    <button
                      onClick={() => setOpenCat(isOpen ? null : cat)}
                      onMouseEnter={() => setOpenCat(cat)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium transition-colors border-b-2 ${
                        isOpen
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {catLabels[cat]}
                      <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>

                    {isOpen && (
                      <div
                        className="absolute top-full mt-0 w-64 border border-border bg-card shadow-md py-1 z-50"
                        style={locale === "he" ? { right: 0 } : { left: 0 }}
                        onMouseLeave={() => setOpenCat(null)}
                      >
                        {catTools.map((tool) => {
                          const TIcon = tool.icon;
                          const functional = isToolFunctional(tool.id);
                          const inner = (
                            <>
                              <TIcon className="w-3.5 h-3.5 shrink-0" />
                              <div className="min-w-0">
                                <span className="font-medium text-foreground inline-flex items-center gap-1.5">
                                  {toolNames[tool.id] || tool.name}
                                  {!functional && <ToolSoonBadge />}
                                </span>
                                <p className="text-xs text-muted-foreground truncate">{toolDescs[tool.id] || tool.description}</p>
                              </div>
                            </>
                          );
                          return functional ? (
                            <Link
                              key={tool.id}
                              to={localePath(`/${getDefaultSlug(tool)}`, locale)}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            >
                              {inner}
                            </Link>
                          ) : (
                            <div
                              key={tool.id}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground opacity-50 cursor-not-allowed"
                              aria-disabled="true"
                            >
                              {inner}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 shrink">
              {user?.roles?.includes("ADMIN") && (
                <Link
                  to={localePath("/admin", locale)}
                  className="hidden md:inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  <Shield className="h-3.5 w-3.5" />
                  {adminNav?.linkNav ?? "Admin"}
                </Link>
              )}
              <UsageNavPill />
              <UserAuthSection compact />
              <LanguageSwitcher />
              <ThemeToggle className="hidden sm:inline-flex" />
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:flex h-8 items-center gap-1.5 text-xs rounded-md"
                onClick={handleInstall}
              >
                <Download className="w-3.5 h-3.5" />
                {t.downloadApp}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-8 w-8"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label={menuOpen ? t.closeMenu : t.openMenu}
                aria-expanded={menuOpen}
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {menuOpen && (
        <div className="lg:hidden fixed inset-0 top-12 z-40 bg-background overflow-y-auto border-t border-border">
          <div className="px-4 py-4 space-y-4">
            {user?.roles?.includes("ADMIN") && (
              <Link
                to={localePath("/admin", locale)}
                className="flex items-center gap-2 border border-border bg-card px-4 py-3 text-sm font-medium text-foreground"
                onClick={() => setMenuOpen(false)}
              >
                <Shield className="h-4 w-4" />
                {adminNav?.linkNav ?? "Admin"}
              </Link>
            )}
            {categories.map((cat) => {
              const Icon = categoryIcons[cat];
              const catTools = filterTools(getToolsByCategory(cat));
              if (catTools.length === 0) return null;
              return (
                <div key={cat}>
                  <h3 className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                    <Icon className="w-3.5 h-3.5" />
                    {catLabels[cat]}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {catTools.map((tool) => {
                      const functional = isToolFunctional(tool.id);
                      const label = (
                        <span className="inline-flex items-center gap-1.5">
                          {toolNames[tool.id] || tool.name}
                          {!functional && <ToolSoonBadge />}
                        </span>
                      );
                      return functional ? (
                        <Link
                          key={tool.id}
                          to={localePath(`/${getDefaultSlug(tool)}`, locale)}
                          className="border border-border bg-card p-3 text-sm font-medium text-foreground hover:border-primary/30 transition-colors"
                        >
                          {label}
                        </Link>
                      ) : (
                        <div
                          key={tool.id}
                          className="border border-border bg-card p-3 text-sm font-medium text-muted-foreground opacity-50 cursor-not-allowed"
                          aria-disabled="true"
                        >
                          {label}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <div className="flex items-center justify-end border border-border bg-card px-4 py-2">
              <ThemeToggle />
            </div>

            <Button
              className="w-full bg-primary text-primary-foreground rounded-md"
              onClick={handleInstall}
            >
              <Download className="w-4 h-4 ml-2" />
              {t.downloadApp}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
