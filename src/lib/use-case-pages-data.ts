/** Use-case landing slugs (intent-based SEO pages linking to tools). */
export const USE_CASE_SLUGS = [
  "whatsapp-image-compress",
  "email-pdf-attach",
  "pdf-compress",
  "convert-to-pdf",
] as const;
export type UseCaseSlug = (typeof USE_CASE_SLUGS)[number];

/** Primary tool paths featured on each use-case page. */
export const USE_CASE_TOOL_LINKS: Record<UseCaseSlug, string[]> = {
  "whatsapp-image-compress": ["/image-compressor", "/jpg-to-png", "/webp-to-jpg"],
  "email-pdf-attach": ["/merge-pdf", "/docx-to-pdf", "/image-compressor"],
  "pdf-compress": ["/image-compressor", "/merge-pdf", "/docx-to-pdf"],
  "convert-to-pdf": ["/docx-to-pdf", "/word-to-pdf", "/merge-pdf"],
};

export function getUseCasePath(slug: UseCaseSlug): string {
  return `/use-cases/${slug}`;
}

export function isUseCaseSlug(value: string | undefined): value is UseCaseSlug {
  return !!value && (USE_CASE_SLUGS as readonly string[]).includes(value);
}
