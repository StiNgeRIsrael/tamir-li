import { Link } from "react-router-dom";
import { Menu, Wrench, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { tools, categoryLabels, type ToolCategory } from "@/lib/tools-data";

const categories: ToolCategory[] = ["image", "video", "audio", "document"];

export function MobileHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="lg:hidden sticky top-0 z-50 bg-card/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Wrench className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">תמיר לי</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </header>

      {menuOpen && (
        <div className="lg:hidden fixed inset-0 top-14 z-40 bg-background/98 backdrop-blur overflow-y-auto p-4">
          {categories.map((cat) => (
            <div key={cat} className="mb-4">
              <h3 className="text-sm font-bold text-muted-foreground mb-2">{categoryLabels[cat]}</h3>
              <div className="grid grid-cols-2 gap-2">
                {tools
                  .filter((t) => t.category === cat)
                  .map((tool) => (
                    <Link
                      key={tool.id}
                      to={`/tool/${tool.id}`}
                      onClick={() => setMenuOpen(false)}
                      className="tool-card p-3 text-sm font-medium"
                    >
                      {tool.name}
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
