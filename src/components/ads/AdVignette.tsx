import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, X } from "lucide-react";
import { AdSlot } from "@/components/AdSlot";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLocale } from "@/lib/i18n";
import { useSubscription } from "@/hooks/useSubscription";
import { useOrganicProgress } from "@/hooks/useOrganicProgress";
import { enTranslations } from "@/lib/translations/en";
import { cn } from "@/lib/utils";

export type AdVignetteOptions = {
  minMs?: number;
  slotId?: string;
};

type VignetteRequest = AdVignetteOptions & {
  resolve: () => void;
};

let pending: VignetteRequest | null = null;
const listeners = new Set<(req: VignetteRequest | null) => void>();

function notify(req: VignetteRequest | null) {
  pending = req;
  listeners.forEach((fn) => fn(req));
}

/** Show full-screen ad vignette; resolves when user dismisses after progress completes. */
export function showAdVignette(options: AdVignetteOptions = {}): Promise<void> {
  return new Promise((resolve) => {
    notify({ ...options, resolve });
  });
}

function AdVignetteOverlay({ request }: { request: VignetteRequest }) {
  const { t } = useLocale();
  const { isPremium } = useSubscription();
  const minMs = request.minMs ?? 4000;
  const vignette = { ...enTranslations.adVignette, ...t.adVignette };
  const { progress, complete } = useOrganicProgress(minMs);
  const [visible, setVisible] = useState(true);

  const dismiss = useCallback(() => {
    if (!complete) return;
    setVisible(false);
    window.setTimeout(() => {
      request.resolve();
      notify(null);
    }, 200);
  }, [complete, request]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && complete) dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [complete, dismiss]);

  if (isPremium || !visible) return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[200] flex items-center justify-center p-4 transition-opacity duration-200",
        visible ? "opacity-100" : "opacity-0"
      )}
      role="dialog"
      aria-modal="true"
      aria-label={vignette.label}
      aria-busy={!complete}
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={complete ? dismiss : undefined}
      />
      <div className="relative z-10 w-full max-w-lg animate-in fade-in zoom-in-95 duration-200">
        <div className="overflow-hidden rounded-md border border-border/60 bg-card shadow-2xl">
          <div className="flex items-center justify-end border-b border-border px-4 py-2.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={dismiss}
              disabled={!complete}
              aria-label={vignette.close}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-4">
            <AdSlot
              type="inline"
              slotId={request.slotId ?? "vignette-interstitial"}
              className="max-w-full"
              eager
            />
          </div>
          <div className="space-y-3 border-t border-border/60 px-4 pb-4 pt-3">
            <Progress
              value={progress}
              className="h-2 bg-muted [&>div]:!transition-none"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={vignette.label}
            />
            {complete && (
              <Button className="w-full cursor-pointer gap-2" onClick={dismiss}>
                <CheckCircle2 className="h-4 w-4" />
                {vignette.ready}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/** Mount once at app root to render vignette overlays. */
export function AdVignetteHost() {
  const [request, setRequest] = useState<VignetteRequest | null>(pending);

  useEffect(() => {
    const handler = (req: VignetteRequest | null) => setRequest(req);
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  if (!request) return null;
  return <AdVignetteOverlay request={request} />;
}
