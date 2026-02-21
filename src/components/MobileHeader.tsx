import { Link } from "react-router-dom";
import { Menu, Wrench, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getToolsByCategory, getDefaultSlug, type ToolCategory } from "@/lib/tools-data";
import { useLocale, localePath } from "@/lib/i18n";

const categories: ToolCategory[] = ["image", "video", "audio", "document", "ai"];

export function MobileHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { locale, t } = useLocale();
  const catLabels = t.categories as Record<ToolCategory, string>;
  const toolNames = t.toolNames as Record<string, string>;

  return (
    <>
      <header className="lg:hidden sticky top-0 z-50 bg-card/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between px-4 h-14 gap-2">
          <Link to={localePath("/", locale)} className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <Wrench className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground whitespace-nowrap">{t.brandName}</span>
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="lg:hidden fixed inset-0 top-14 z-40 bg-background overflow-y-auto px-4 py-4">
          {categories.map((cat) => (
            <div key={cat} className="mb-6">
              <h3 className="text-sm font-bold text-muted-foreground mb-2">{catLabels[cat]}</h3>
              <div className="flex flex-col gap-2">
                {getToolsByCategory(cat).map((tool) => (
                    <Link
                      key={tool.id}
                      to={localePath(`/${getDefaultSlug(tool)}`, locale)}
                      onClick={() => setMenuOpen(false)}
                      className="tool-card p-3 text-sm font-medium"
                    >
                      {toolNames[tool.id] || tool.name}
                    </Link>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
