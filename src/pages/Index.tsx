import { Link } from "react-router-dom";
import { getPopularTools, tools, categoryLabels, categoryIcons, type ToolCategory, getToolsByCategory } from "@/lib/tools-data";
import { AppLayout } from "@/components/AppLayout";
import { AdSlot } from "@/components/AdSlot";
import { PremiumBanner, UsageLimitNotice } from "@/components/PremiumComponents";
import { ArrowLeft, Crown, Sparkles, Wrench } from "lucide-react";

const categories: ToolCategory[] = ["image", "video", "audio", "document"];
const categoryColors: Record<ToolCategory, string> = {
  image: "bg-tool-image/10 text-tool-image",
  video: "bg-tool-video/10 text-tool-video",
  audio: "bg-tool-audio/10 text-tool-audio",
  document: "bg-tool-document/10 text-tool-document",
};

const Index = () => {
  const popular = getPopularTools();

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 lg:py-12 space-y-10">
        {/* Hero */}
        <section className="text-center space-y-4 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full">
            <Sparkles className="w-4 h-4" />
            כלים חינמיים להמרת קבצים
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-foreground leading-tight">
            תמיר לי
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            המרה מהירה בין פורמטים של תמונות, וידאו, אודיו ומסמכים. 
            גרור קבצים, בחר פורמט, וסיימת.
          </p>
        </section>

        <AdSlot type="banner" />

        {/* Popular Tools */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            כלים פופולריים
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {popular.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link key={tool.id} to={`/tool/${tool.id}`} className="tool-card group">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${categoryColors[tool.category]}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{tool.name}</h3>
                        {tool.premium && <Crown className="w-3.5 h-3.5 text-premium" />}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{tool.description}</p>
                    </div>
                    <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Categories */}
        {categories.map((cat) => {
          const Icon = categoryIcons[cat];
          const catTools = getToolsByCategory(cat);
          return (
            <section key={cat} className="space-y-3">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Icon className="w-5 h-5" />
                {categoryLabels[cat]}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {catTools.map((tool) => {
                  const TIcon = tool.icon;
                  return (
                    <Link key={tool.id} to={`/tool/${tool.id}`} className="tool-card group">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${categoryColors[tool.category]}`}>
                          <TIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-sm text-foreground">{tool.name}</h3>
                            {tool.premium && <Crown className="w-3 h-3 text-premium" />}
                          </div>
                          <p className="text-xs text-muted-foreground">{tool.description}</p>
                        </div>
                        <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                      </div>
                    </Link>
                  );
                })}
              </div>
              {cat === "image" && <AdSlot type="inline" />}
            </section>
          );
        })}

        {/* Premium Banner */}
        <PremiumBanner />

        {/* Usage */}
        <UsageLimitNotice used={3} max={5} />

        {/* Footer */}
        <footer className="text-center text-sm text-muted-foreground py-6 border-t border-border">
          <p>© 2026 תמיר לי • כל הזכויות שמורות</p>
        </footer>
      </div>
    </AppLayout>
  );
};

export default Index;
