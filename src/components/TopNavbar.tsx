import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, Wrench, X, Download, ChevronDown, Image, FileVideo, FileAudio, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { categoryLabels, categoryIcons, getToolsByCategory, getDefaultSlug, type ToolCategory } from "@/lib/tools-data";

const categories: ToolCategory[] = ["image", "video", "audio", "document", "ai"];

export function TopNavbar() {
  const location = useLocation();
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
      window.location.href = "/install";
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 xl:px-12">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Wrench className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg text-foreground hidden sm:inline">תמיר לי</span>
            </Link>

            {/* Desktop category links */}
            <div className="hidden lg:flex items-center gap-1">
              {categories.map((cat) => {
                const Icon = categoryIcons[cat];
                const catTools = getToolsByCategory(cat);
                const isOpen = openCat === cat;

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
                      {categoryLabels[cat]}
                      <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>

                    {isOpen && (
                      <div
                        className="absolute top-full right-0 mt-1 w-64 bg-card border border-border rounded-xl shadow-lg py-2 z-50"
                        onMouseLeave={() => setOpenCat(null)}
                      >
                        {catTools.map((tool) => {
                          const TIcon = tool.icon;
                          return (
                            <Link
                              key={tool.id}
                              to={`/${getDefaultSlug(tool)}`}
                              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            >
                              <TIcon className="w-4 h-4 shrink-0" />
                              <div className="min-w-0">
                                <span className="font-medium text-foreground">{tool.name}</span>
                                <p className="text-xs text-muted-foreground truncate">{tool.description}</p>
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
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:flex items-center gap-1.5 text-xs"
                onClick={handleInstall}
              >
                <Download className="w-3.5 h-3.5" />
                הורד אפליקציה
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
            {categories.map((cat) => {
              const Icon = categoryIcons[cat];
              const catTools = getToolsByCategory(cat);
              return (
                <div key={cat}>
                  <h3 className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                    <Icon className="w-3.5 h-3.5" />
                    {categoryLabels[cat]}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {catTools.map((tool) => (
                      <Link
                        key={tool.id}
                        to={`/${getDefaultSlug(tool)}`}
                        className="bg-card border border-border rounded-xl p-3 text-sm font-medium text-foreground hover:border-primary/30 transition-colors"
                      >
                        {tool.name}
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
              הורד אפליקציה
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
