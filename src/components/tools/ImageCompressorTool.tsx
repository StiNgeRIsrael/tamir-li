import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { FileDropZone } from "@/components/FileDropZone";
import { AdSlot } from "@/components/AdSlot";
import { UsageLimitNotice } from "@/components/PremiumComponents";
import { Download, Loader2, CheckCircle2, RotateCcw, Minimize2, ArrowDown } from "lucide-react";
import { useLocale, useT } from "@/lib/i18n";
import {
  type CustomToolFreemiumProps,
  notifyFileRejected,
  onCustomToolSuccess,
  runGatedDownload,
  trackCustomToolStart,
} from "@/lib/custom-tool-freemium";

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function getSavingsPercent(original: number, compressed: number) {
  return Math.round((1 - compressed / original) * 100);
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") resolve(result);
      else reject(new Error("PREVIEW_READ_FAILED"));
    };
    reader.onerror = () => reject(reader.error ?? new Error("PREVIEW_READ_FAILED"));
    reader.readAsDataURL(file);
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") resolve(result);
      else reject(new Error("RESULT_READ_FAILED"));
    };
    reader.onerror = () => reject(reader.error ?? new Error("RESULT_READ_FAILED"));
    reader.readAsDataURL(blob);
  });
}

function loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("IMAGE_DECODE_FAILED"));
    img.src = dataUrl;
  });
}

type Props = { freemium?: CustomToolFreemiumProps };

export function ImageCompressorTool({ freemium }: Props) {
  const t = useT();
  const { t: localeT } = useLocale();
  const tt = localeT.tool;
  const c = t.compressor;
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [quality, setQuality] = useState(75);
  const [processing, setProcessing] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState("");
  const [resultSize, setResultSize] = useState(0);
  const [imgDimensions, setImgDimensions] = useState({ w: 0, h: 0 });
  const [downloadGate, setDownloadGate] = useState(false);
  const sourceImageRef = useRef<HTMLImageElement | null>(null);

  const isPremium = freemium?.isPremium ?? false;
  const atUsageLimit = freemium?.atUsageLimit ?? false;

  const qualityLabel = quality > 85 ? c.high : quality > 50 ? c.medium : quality > 25 ? c.low : c.minimal;

  const invalidateResult = useCallback(() => {
    setResultUrl("");
    setResultSize(0);
    setDownloadGate(false);
  }, []);

  const handleFile = useCallback(async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    invalidateResult();
    setPreview("");
    setImgDimensions({ w: 0, h: 0 });
    sourceImageRef.current = null;
    setPreviewLoading(true);

    try {
      const dataUrl = await readFileAsDataUrl(f);
      const img = await loadImageFromDataUrl(dataUrl);
      sourceImageRef.current = img;
      setPreview(dataUrl);
      setImgDimensions({ w: img.naturalWidth, h: img.naturalHeight });
    } catch {
      setFile(null);
      setPreview("");
      sourceImageRef.current = null;
    } finally {
      setPreviewLoading(false);
    }
  }, [invalidateResult]);

  const handleCompress = useCallback(async () => {
    if (!file || atUsageLimit) return;
    const img = sourceImageRef.current;
    if (!img?.naturalWidth || !img.naturalHeight) return;

    if (freemium?.toolId) trackCustomToolStart(freemium.toolId);
    setProcessing(true);

    try {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setProcessing(false);
        return;
      }
      ctx.drawImage(img, 0, 0);
      const isPng = file.type === "image/png";
      const outputType = isPng && quality > 90 ? "image/png" : "image/jpeg";
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((next) => resolve(next), outputType, quality / 100);
      });
      if (!blob) {
        setProcessing(false);
        return;
      }
      const compressedPreview = await blobToDataUrl(blob);
      setResultUrl(compressedPreview);
      setResultSize(blob.size);
      if (freemium) {
        await onCustomToolSuccess(freemium.isPremium, freemium.recordUsage, freemium.toolId);
      }
    } finally {
      setProcessing(false);
    }
  }, [file, quality, atUsageLimit, freemium]);

  const handleDownload = async () => {
    if (!resultUrl || !file) return;
    const ext = quality > 90 && file.type === "image/png" ? "png" : "jpg";
    const downloadFn = () => {
      const a = document.createElement("a");
      a.href = resultUrl;
      a.download = `compressed_${file.name.replace(/\.[^.]+$/, "")}.${ext}`;
      a.click();
    };
    const { triggered, gateOpen } = await runGatedDownload(downloadGate, isPremium, downloadFn, {
      toolId: freemium?.toolId,
    });
    setDownloadGate(gateOpen);
    if (!triggered) return;
  };

  const handleReset = () => {
    setFile(null);
    setPreview("");
    setResultUrl("");
    setResultSize(0);
    setDownloadGate(false);
    setImgDimensions({ w: 0, h: 0 });
    sourceImageRef.current = null;
  };

  const downloadLabel = isPremium
    ? c.download(formatFileSize(resultSize))
    : tt.download;

  const displaySrc = resultUrl || preview;

  if (!file) {
    return (
      <div className="space-y-5">
        {freemium && !isPremium && <UsageLimitNotice used={freemium.usedToday} max={freemium.maxDaily} />}
        <FileDropZone
          acceptedFormats={["JPG", "PNG", "WEBP"]}
          onFilesSelected={handleFile}
          isPremium={isPremium}
          onRejected={(reason, fileName) => notifyFileRejected(reason, isPremium, t.fileDropZone, fileName)}
        />
        <AdSlot type="banner" slotId="tool-compressor-empty" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {freemium && !isPremium && <UsageLimitNotice used={freemium.usedToday} max={freemium.maxDaily} />}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-3">
          <div className="bg-card border border-border rounded-xl p-3 flex items-center justify-center min-h-[200px] max-h-[380px] overflow-hidden">
            {previewLoading || !displaySrc ? (
              <Loader2 className="w-6 h-6 animate-spin text-primary" aria-hidden />
            ) : (
              <img
                src={displaySrc}
                alt={resultUrl ? c.afterCompression : c.preview}
                className="max-h-[350px] w-full object-contain rounded-lg"
              />
            )}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{imgDimensions.w}×{imgDimensions.h}</span>
            <span>{c.source}: {formatFileSize(file.size)}</span>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">{c.qualityLevel}</h3>
              <span className="text-sm font-bold text-primary">{quality}% — {qualityLabel}</span>
            </div>
            <Slider value={[quality]} onValueChange={([v]) => { setQuality(v); invalidateResult(); }} min={10} max={100} step={5} className="w-full" />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>{c.smallerFile}</span><span>{c.higherQuality}</span>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-foreground">{c.quickCompress}</h3>
            <div className="grid grid-cols-2 gap-2">
              {((c.presets || []) as { quality: number; label: string; desc: string }[]).map((p) => (
                <button key={p.quality} onClick={() => { setQuality(p.quality); invalidateResult(); }}
                  className={`text-start p-3 rounded-xl border transition-all ${quality === p.quality ? "border-primary bg-primary/10" : "border-border hover:border-primary/30"}`}>
                  <span className={`text-xs font-bold ${quality === p.quality ? "text-primary" : "text-foreground"}`}>{p.label} ({p.quality}%)</span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{p.desc}</p>
                </button>
              ))}
            </div>
          </div>
          {resultUrl && (
            <div className="bg-success/5 border border-success/30 rounded-xl p-4 space-y-2 animate-fade-in">
              <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-success" /><h3 className="text-sm font-bold text-foreground">{c.compressionDone}</h3></div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div><p className="text-lg font-extrabold text-foreground">{formatFileSize(file.size)}</p><p className="text-[10px] text-muted-foreground">{c.source}</p></div>
                <div className="flex items-center justify-center"><ArrowDown className="w-5 h-5 text-success" /></div>
                <div><p className="text-lg font-extrabold text-success">{formatFileSize(resultSize)}</p><p className="text-[10px] text-muted-foreground">{c.afterCompression}</p></div>
              </div>
              <div className="bg-success/10 rounded-lg p-2 text-center"><p className="text-sm font-bold text-success">{c.saved(getSavingsPercent(file.size, resultSize))}</p></div>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={handleReset}><RotateCcw className="w-4 h-4 me-1" />{c.newImage}</Button>
        {!resultUrl ? (
          <Button onClick={handleCompress} disabled={processing || previewLoading || atUsageLimit || !preview} className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold flex-1 sm:flex-none">
            {processing ? <><Loader2 className="w-4 h-4 me-2 animate-spin" />{c.compressing}</> : <><Minimize2 className="w-4 h-4 me-2" />{c.compress(quality)}</>}
          </Button>
        ) : (
          <Button onClick={handleDownload} className={`font-bold flex-1 sm:flex-none ${downloadGate ? "bg-success text-success-foreground hover:bg-success/90" : "bg-success text-success-foreground hover:bg-success/90"}`}>
            <Download className="w-4 h-4 me-2" />{downloadLabel}
          </Button>
        )}
      </div>
      {processing && !isPremium && (
        <AdSlot type="inline" slotId="tool-compressor-processing" className="mx-auto max-w-lg" eager />
      )}
      {resultUrl && !isPremium && (
        <AdSlot type="inline" slotId="tool-compressor-success" className="mx-auto max-w-lg" eager />
      )}
      <AdSlot type="banner" slotId="tool-compressor-foot" />
    </div>
  );
}
