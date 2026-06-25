import { getToolSeoContent, getToolDirectAnswer } from "@/lib/tool-seo-content";
import { buildFaqPageJsonLd } from "@/lib/structured-data";
import { useLocale } from "@/lib/i18n";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ToolSeoBlocksProps {
  toolId: string;
}

export function ToolSeoBlocks({ toolId }: ToolSeoBlocksProps) {
  const { locale, t } = useLocale();
  const content = getToolSeoContent(toolId, locale);
  if (!content) return null;

  const directAnswer = getToolDirectAnswer(content);
  const labels = t.toolSeoBlocks as {
    faqTitle: string;
    comparisonTitle: string;
  };

  return (
    <div className="space-y-6">
      {directAnswer && (
        <section className="rounded-md border border-border bg-muted/30 p-4 lg:p-5">
          <p className="text-sm leading-relaxed text-foreground">{directAnswer}</p>
        </section>
      )}

      {content.formatComparison && content.comparisonHeaders && (
        <section className="space-y-3">
          <h2 className="text-base font-bold text-foreground lg:text-lg">{labels.comparisonTitle}</h2>
          <div className="overflow-x-auto rounded-md border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="text-xs font-semibold">{content.comparisonHeaders.format}</TableHead>
                  <TableHead className="text-xs font-semibold">{content.comparisonHeaders.bestFor}</TableHead>
                  <TableHead className="hidden sm:table-cell text-xs font-semibold">{content.comparisonHeaders.size}</TableHead>
                  <TableHead className="hidden md:table-cell text-xs font-semibold">{content.comparisonHeaders.quality}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {content.formatComparison.map((row) => (
                  <TableRow key={row.format}>
                    <TableCell className="font-mono text-xs font-semibold text-foreground">{row.format}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{row.bestFor}</TableCell>
                    <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">{row.size}</TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{row.quality}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      {content.faqs.length > 0 && (
        <section className="space-y-3" itemScope itemType="https://schema.org/FAQPage">
          <h2 className="text-base font-bold text-foreground lg:text-lg">{labels.faqTitle}</h2>
          <div className="divide-y divide-border rounded-md border border-border bg-card">
            {content.faqs.map((faq, i) => (
              <details key={i} className="group" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/30" itemProp="name">
                  {faq.q}
                </summary>
                <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                  <p className="px-4 pb-3 text-sm leading-relaxed text-muted-foreground" itemProp="text">{faq.a}</p>
                </div>
              </details>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/** FAQ JSON-LD fragment for top tools. */
export function toolFaqJsonLd(toolId: string, locale: import("@/lib/i18n").Locale) {
  const content = getToolSeoContent(toolId, locale);
  if (!content?.faqs.length) return null;
  return buildFaqPageJsonLd(content.faqs);
}
