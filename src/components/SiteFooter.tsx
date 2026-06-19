import { Link } from "react-router-dom";
import { BrandWordmark } from "@/components/BrandWordmark";
import { useLocale, localePath } from "@/lib/i18n";

export function SiteFooter() {
  const { locale, t } = useLocale();
  const f = t.footer;

  return (
    <footer className="relative border-t border-transparent bg-gradient-to-b from-transparent to-muted/30 pt-10 pb-8 space-y-8 max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 dark:to-muted/10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" aria-hidden />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 lg:gap-8">
        <div className="space-y-3">
          <h4 className="font-bold text-sm text-foreground">{f.popularTools}</h4>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li><Link to={localePath("/jpg-to-png", locale)} className="hover:text-foreground transition-colors">JPG → PNG</Link></li>
            <li><Link to={localePath("/png-to-jpg", locale)} className="hover:text-foreground transition-colors">PNG → JPG</Link></li>
            <li><Link to={localePath("/webp-to-jpg", locale)} className="hover:text-foreground transition-colors">WEBP → JPG</Link></li>
            <li><Link to={localePath("/svg-to-png", locale)} className="hover:text-foreground transition-colors">SVG → PNG</Link></li>
            <li><Link to={localePath("/png-to-ico", locale)} className="hover:text-foreground transition-colors">PNG → ICO</Link></li>
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="font-bold text-sm text-foreground">{f.docsAndAudio}</h4>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li><Link to={localePath("/pdf-to-docx", locale)} className="hover:text-foreground transition-colors">PDF → Word</Link></li>
            <li><Link to={localePath("/docx-to-pdf", locale)} className="hover:text-foreground transition-colors">Word → PDF</Link></li>
            <li><Link to={localePath("/merge-pdf", locale)} className="hover:text-foreground transition-colors">{t.toolNames["merge-pdf"]}</Link></li>
            <li><Link to={localePath("/mp3-to-wav", locale)} className="hover:text-foreground transition-colors">MP3 → WAV</Link></li>
            <li><Link to={localePath("/text-tools", locale)} className="hover:text-foreground transition-colors">{t.toolNames["text-tools"]}</Link></li>
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="font-bold text-sm text-foreground">{f.advancedTools}</h4>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li><Link to={localePath("/image-compressor", locale)} className="hover:text-foreground transition-colors">{t.toolNames["image-compressor"]}</Link></li>
            <li><Link to={localePath("/image-resizer", locale)} className="hover:text-foreground transition-colors">{t.toolNames["image-resizer"]}</Link></li>
            <li><Link to={localePath("/ai-image-generator", locale)} className="hover:text-foreground transition-colors">{t.toolNames["ai-image-generator"]} ✨</Link></li>
            <li><Link to={localePath("/mp4-to-avi", locale)} className="hover:text-foreground transition-colors">{t.toolNames["video-converter"]}</Link></li>
            <li><Link to={localePath("/video-compressor", locale)} className="hover:text-foreground transition-colors">{t.toolNames["video-compressor"]}</Link></li>
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="font-bold text-sm text-foreground">{f.brand}</h4>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li><Link to={localePath("/install", locale)} className="hover:text-foreground transition-colors">{f.installApp}</Link></li>
            <li><Link to={localePath("/blog", locale)} className="hover:text-foreground transition-colors">{f.blogAndGuides}</Link></li>
            <li><Link to={localePath("/terms", locale)} className="hover:text-foreground transition-colors">{f.terms}</Link></li>
            <li><Link to={localePath("/privacy", locale)} className="hover:text-foreground transition-colors">{f.privacy}</Link></li>
            <li><Link to={localePath("/contact", locale)} className="hover:text-foreground transition-colors">{f.contact}</Link></li>
            <li><Link to={localePath("/about", locale)} className="hover:text-foreground transition-colors">{f.about}</Link></li>
          </ul>
        </div>
      </div>

      {/* SEO text */}
      <div className="text-sm text-muted-foreground space-y-2 leading-relaxed pt-6 border-t border-border">
        <h2 className="text-base font-bold text-foreground">{f.seoTitle}</h2>
        <p>{f.seoText1}</p>
        <p>{f.seoText2}</p>
        <p>{f.seoText3}</p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-border">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <BrandWordmark locale={locale} size="sm" />
          <span className="text-xs text-muted-foreground">— {t.brandTagline}</span>
        </div>
        <p className="text-[11px] text-muted-foreground">{f.copyright(new Date().getFullYear())}</p>
      </div>
    </footer>
  );
}
