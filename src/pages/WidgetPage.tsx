import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { SEOHead } from "@/components/SEOHead";
import { useLocale, localePath } from "@/lib/i18n";
import { enTranslations } from "@/lib/translations/en";
import { siteUrl } from "@/lib/site";
import { Button } from "@/components/ui/button";

const DEFAULT_TOOL = "/jpg-to-png";

export default function WidgetPage() {
  const { locale, t } = useLocale();
  const w = t.widgetPage ?? enTranslations.widgetPage;
  const toolPath = localePath(DEFAULT_TOOL, locale);
  const toolUrl = siteUrl(toolPath);
  const embedCode = `<iframe src="${toolUrl}" title="${w.iframeTitle}" width="100%" height="520" style="border:0;border-radius:12px;max-width:640px" loading="lazy" allow="clipboard-write"></iframe>`;

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <AppLayout>
      <SEOHead title={w.seoTitle} description={w.seoDesc} />
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 lg:py-12">
        <header className="space-y-3">
          <h1 className="text-3xl font-extrabold text-foreground">{w.title}</h1>
          <p className="text-base leading-relaxed text-muted-foreground">{w.intro}</p>
        </header>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">{w.previewTitle}</h2>
          <div className="overflow-hidden rounded-xl border border-border bg-muted/30 p-4">
            <iframe
              src={toolUrl}
              title={w.iframeTitle}
              className="mx-auto w-full max-w-[640px] rounded-lg border-0"
              style={{ height: 480 }}
              loading="lazy"
            />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">{w.codeTitle}</h2>
          <pre className="overflow-x-auto rounded-xl border border-border bg-card p-4 text-xs text-foreground whitespace-pre-wrap break-all">
            {embedCode}
          </pre>
          <Button type="button" size="sm" onClick={handleCopy}>
            {copied ? w.copied : w.copyButton}
          </Button>
          <p className="text-xs text-muted-foreground">{w.attribution}</p>
        </section>

        <section className="space-y-2 text-sm text-muted-foreground">
          <h2 className="text-lg font-bold text-foreground">{w.termsTitle}</h2>
          <p>{w.termsBody}</p>
        </section>
      </div>
    </AppLayout>
  );
}
