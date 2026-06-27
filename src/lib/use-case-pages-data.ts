/** Use-case landing slugs (intent-based SEO pages linking to tools). */
export const USE_CASE_SLUGS = [
  "whatsapp-image-compress",
  "email-pdf-attach",
  "pdf-compress",
  "convert-to-pdf",
  "video-whatsapp",
  "heic-iphone",
  "scanned-pdf-hebrew",
  "merge-invoices",
  "pdf-email-compress",
  "whatsapp",
] as const;
export type UseCaseSlug = (typeof USE_CASE_SLUGS)[number];

/** Sprint root URLs → use-case slug (canonical path is the root URL). */
export const ROOT_USE_CASE_PATHS: Record<string, UseCaseSlug> = {
  "compress-video-for-whatsapp": "video-whatsapp",
  "convert-heic-to-jpg-iphone": "heic-iphone",
  "convert-scanned-pdf-hebrew": "scanned-pdf-hebrew",
  "merge-pdf-invoice": "merge-invoices",
  "compress-pdf-for-email": "pdf-email-compress",
};

/** Primary tool paths featured on each use-case page. */
export const USE_CASE_TOOL_LINKS: Record<UseCaseSlug, string[]> = {
  "whatsapp-image-compress": ["/image-compressor", "/jpg-to-png", "/webp-to-jpg"],
  "email-pdf-attach": ["/merge-pdf", "/docx-to-pdf", "/image-compressor"],
  "pdf-compress": ["/image-compressor", "/merge-pdf", "/docx-to-pdf"],
  "convert-to-pdf": ["/docx-to-pdf", "/merge-pdf", "/text-tools"],
  "video-whatsapp": ["/video-compressor", "/mp4-to-avi", "/mov-to-mp4"],
  "heic-iphone": ["/jpg-to-png", "/image-compressor", "/png-to-jpg"],
  "scanned-pdf-hebrew": ["/hebrew-ocr", "/merge-pdf", "/pdf-to-docx"],
  "merge-invoices": ["/merge-pdf", "/docx-to-pdf", "/use-cases/pdf-compress"],
  "pdf-email-compress": ["/merge-pdf", "/docx-to-pdf", "/image-compressor"],
  whatsapp: [
    "/video-compressor",
    "/image-compressor",
    "/compress-video-for-whatsapp",
    "/convert-heic-to-jpg-iphone",
  ],
};

export function getUseCasePath(slug: UseCaseSlug): string {
  return `/use-cases/${slug}`;
}

/** Public canonical path — root alias when defined, else /use-cases/:slug. */
export function getUseCasePublicPath(slug: UseCaseSlug): string {
  const root = Object.entries(ROOT_USE_CASE_PATHS).find(([, s]) => s === slug)?.[0];
  return root ? `/${root}` : getUseCasePath(slug);
}

export function isUseCaseSlug(value: string | undefined): value is UseCaseSlug {
  return !!value && (USE_CASE_SLUGS as readonly string[]).includes(value);
}

export function resolveRootUseCaseSlug(pathSegment: string): UseCaseSlug | undefined {
  return ROOT_USE_CASE_PATHS[pathSegment];
}

export function collectRootUseCasePaths(): string[] {
  return Object.keys(ROOT_USE_CASE_PATHS).map((k) => `/${k}`);
}
