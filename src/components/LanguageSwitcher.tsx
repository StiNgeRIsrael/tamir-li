import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useLocale, useT, LOCALES, localeNames, localePath, type Locale } from "@/lib/i18n";
import { LocaleFlag } from "@/components/LocaleFlag";
import { ChevronDown } from "lucide-react";

export function LanguageSwitcher() {
  const { locale } = useLocale();
  const t = useT();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const switchTo = (newLocale: Locale) => {
    setOpen(false);
    // Strip current locale prefix from path
    let path = location.pathname;
    const localePrefix = `/${locale}`;
    if (locale !== "he" && path.startsWith(localePrefix)) {
      path = path.slice(localePrefix.length) || "/";
    }
    navigate(localePath(path, newLocale));
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={`${t.switchLanguage}: ${localeNames[locale]}`}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex shrink-0 items-center gap-0.5 sm:gap-1.5 px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <LocaleFlag locale={locale} />
        <span className="hidden sm:inline text-xs uppercase">{locale}</span>
        <ChevronDown className={`hidden sm:block w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={t.switchLanguage}
          className="absolute top-full mt-1 bg-card border border-border rounded-xl shadow-lg py-1.5 z-50 min-w-[160px]"
          style={{ right: 0 }}
          onMouseLeave={() => setOpen(false)}
        >
          {LOCALES.map((loc) => (
            <button
              key={loc}
              type="button"
              role="option"
              aria-selected={loc === locale}
              onClick={() => switchTo(loc)}
              className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
                loc === locale
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <LocaleFlag locale={loc} />
              <span>{localeNames[loc]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
