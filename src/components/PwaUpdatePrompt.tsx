import { useRegisterSW } from "virtual:pwa-register/react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n";
import { enTranslations } from "@/lib/translations/en";

export function PwaUpdatePrompt() {
  const { t } = useLocale();
  const copy = t.pwaUpdate ?? enTranslations.pwaUpdate;

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error) {
      console.warn("[PWA] service worker registration failed:", error);
    },
  });

  if (!needRefresh) return null;

  const refresh = () => {
    void updateServiceWorker(true);
  };

  const dismiss = () => {
    setNeedRefresh(false);
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-border bg-background/95 p-4 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:p-6"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-foreground">{copy.message}</p>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={dismiss}>
            {copy.dismiss}
          </Button>
          <Button size="sm" onClick={refresh}>
            {copy.refresh}
          </Button>
        </div>
      </div>
    </div>
  );
}
