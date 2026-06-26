/** Comparison rows for competitor alternative landing pages (honest feature tables). */
export interface AlternativeComparisonRow {
  featureKey: string;
  tamir: string;
  competitor: string;
}

export const FREECONVERT_COMPARISON_ROWS: AlternativeComparisonRow[] = [
  { featureKey: "hebrewUi", tamir: "yes", competitor: "no" },
  { featureKey: "freeDaily", tamir: "5", competitor: "25" },
  { featureKey: "browserProcessing", tamir: "many", competitor: "upload" },
  { featureKey: "signupFree", tamir: "no", competitor: "optional" },
  { featureKey: "premiumPrice", tamir: "ils", competitor: "usd" },
  { featureKey: "adsFree", tamir: "yes", competitor: "yes" },
  { featureKey: "fileSizeFree", tamir: "50mb", competitor: "1gb" },
  { featureKey: "aiTools", tamir: "premium", competitor: "limited" },
];

export const CONVERTIO_COMPARISON_ROWS: AlternativeComparisonRow[] = [
  { featureKey: "hebrewUi", tamir: "yes", competitor: "no" },
  { featureKey: "hebrewOcr", tamir: "soon", competitor: "limited" },
  { featureKey: "freeDaily", tamir: "5", competitor: "10" },
  { featureKey: "premiumPrice", tamir: "ils", competitor: "usd" },
  { featureKey: "rtlSupport", tamir: "yes", competitor: "no" },
  { featureKey: "browserProcessing", tamir: "many", competitor: "upload" },
  { featureKey: "fileSizeFree", tamir: "50mb", competitor: "100mb" },
];

export const ILOVEPDF_COMPARISON_ROWS: AlternativeComparisonRow[] = [
  { featureKey: "hebrewUi", tamir: "yes", competitor: "no" },
  { featureKey: "hebrewOcr", tamir: "soon", competitor: "no" },
  { featureKey: "freeDaily", tamir: "5", competitor: "limited" },
  { featureKey: "premiumPrice", tamir: "ils", competitor: "usd" },
  { featureKey: "mergePdf", tamir: "yes", competitor: "yes" },
  { featureKey: "localPricing", tamir: "yes", competitor: "no" },
];

export const BEST_PDF_ISRAEL_ROWS: AlternativeComparisonRow[] = [
  { featureKey: "hebrewUi", tamir: "yes", competitor: "no" },
  { featureKey: "hebrewOcr", tamir: "soon", competitor: "rare" },
  { featureKey: "freeDaily", tamir: "5", competitor: "varies" },
  { featureKey: "premiumPrice", tamir: "ils", competitor: "usd" },
  { featureKey: "rtlSupport", tamir: "yes", competitor: "no" },
  { featureKey: "browserProcessing", tamir: "many", competitor: "upload" },
];

export const ALTERNATIVE_SLUGS = [
  "freeconvert",
  "convertio-hebrew",
  "ilovepdf-hebrew",
  "best-pdf-israel",
] as const;
export type AlternativeSlug = (typeof ALTERNATIVE_SLUGS)[number];

/** Root SEO paths for alternative pages (canonical). */
export const ROOT_ALTERNATIVE_PATHS: Record<string, AlternativeSlug> = {
  "best-free-pdf-converter-israel": "best-pdf-israel",
};

export const ALTERNATIVE_COMPARISON_ROWS: Record<AlternativeSlug, AlternativeComparisonRow[]> = {
  freeconvert: FREECONVERT_COMPARISON_ROWS,
  "convertio-hebrew": CONVERTIO_COMPARISON_ROWS,
  "ilovepdf-hebrew": ILOVEPDF_COMPARISON_ROWS,
  "best-pdf-israel": BEST_PDF_ISRAEL_ROWS,
};

export function getAlternativePath(slug: AlternativeSlug): string {
  const root = Object.entries(ROOT_ALTERNATIVE_PATHS).find(([, s]) => s === slug)?.[0];
  return root ? `/${root}` : `/alternatives/${slug}`;
}

export function collectRootAlternativePaths(): string[] {
  return Object.keys(ROOT_ALTERNATIVE_PATHS).map((k) => `/${k}`);
}

export function isAlternativeSlug(value: string | undefined): value is AlternativeSlug {
  return !!value && (ALTERNATIVE_SLUGS as readonly string[]).includes(value);
}

export function resolveRootAlternativeSlug(pathSegment: string): AlternativeSlug | undefined {
  return ROOT_ALTERNATIVE_PATHS[pathSegment];
}
