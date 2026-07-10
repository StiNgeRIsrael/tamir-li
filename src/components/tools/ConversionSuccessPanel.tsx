import { CheckCircle2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdSlot } from "@/components/AdSlot";
import { NativePremiumHint } from "@/components/ads/NativePremiumHint";
import { ConversionSuccessUsage } from "@/components/PremiumComponents";
import { shouldUseNativeAdRamp, type NativeAdExperience } from "@/lib/ads/native-ad-ramp";
import { cn } from "@/lib/utils";

type FileResultItem = {
  file: File;
  outputFormat: string;
  thumbnail?: string;
  errorMessage?: string;
};

type ConversionSuccessCopy = {
  conversionDone: string;
  download: string;
  downloadAll: string;
  moreConversion: string;
};

type Props = {
  fileItems: FileResultItem[];
  copy: ConversionSuccessCopy;
  isPremium: boolean;
  isNativeApp: boolean;
  usedToday: number;
  maxDaily: number;
  nativeAdHint: NativeAdExperience | null;
  allDownloadGate: boolean;
  downloadGate: Record<number, boolean>;
  onDownloadFile: (index: number) => void;
  onDownloadAll: () => void;
  onReset: () => void;
  getFileIcon: (file: File) => typeof ImageIcon;
  formatFileSize: (bytes: number) => string;
};

/** Celebratory post-conversion panel — app-native on Capacitor, polished on web. */
export function ConversionSuccessPanel({
  fileItems,
  copy,
  isPremium,
  isNativeApp,
  usedToday,
  maxDaily,
  nativeAdHint,
  allDownloadGate,
  downloadGate,
  onDownloadFile,
  onDownloadAll,
  onReset,
  getFileIcon,
  formatFileSize,
}: Props) {
  const readyToDownload = isPremium || allDownloadGate || Object.values(downloadGate).some(Boolean);

  return (
    <div
      className={cn(
        "conversion-success-panel space-y-4",
        isNativeApp && "conversion-success-panel--native"
      )}
    >
      <header className="conversion-success-hero text-center">
        <div className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center">
          <span
            className="absolute inset-0 rounded-full bg-success/20 animate-success-ring"
            aria-hidden
          />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-success to-emerald-600 shadow-lg animate-success-pop">
            <CheckCircle2 className="h-9 w-9 text-white" strokeWidth={2.5} aria-hidden />
          </div>
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight text-foreground animate-success-slide-up">
          {copy.conversionDone}
        </h2>
      </header>

      <ul className="space-y-3">
        {fileItems.map((item, index) => {
          const Icon = getFileIcon(item.file);
          const baseName = item.file.name.replace(/\.[^.]+$/, "");
          const gated = !isPremium && !downloadGate[index] && !allDownloadGate;

          return (
            <li
              key={index}
              className={cn(
                "conversion-success-file flex items-center gap-3 rounded-2xl border bg-card px-4 py-3.5 shadow-sm animate-success-slide-up",
                isNativeApp ? "min-h-[72px] border-border/80" : "border-success/25",
                "[animation-delay:120ms]"
              )}
              style={{ animationDelay: `${120 + index * 70}ms` }}
            >
              {item.thumbnail ? (
                <img
                  src={item.thumbnail}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-xl object-cover border border-border"
                />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-success/10">
                  <Icon className="h-7 w-7 text-success" aria-hidden />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold text-foreground">
                  {baseName}.{item.outputFormat.toLowerCase()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(item.file.size)} → {item.outputFormat}
                </p>
                {item.errorMessage && (
                  <p className="text-xs text-destructive">{item.errorMessage}</p>
                )}
              </div>
              <Button
                size={isNativeApp ? "default" : "sm"}
                variant={gated ? "outline" : "default"}
                className={cn(
                  "shrink-0 font-semibold active:scale-[0.98]",
                  !gated && "bg-success text-success-foreground hover:bg-success/90",
                  isNativeApp && "h-11 min-w-[6.5rem] rounded-xl"
                )}
                onClick={() => onDownloadFile(index)}
              >
                <Download className="h-4 w-4 me-1" aria-hidden />
                {copy.download}
              </Button>
            </li>
          );
        })}
      </ul>

      <div
        className={cn(
          "flex flex-col gap-3 pt-1 animate-success-slide-up",
          isNativeApp && "sticky bottom-0 pb-[env(safe-area-inset-bottom,0px)]"
        )}
        style={{ animationDelay: `${200 + fileItems.length * 70}ms` }}
      >
        <Button
          size="lg"
          className={cn(
            "w-full font-bold shadow-md active:scale-[0.98]",
            readyToDownload
              ? "bg-success text-success-foreground hover:bg-success/90"
              : "bg-primary text-primary-foreground hover:bg-primary/90",
            isNativeApp && "h-14 rounded-2xl text-base"
          )}
          onClick={onDownloadAll}
        >
          <Download className="h-5 w-5 me-2" aria-hidden />
          {copy.downloadAll}
        </Button>
        <Button
          variant="ghost"
          className={cn("w-full", isNativeApp && "h-11 rounded-xl")}
          onClick={onReset}
        >
          {copy.moreConversion}
        </Button>
      </div>

      <ConversionSuccessUsage used={usedToday} max={maxDaily} />
      <NativePremiumHint experience={nativeAdHint} />

      {!isPremium && !shouldUseNativeAdRamp() && (
        <AdSlot type="inline" slotId="tool-after-success" className="mt-2" eager />
      )}
    </div>
  );
}

/** Shown briefly while post-convert ad plays — success feel, not a bare spinner. */
export function ConversionSuccessPreparing({
  message,
  isNativeApp,
}: {
  message: string;
  isNativeApp: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 py-10 text-center",
        isNativeApp && "min-h-[40vh]"
      )}
    >
      <div className="relative flex h-16 w-16 items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-primary/15 animate-success-ring" aria-hidden />
        <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 animate-success-pop">
          <CheckCircle2 className="h-7 w-7 text-success" aria-hidden />
        </div>
      </div>
      <p className="max-w-xs text-sm font-medium text-muted-foreground animate-success-slide-up">
        {message}
      </p>
    </div>
  );
}
