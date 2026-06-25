export interface BreadcrumbItem {
  name: string;
  /** Omit on the current (last) crumb when it should not be a link. */
  item?: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

/** BreadcrumbList JSON-LD fragment (no @context — use inside @graph or wrap). */
export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      ...(crumb.item ? { item: crumb.item } : {}),
    })),
  };
}

/** FAQPage JSON-LD fragment; returns null when there are no FAQs. */
export function buildFaqPageJsonLd(faqs: FaqItem[]) {
  if (!faqs.length) return null;
  return {
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };
}
