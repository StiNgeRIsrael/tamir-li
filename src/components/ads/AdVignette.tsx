import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { AdSlot } from "@/components/AdSlot";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n";
import { useSubscription } from "@/hooks/useSubscription";
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

/** Show full-screen ad vignette; resolves when dismissed (after min display time). */
export function showAdVignette(options: AdVignetteOptions = {}): Promise<void> {
  return new Promise((resolve) => {
    notify({ ...options, resolve });
  });
}

function AdVignetteOverlay({ request }: { request: VignetteRequest }) {
  const { t } = useLocale();
  const { isPremium } = useSubscription();
  const minMs = request.minMs ?? 4000;
  const [canClose, setCanClose] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setCanClose(true), minMs);
    return () => window.clearTimeout(timer);
  }, [minMs]);

  const dismiss = useCallback(() => {
    if (!canClose) return;
    setVisible(false);
    window.setTimeout(() => {
      request.resolve();
      notify(null);
    }, 200);
  }, [canClose, request]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && canClose) dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canClose, dismiss]);

  if (isPremium || !visible) return null;

  const vignette = t.adVignette as { close: string; wait: string; label: string };

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[200] flex items-center justify-center p-4 transition-opacity duration-200",
        visible ? "opacity-100" : "opacity-0"
      )}
      role="dialog"
      aria-modal="true"
      aria-label={vignette.label}
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={canClose ? dismiss : undefined}
      />
      <div className="relative z-10 w-full max-w-lg animate-in fade-in zoom-in-95 duration-200">
        <div className="rounded-md border border-border/60 bg-card shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {vignette.label}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={dismiss}
              disabled={!canClose}
              aria-label={vignette.close}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-4">
            <AdSlot
              type="inline"
              slotId={request.slotId ?? "vignette-interstitial"}
              className="min-h-[200px] h-auto max-w-full"
            />
          </div>
          {!canClose && (
            <p className="pb-3 text-center text-xs text-muted-foreground">{vignette.wait}</p>
          )}
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
