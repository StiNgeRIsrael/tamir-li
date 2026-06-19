import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "@/lib/analytics/events";
import { getStoredConsent } from "@/lib/ads/consent";

const STATIC_PAGES = new Set(["install", "privacy", "terms", "about", "contact", "admin", "blog", "premium"]);

/** Strip locale prefix (/en, /es, …) for path classification. */
function pathWithoutLocale(pathname: string): string {
  const match = pathname.match(/^\/(en|es|ru|de|fr|it)(\/.*)?$/);
  if (!match) return pathname;
  return match[2] ?? "/";
}

function pageContext(pathname: string): Record<string, string> {
  const path = pathWithoutLocale(pathname);

  if (path === "/" || path === "") return { page_type: "home" };
  if (path === "/blog") return { page_type: "blog_index" };
  const blogPost = path.match(/^\/blog\/([^/]+)/);
  if (blogPost) return { page_type: "blog_post", blog_slug: blogPost[1] };
  if (path === "/premium") return { page_type: "premium" };

  const segment = path.match(/^\/([^/]+)/)?.[1];
  if (segment && !STATIC_PAGES.has(segment)) {
    return { page_type: "tool", slug: segment };
  }

  return { page_type: "other", page_segment: segment ?? "" };
}

function trackCurrentPage(pathname: string, search: string): void {
  const consent = getStoredConsent();
  if (!consent?.analytics) return;

  trackPageView({
    page_path: pathname + search,
    page_location: window.location.href,
    page_title: document.title,
    ...pageContext(pathname),
  });
}

/** Fire page_view on SPA navigations after analytics consent is granted. */
export function AnalyticsPageTracker() {
  const { pathname, search } = useLocation();
  const prevPath = useRef("");

  useEffect(() => {
    const fullPath = pathname + search;
    if (prevPath.current === fullPath) return;
    prevPath.current = fullPath;
    trackCurrentPage(pathname, search);
  }, [pathname, search]);

  useEffect(() => {
    const onConsent = () => {
      prevPath.current = "";
      trackCurrentPage(pathname, search);
      prevPath.current = pathname + search;
    };
    window.addEventListener("tamir:consent", onConsent);
    return () => window.removeEventListener("tamir:consent", onConsent);
  }, [pathname, search]);

  return null;
}
