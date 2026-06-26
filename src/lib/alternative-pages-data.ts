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

export const ALTERNATIVE_SLUGS = ["freeconvert"] as const;
export type AlternativeSlug = (typeof ALTERNATIVE_SLUGS)[number];

export function getAlternativePath(slug: AlternativeSlug): string {
  return `/alternatives/${slug}`;
}
