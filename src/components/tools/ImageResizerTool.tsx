import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileDropZone } from "@/components/FileDropZone";
import { AdSlot } from "@/components/AdSlot";
import { UsageLimitNotice } from "@/components/PremiumComponents";
import { Download, Loader2, Maximize2, Shrink, RectangleHorizontal, Lock, Unlock, RotateCcw } from "lucide-react";
import { useLocale, useT } from "@/lib/i18n";
import {
  type CustomToolFreemiumProps,
  onCustomToolSuccess,
  runGatedDownload,
} from "@/lib/custom-tool-freemium";

type ResizeMode = "fit" | "fill" | "stretch";

const presets = [
  { label: "Instagram Post", width: 1080, height: 1080 }, { label: "Instagram Story", width: 1080, height: 1920 },
  { label: "Facebook Cover", width: 820, height: 312 }, { label: "Twitter Header", width: 1500, height: 500 },
  { label: "YouTube Thumbnail", width: 1280, height: 720 }, { label: "LinkedIn Banner", width: 1584, height: 396 },
  { label: "HD (1920×1080)", width: 1920, height: 1080 }, { label: "4K (3840×2160)", width: 3840, height: 2160 },
];

/** Cap preview canvas pixels so extreme sizes (e.g. 20×4095) stay responsive. */
const MAX_PREVIEW_PIXELS = 1_500_000;
const PREVIEW_DEBOUNCE_MS = 120;

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function getPreviewScale(targetW: number, targetH: number): number {
  const pixels = targetW * targetH;
  if (pixels <= MAX_PREVIEW_PIXELS) return 1;
  return Math.sqrt(MAX_PREVIEW_PIXELS / pixels);
}

function drawResizedImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  targetW: number,
  targetH: number,
  mode: ResizeMode,
) {
  ctx.clearRect(0, 0, targetW, targetH);
  if (mode === "stretch") {
    ctx.drawImage(img, 0, 0, targetW, targetH);
  } else if (mode === "fit") {
    const scale = Math.min(targetW / img.naturalWidth, targetH / img.naturalHeight);
    const sw = img.naturalWidth * scale;
    const sh = img.naturalHeight * scale;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, targetW, targetH);
    ctx.drawImage(img, (targetW - sw) / 2, (targetH - sh) / 2, sw, sh);
  } else {
    const scale = Math.max(targetW / img.naturalWidth, targetH / img.naturalHeight);
    const sw = img.naturalWidth * scale;
    const sh = img.naturalHeight * scale;
    ctx.drawImage(img, (targetW - sw) / 2, (targetH - sh) / 2, sw, sh);
  }
}

type Props = { freemium?: CustomToolFreemiumProps };

export function ImageResizerTool({ freemium }: Props) {
  const t = useT();
  const { t: localeT } = useLocale();
  const tt = localeT.tool;
  const r = t.resizer || {};
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [origWidth, setOrigWidth] = useState(0);
  const [origHeight, setOrigHeight] = useState(0);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [mode, setMode] = useState<ResizeMode>("fit");
  const [lockAspect, setLockAspect] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [previewUpdating, setPreviewUpdating] = useState(false);
  const [resultUrl, setResultUrl] = useState("");
  const [resultSize, setResultSize] = useState(0);
  const [downloadGate, setDownloadGate] = useState(false);
  const exportCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const sourceImageRef = useRef<HTMLImageElement | null>(null);
  const aspectRatio = origWidth / origHeight;

  const isPremium = freemium?.isPremium ?? false;
  const atUsageLimit = freemium?.atUsageLimit ?? false;

  const invalidateResult = useCallback(() => {
    setResultUrl("");
    setDownloadGate(false);
  }, []);

  const handleFile = useCallback(async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setResultUrl("");
    setDownloadGate(false);
    const url = URL.createObjectURL(f);
    setPreview(url);
    const img = new Image();
    img.onload = () => {
      sourceImageRef.current = img;
      setOrigWidth(img.naturalWidth);
      setOrigHeight(img.naturalHeight);
      setWidth(img.naturalWidth);
      setHeight(img.naturalHeight);
    };
    img.src = url;
  }, []);

  const handleWidthChange = (val: number) => {
    setWidth(val);
    if (lockAspect && aspectRatio) setHeight(Math.round(val / aspectRatio));
    invalidateResult();
  };

  const handleHeightChange = (val: number) => {
    setHeight(val);
    if (lockAspect && aspectRatio) setWidth(Math.round(val * aspectRatio));
    invalidateResult();
  };

  const handleModeChange = (next: ResizeMode) => {
    setMode(next);
    invalidateResult();
  };

  const applyPresetDimensions = (w: number, h: number, lock: boolean) => {
    setWidth(w);
    setHeight(h);
    setLockAspect(lock);
    invalidateResult();
  };

  useEffect(() => {
    const img = sourceImageRef.current;
    if (!img?.complete || !width || !height || resultUrl) return;

    setPreviewUpdating(true);
    const timer = window.setTimeout(() => {
      const canvas = previewCanvasRef.current;
      if (!canvas || !sourceImageRef.current) {
        setPreviewUpdating(false);
        return;
      }

      const scale = getPreviewScale(width, height);
      const cw = Math.max(1, Math.round(width * scale));
      const ch = Math.max(1, Math.round(height * scale));
      canvas.width = cw;
      canvas.height = ch;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setPreviewUpdating(false);
        return;
      }
      drawResizedImage(ctx, sourceImageRef.current, cw, ch, mode);
      setPreviewUpdating(false);
    }, PREVIEW_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [preview, width, height, mode, origWidth, resultUrl]);

  const handleResize = async () => {
    if (!file || !width || !height || atUsageLimit) return;
    setProcessing(true);
    const img = sourceImageRef.current ?? new Image();
    const runExport = () => {
      const canvas = exportCanvasRef.current || document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      canvas.width = width;
      canvas.height = height;
      drawResizedImage(ctx, img, width, height, mode);
      canvas.toBlob(async (blob) => {
        if (blob) {
          setResultUrl(URL.createObjectURL(blob));
          setResultSize(blob.size);
          if (freemium) {
            await onCustomToolSuccess(freemium.isPremium, freemium.recordUsage);
          }
        }
        setProcessing(false);
      }, file.type.includes("png") ? "image/png" : "image/jpeg", 0.92);
    };

    if (img.complete && img.naturalWidth > 0) {
      runExport();
    } else {
      img.onload = runExport;
      img.src = preview;
    }
  };

  const handleDownload = async () => {
    if (!resultUrl || !file) return;
    const downloadFn = () => {
      const a = document.createElement("a");
      a.href = resultUrl;
      a.download = `resized_${width}x${height}.${file.name.split(".").pop() || "jpg"}`;
      a.click();
    };
    const { triggered, gateOpen } = await runGatedDownload(downloadGate, isPremium, downloadFn);
    setDownloadGate(gateOpen);
    if (!triggered) return;
  };

  const handleReset = () => {
    setFile(null);
    setPreview("");
    sourceImageRef.current = null;
    setResultUrl("");
    setWidth(0);
    setHeight(0);
    setDownloadGate(false);
  };

  const downloadLabel = isPremium
    ? r.downloadImage(formatFileSize(resultSize))
    : downloadGate
      ? tt.downloadNow
      : tt.watchAdToDownload;

  const resizeModes = [
    { value: "fit" as const, label: r.fit, desc: r.fitDesc, icon: Shrink },
    { value: "fill" as const, label: r.fill, desc: r.fillDesc, icon: Maximize2 },
    { value: "stretch" as const, label: r.stretch, desc: r.stretchDesc, icon: RectangleHorizontal },
  ];

  const previewAspect = width > 0 && height > 0 ? width / height : undefined;

  if (!file) {
    return (
      <div className="space-y-5">
        {freemium && !isPremium && <UsageLimitNotice used={freemium.usedToday} max={freemium.maxDaily} />}
        <FileDropZone acceptedFormats={["JPG", "PNG", "WEBP"]} onFilesSelected={handleFile} />
        <AdSlot type="banner" slotId="tool-resizer-empty" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {freemium && !isPremium && <UsageLimitNotice used={freemium.usedToday} max={freemium.maxDaily} />}
      <canvas ref={exportCanvasRef} className="hidden" aria-hidden />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-3">
          <div className="bg-card border border-border rounded-xl p-3 flex items-center justify-center min-h-[200px] max-h-[380px] overflow-hidden">
            {resultUrl ? (
              <img
                src={resultUrl}
                alt={r.result}
                className="max-h-[350px] w-full object-contain rounded-lg"
              />
            ) : (
              <div
                className="relative flex items-center justify-center w-full max-h-[350px]"
                style={previewAspect ? { aspectRatio: previewAspect } : undefined}
              >
                {previewUpdating && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/40 rounded-lg">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" aria-hidden />
                  </div>
                )}
                {width && height ? (
                  <canvas
                    ref={previewCanvasRef}
                    className="max-h-[350px] max-w-full rounded-lg border border-border/50 bg-muted/30"
                    aria-label={r.preview}
                  />
                ) : (
                  <img src={preview} alt={r.source} className="max-h-[350px] w-full object-contain rounded-lg" />
                )}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>{r.source}: {origWidth}×{origHeight} • {formatFileSize(file.size)}</span>
            {width > 0 && height > 0 && (
              <span className={resultUrl ? "text-success font-medium" : "text-foreground font-medium"}>
                {resultUrl ? r.result : r.preview}: {width}×{height}
                {resultUrl && ` • ${formatFileSize(resultSize)}`}
              </span>
            )}
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            <h3 className="text-sm font-bold text-foreground">{r.dimensions}</h3>
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-1">
                <label className="text-xs text-muted-foreground">{r.width}</label>
                <Input type="number" value={width || ""} onChange={(e) => handleWidthChange(Number(e.target.value))} className="h-9" />
              </div>
              <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => setLockAspect(!lockAspect)} title={lockAspect ? r.lockedRatio : r.freeRatio}>
                {lockAspect ? <Lock className="w-4 h-4 text-primary" /> : <Unlock className="w-4 h-4 text-muted-foreground" />}
              </Button>
              <div className="flex-1 space-y-1">
                <label className="text-xs text-muted-foreground">{r.height}</label>
                <Input type="number" value={height || ""} onChange={(e) => handleHeightChange(Number(e.target.value))} className="h-9" />
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[25, 50, 75, 100, 150, 200].map((pct) => (
                <Button
                  key={pct}
                  variant="outline"
                  size="sm"
                  className={`text-xs h-7 px-2.5 ${width === Math.round(origWidth * pct / 100) ? "bg-primary/10 border-primary/30 text-primary" : ""}`}
                  onClick={() => applyPresetDimensions(Math.round(origWidth * pct / 100), Math.round(origHeight * pct / 100), true)}
                >
                  {pct}%
                </Button>
              ))}
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-foreground">{r.resizeMethod}</h3>
            <div className="grid grid-cols-3 gap-2">
              {resizeModes.map((m) => (
                <button
                  key={m.value}
                  onClick={() => handleModeChange(m.value)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${mode === m.value ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/30"}`}
                >
                  <m.icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{m.label}</span>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">{resizeModes.find((m) => m.value === mode)?.desc}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-foreground">{r.readyPresets}</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {presets.map((p) => (
                <Button
                  key={p.label}
                  variant="outline"
                  size="sm"
                  className="text-xs justify-start h-8"
                  onClick={() => applyPresetDimensions(p.width, p.height, false)}
                >
                  {p.label}
                  <span className="text-muted-foreground ms-auto">{p.width}×{p.height}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={handleReset}>
          <RotateCcw className="w-4 h-4 me-1" />
          {r.newImage}
        </Button>
        {!resultUrl ? (
          <Button onClick={handleResize} disabled={processing || !width || !height || atUsageLimit} className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold flex-1 sm:flex-none">
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 me-2 animate-spin" />
                {r.processing}
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4 me-2" />
                {r.resizeTo(width, height)}
              </>
            )}
          </Button>
        ) : (
          <Button onClick={handleDownload} className="bg-success text-success-foreground hover:bg-success/90 font-bold flex-1 sm:flex-none">
            <Download className="w-4 h-4 me-2" />
            {downloadLabel}
          </Button>
        )}
      </div>
      <AdSlot type="banner" slotId="tool-resizer-foot" />
    </div>
  );
}
