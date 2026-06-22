import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import DE from "country-flag-icons/react/3x2/DE";
import ES from "country-flag-icons/react/3x2/ES";
import FR from "country-flag-icons/react/3x2/FR";
import GB from "country-flag-icons/react/3x2/GB";
import IL from "country-flag-icons/react/3x2/IL";
import IT from "country-flag-icons/react/3x2/IT";
import RU from "country-flag-icons/react/3x2/RU";

const flagComponents = {
  he: IL,
  en: GB,
  es: ES,
  ru: RU,
  de: DE,
  fr: FR,
  it: IT,
} as const;

interface LocaleFlagProps {
  locale: Locale;
  className?: string;
}

export function LocaleFlag({ locale, className }: LocaleFlagProps) {
  const Flag = flagComponents[locale];
  return (
    <Flag
      className={cn("inline-block h-4 w-6 shrink-0 rounded-sm", className)}
      aria-hidden
    />
  );
}
