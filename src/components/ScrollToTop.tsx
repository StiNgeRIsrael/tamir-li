import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export function ScrollToTop() {
  const { pathname } = useLocation();
  const prevPath = useRef(pathname);

  useEffect(() => {
    // Only scroll to top when navigating to a genuinely different page
    // Skip for format slug changes within the same tool (e.g. jpg-to-png → jpg-to-webp)
    const prev = prevPath.current;
    prevPath.current = pathname;

    // Same path — no scroll
    if (prev === pathname) return;

    // Both are tool pages (single segment like /jpg-to-png) — don't scroll
    const isToolPage = (p: string) => /^\/[a-z0-9-]+$/.test(p) && p !== "/install";
    if (isToolPage(prev) && isToolPage(pathname)) return;

    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
