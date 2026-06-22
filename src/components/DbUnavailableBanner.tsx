import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useLocale, localePath } from "@/lib/i18n";

export function DbUnavailableBanner() {
  const { dbAvailable } = useAuth();
  const { isPremium } = useSubscription();
  const { locale, t } = useLocale();
  const notice = t.siteBanner as { dbUnavailable: string; contactLink: string };

  if (dbAvailable !== false || isPremium) return null;

  return (
    <div
      role="alert"
      className="border-b border-amber-500/20 bg-amber-500/5 px-4 py-1.5 text-center text-xs text-muted-foreground"
    >
      <span>{notice.dbUnavailable} </span>
      <Link
        to={localePath("/contact", locale)}
        className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
      >
        {notice.contactLink}
      </Link>
    </div>
  );
}
