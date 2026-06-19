import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { hasConsentChoice, saveConsent } from "@/lib/ads/consent";
import { useLocale, localePath } from "@/lib/i18n";
import { enTranslations } from "@/lib/translations/en";

export function CookieConsent() {
  const { locale, t } = useLocale();
  const c = t.consent ?? enTranslations.consent;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!hasConsentChoice());
  }, []);

  const accept = () => {
    saveConsent(true, true);
    setVisible(false);
  };

  const reject = () => {
    saveConsent(false, false);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-desc"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 p-4 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:p-6"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1 text-sm text-muted-foreground">
          <p id="cookie-consent-title" className="font-semibold text-foreground">
            {c.title}
          </p>
          <p id="cookie-consent-desc" className="leading-relaxed">
            {c.description}{" "}
            <Link to={localePath("/privacy", locale)} className="text-primary underline-offset-4 hover:underline">
              {c.privacyLink}
            </Link>
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={reject}>
            {c.rejectAll}
          </Button>
          <Button size="sm" onClick={accept}>
            {c.acceptAll}
          </Button>
        </div>
      </div>
    </div>
  );
}
