import { useParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { SEOHead } from "@/components/SEOHead";
import { AdSlot } from "@/components/AdSlot";
import { getBlogArticle, blogArticles } from "@/lib/blog-data";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { marked } from "marked";

export default function BlogPost() {
  const { slug } = useParams();
  const article = slug ? getBlogArticle(slug) : null;

  if (!article) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh] text-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">מאמר לא נמצא</h1>
            <Link to="/blog" className="text-primary hover:underline">חזרו לבלוג</Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const htmlContent = marked.parse(article.content) as string;

  // Get 3 related articles (not current)
  const related = blogArticles.filter(a => a.slug !== article.slug).slice(0, 3);

  return (
    <AppLayout>
      <SEOHead
        title={article.metaTitle}
        description={article.metaDescription}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": article.title,
          "description": article.metaDescription,
          "datePublished": article.date,
          "author": { "@type": "Organization", "name": "תמיר לי" },
          "publisher": { "@type": "Organization", "name": "תמיר לי" },
          "inLanguage": "he",
        }}
      />
      <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 lg:py-10">
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground transition-colors">דף הבית</Link>
          <span>/</span>
          <Link to="/blog" className="hover:text-foreground transition-colors">בלוג</Link>
          <span>/</span>
          <span className="text-foreground font-medium truncate max-w-[200px]">{article.title}</span>
        </nav>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-8">
          {/* Article */}
          <article className="min-w-0">
            <header className="space-y-3 mb-8 animate-fade-in">
              <h1 className="text-2xl lg:text-3xl xl:text-4xl font-extrabold text-foreground leading-tight">
                {article.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{article.date}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{article.readTime} דקות קריאה</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {article.keywords.slice(0, 5).map(kw => (
                  <span key={kw} className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">{kw}</span>
                ))}
              </div>
            </header>

            <AdSlot type="banner" className="mb-6" />

            {/* Article content */}
            <div
              className="prose prose-sm lg:prose-base dark:prose-invert max-w-none
                prose-headings:text-foreground prose-p:text-muted-foreground prose-p:leading-relaxed
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                prose-strong:text-foreground prose-li:text-muted-foreground
                prose-table:text-sm prose-th:bg-muted prose-th:p-2 prose-td:p-2 prose-td:border-border
                prose-code:text-primary prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                prose-pre:bg-muted prose-pre:border prose-pre:border-border"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />

            <AdSlot type="inline" className="my-8" />

            {/* Tool links */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-3 my-8">
              <h3 className="font-bold text-foreground">כלים רלוונטיים באתר</h3>
              <div className="flex flex-wrap gap-2">
                {article.toolLinks.map(link => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="text-sm bg-primary/10 text-primary px-4 py-2 rounded-lg font-medium hover:bg-primary/20 transition-colors"
                  >
                    {link.text} →
                  </Link>
                ))}
              </div>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="hidden xl:block space-y-6">
            <div className="sticky top-20 space-y-6">
              <AdSlot type="inline" />

              {/* Related articles */}
              <div className="bg-card border border-border rounded-xl p-5 space-y-3">
                <h3 className="font-bold text-sm text-foreground">מאמרים נוספים</h3>
                <div className="space-y-3">
                  {related.map(a => (
                    <Link
                      key={a.slug}
                      to={`/blog/${a.slug}`}
                      className="block text-sm text-muted-foreground hover:text-foreground transition-colors leading-snug"
                    >
                      {a.title}
                    </Link>
                  ))}
                </div>
                <Link to="/blog" className="flex items-center gap-1 text-xs text-primary font-medium hover:underline">
                  <ArrowRight className="w-3 h-3" />
                  כל המאמרים
                </Link>
              </div>

              {/* Tool links sidebar */}
              <div className="bg-card border border-border rounded-xl p-5 space-y-3">
                <h3 className="font-bold text-sm text-foreground">כלים רלוונטיים</h3>
                <div className="space-y-2">
                  {article.toolLinks.map(link => (
                    <Link
                      key={link.href}
                      to={link.href}
                      className="block text-sm text-primary hover:underline"
                    >
                      {link.text}
                    </Link>
                  ))}
                </div>
              </div>

              <AdSlot type="banner" />
            </div>
          </aside>
        </div>

        {/* Related articles (mobile) */}
        <section className="xl:hidden mt-8 space-y-4">
          <h2 className="text-lg font-bold text-foreground">מאמרים נוספים</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {related.map(a => (
              <Link
                key={a.slug}
                to={`/blog/${a.slug}`}
                className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors"
              >
                <h3 className="font-semibold text-sm text-foreground leading-snug">{a.title}</h3>
                <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{a.excerpt}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
