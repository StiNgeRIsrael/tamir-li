import { Link } from "react-router-dom";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale, localePath, useT } from "@/lib/i18n";
import { getFunctionalToolIds } from "@/lib/tool-availability";
import { getToolById, getDefaultSlug } from "@/lib/tools-data";

interface ComingSoonPanelProps {
  toolName?: string;
  toolId?: string;
}

export function ComingSoonPanel({ toolName, toolId }: ComingSoonPanelProps) {
  const { locale } = useLocale();
  const t = useT();
  const tt = t.tool as {
    comingSoonTitle: string;
    comingSoonMessage: (name: string) => string;
    comingSoonAlternatives: string;
    comingSoonPdfWordHint: string;
    comingSoonPdfWordCta: string;
    comingSoonVideoHint: string;
    comingSoonVideoCta: string;
    backHome: string;
  };
  const toolNames = t.toolNames as Record<string, string>;

  const toolAlt =
    toolId === "pdf-to-word"
      ? (() => {
          const wordToPdf = getToolById("word-to-pdf");
          if (!wordToPdf) return null;
          return {
            slug: getDefaultSlug(wordToPdf),
            hint: tt.comingSoonPdfWordHint,
            cta: tt.comingSoonPdfWordCta,
          };
        })()
      : toolId === "video-converter" || toolId === "video-compressor"
        ? (() => {
            const audio = getToolById("audio-converter");
            if (!audio) return null;
            return {
              slug: getDefaultSlug(audio),
              hint: tt.comingSoonVideoHint,
              cta: tt.comingSoonVideoCta,
            };
          })()
        : null;

  const alternatives = getFunctionalToolIds()
    .map((id) => {
      const tool = getToolById(id);
      if (!tool) return null;
      return { id, name: toolNames[id] || tool.name, slug: getDefaultSlug(tool) };
    })
    .filter((item): item is { id: string; name: string; slug: string } => item !== null)
    .filter((alt) => !toolAlt || alt.slug !== toolAlt.slug);

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center space-y-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <Clock className="h-7 w-7 text-muted-foreground" />
      </div>
      <div className="space-y-2 max-w-md">
        <h2 className="text-xl font-bold text-foreground">{tt.comingSoonTitle}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {tt.comingSoonMessage(toolName ?? "")}
        </p>
      </div>
      {toolAlt && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm space-y-3 max-w-md w-full">
          <p className="text-muted-foreground leading-relaxed">{toolAlt.hint}</p>
          <Button size="sm" asChild className="w-full sm:w-auto">
            <Link to={localePath(`/${toolAlt.slug}`, locale)}>{toolAlt.cta}</Link>
          </Button>
        </div>
      )}
      {alternatives.length > 0 && (
        <div className="space-y-3 max-w-md w-full">
          <h3 className="text-sm font-semibold text-foreground">{tt.comingSoonAlternatives}</h3>
          <div className="flex flex-wrap justify-center gap-2">
            {alternatives.map((alt) => (
              <Link
                key={alt.id}
                to={localePath(`/${alt.slug}`, locale)}
                className="text-xs px-3 py-1.5 rounded-full border border-border bg-card text-foreground hover:border-primary/30 hover:text-primary transition-colors"
              >
                {alt.name}
              </Link>
            ))}
          </div>
        </div>
      )}
      <Button variant="outline" asChild>
        <Link to={localePath("/", locale)}>{tt.backHome}</Link>
      </Button>
    </div>
  );
}
