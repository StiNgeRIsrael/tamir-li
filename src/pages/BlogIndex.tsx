import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { SEOHead } from "@/components/SEOHead";
import { AdSlot } from "@/components/AdSlot";
import { blogArticles } from "@/lib/blog-data";
import { Calendar, Clock } from "lucide-react";
import { useLocale, localePath } from "@/lib/i18n";

export default function BlogIndex() {
  const { locale, t } = useLocale();
  const b = t.blog;

  return (
    <AppLayout>
      <SEOHead
        title={b.seoTitle}
        description={b.seoDesc}
      />
      <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8 lg:py-12 space-y-8">
        <header className="space-y-3 animate-fade-in">
          <h1 className="text-3xl lg:text-4xl font-extrabold text-foreground">{b.title}</h1>
          <p className="text-sm lg:text-base text-muted-foreground max-w-2xl">{b.subtitle}</p>
        </header>

        <AdSlot type="banner" slotId="blog-index-top" />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
          {blogArticles.map((article, i) => (
            <Link
              key={article.slug}
              to={localePath(`/blog/${article.slug}`, locale)}
              className="bg-card border border-border rounded-xl p-5 lg:p-6 hover:border-primary/30 hover:shadow-md transition-all duration-200 group space-y-3"
            >
              <h2 className="font-bold text-foreground text-sm lg:text-base group-hover:text-primary transition-colors leading-snug">
                {article.title}
              </h2>
              <p className="text-xs lg:text-sm text-muted-foreground leading-relaxed line-clamp-2">
                {article.excerpt}
              </p>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{article.date}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{b.readTime(article.readTime)}</span>
              </div>
              {i === 5 && <AdSlot type="inline" slotId="blog-index-mid" className="col-span-full" />}
            </Link>
          ))}
        </div>

        <AdSlot type="banner" slotId="blog-index-bottom" />
      </div>
    </AppLayout>
  );
}
