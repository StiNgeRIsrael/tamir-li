import { Link } from "react-router-dom";
import { useLocale, localePath } from "@/lib/i18n";
import { buildFormatSlug, getToolByFormatSlug, getToolById } from "@/lib/tools-data";
import { isToolFunctional } from "@/lib/tool-availability";
import { ToolSoonBadge } from "@/components/ToolSoonBadge";

interface LinkGroup {
  title: string;
  links: { label: string; slug: string }[];
}

const LINK_GROUPS: LinkGroup[] = [
  {
    title: "image",
    links: [
      { label: "JPG → PNG", slug: buildFormatSlug("JPG", "PNG") },
      { label: "PNG → JPG", slug: buildFormatSlug("PNG", "JPG") },
      { label: "WEBP → JPG", slug: buildFormatSlug("WEBP", "JPG") },
      { label: "SVG → PNG", slug: buildFormatSlug("SVG", "PNG") },
      { label: "PNG → ICO", slug: buildFormatSlug("PNG", "ICO") },
    ],
  },
  {
    title: "document",
    links: [
      { label: "PDF → Word", slug: buildFormatSlug("PDF", "DOCX") },
      { label: "Word → PDF", slug: buildFormatSlug("DOCX", "PDF") },
      { label: "merge-pdf", slug: "merge-pdf" },
      { label: "text-tools", slug: "text-tools" },
    ],
  },
  {
    title: "audio",
    links: [
      { label: "MP3 → WAV", slug: buildFormatSlug("MP3", "WAV") },
      { label: "WAV → MP3", slug: buildFormatSlug("WAV", "MP3") },
      { label: "FLAC → MP3", slug: buildFormatSlug("FLAC", "MP3") },
    ],
  },
  {
    title: "video",
    links: [
      { label: "MP4 → AVI", slug: buildFormatSlug("MP4", "AVI") },
      { label: "MOV → MP4", slug: buildFormatSlug("MOV", "MP4") },
      { label: "video-compressor", slug: "video-compressor" },
    ],
  },
];

function getToolIdFromSlug(slug: string): string | null {
  const formatMatch = getToolByFormatSlug(slug);
  if (formatMatch) return formatMatch.tool.id;
  return getToolById(slug)?.id ?? null;
}

export function InternalToolLinks() {
  const { locale, t } = useLocale();
  const labels = t.internalLinks as {
    title: string;
    image: string;
    document: string;
    audio: string;
    video: string;
  };
  const catLabels: Record<string, string> = {
    image: labels.image,
    document: labels.document,
    audio: labels.audio,
    video: labels.video,
  };

  return (
    <section className="space-y-3" aria-label={labels.title}>
      <h2 className="text-base font-bold text-foreground lg:text-lg">{labels.title}</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {LINK_GROUPS.map((group) => (
          <div key={group.title} className="rounded-md border border-border bg-card p-3 space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {catLabels[group.title]}
            </h3>
            <ul className="space-y-1">
              {group.links.map((link) => {
                const toolId = getToolIdFromSlug(link.slug);
                const functional = toolId ? isToolFunctional(toolId) : false;
                const displayLabel = link.label.includes("→")
                  ? link.label
                  : (t.toolNames as Record<string, string>)[link.label] ?? link.label;

                return (
                  <li key={link.slug}>
                    <Link
                      to={localePath(`/${link.slug}`, locale)}
                      className="inline-flex items-center gap-1.5 text-xs text-foreground/80 hover:text-primary transition-colors"
                    >
                      {displayLabel}
                      {!functional && <ToolSoonBadge />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
