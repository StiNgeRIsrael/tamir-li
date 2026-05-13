import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, X, Download, ChevronDown, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BrandWordmark } from "@/components/BrandWordmark";
import { categoryIcons, getToolsByCategory, getDefaultSlug, type ToolCategory } from "@/lib/tools-data";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { UserAuthSection } from "@/components/UserAuthSection";
import { useLocale, localePath } from "@/lib/i18n";
import { useToolConfig } from "@/contexts/ToolConfigContext";
import { useAuth } from "@/contexts/AuthContext";

const categories: ToolCategory[] = ["image", "video", "audio", "document", "ai"];

export function TopNavbar() {
  const location = useLocation();
  const { locale, t } = useLocale();
  const { filterTools } = useToolConfig();
  const { user } = useAuth();
  const adminNav = t.admin as Record<string, string> | undefined;
  const [menuOpen, setMenuOpen] = useState(false);
  const [openCat, setOpenCat] = useState<ToolCategory | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
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
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-card/80 shadow-sm shadow-primary/5 backdrop-blur-md dark:bg-card/75 dark:shadow-tool-video/5">
        <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 xl:px-12">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link
              to={localePath("/", locale)}
              className="shrink-0 rounded-lg py-1 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <BrandWordmark locale={locale} size="md" />
            </Link>

            {/* Desktop category links */}
            <div className="hidden lg:flex items-center gap-1">
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
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isOpen ? "bg-primary/10 text-primary" : "text-muted-foreground dark:text-foreground/80 hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {catLabels[cat]}
                      <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>

                    {isOpen && (
                      <div
                        className="absolute top-full mt-1 w-64 bg-card border border-border rounded-xl shadow-lg py-2 z-50"
                        style={locale === "he" ? { right: 0 } : { left: 0 }}
                        onMouseLeave={() => setOpenCat(null)}
                      >
                        {catTools.map((tool) => {
                          const TIcon = tool.icon;
                          return (
                            <Link
                              key={tool.id}
                              to={localePath(`/${getDefaultSlug(tool)}`, locale)}
                              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            >
                              <TIcon className="w-4 h-4 shrink-0" />
                              <div className="min-w-0">
                                <span className="font-medium text-foreground">{toolNames[tool.id] || tool.name}</span>
                                <p className="text-xs text-muted-foreground truncate">{toolDescs[tool.id] || tool.description}</p>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2 min-w-0">
              {user?.roles?.includes("ADMIN") && (
                <Link
                  to={localePath("/admin", locale)}
                  className="hidden md:inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Shield className="h-3.5 w-3.5" />
                  {adminNav?.linkNav ?? "Admin"}
                </Link>
              )}
              <UserAuthSection />
              <LanguageSwitcher />
              <ThemeToggle />
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:flex items-center gap-1.5 text-xs"
                onClick={handleInstall}
              >
                <Download className="w-3.5 h-3.5" />
                {t.downloadApp}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-9 w-9"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 top-14 z-40 bg-background overflow-y-auto">
          <div className="px-4 py-4 space-y-4">
            {user?.roles?.includes("ADMIN") && (
              <Link
                to={localePath("/admin", locale)}
                className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground"
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
                    {catTools.map((tool) => (
                      <Link
                        key={tool.id}
                        to={localePath(`/${getDefaultSlug(tool)}`, locale)}
                        className="bg-card border border-border rounded-xl p-3 text-sm font-medium text-foreground hover:border-primary/30 transition-colors"
                      >
                        {toolNames[tool.id] || tool.name}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}

            <Button
              className="w-full bg-primary text-primary-foreground"
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
