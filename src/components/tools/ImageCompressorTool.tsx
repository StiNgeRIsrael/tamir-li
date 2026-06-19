import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { FileDropZone } from "@/components/FileDropZone";
import { AdSlot } from "@/components/AdSlot";
import { Download, Loader2, CheckCircle2, RotateCcw, Minimize2, ArrowDown } from "lucide-react";
import { useT } from "@/lib/i18n";

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function getSavingsPercent(original: number, compressed: number) {
  return Math.round((1 - compressed / original) * 100);
}

export function ImageCompressorTool() {
  const t = useT();
  const c = t.compressor || {};
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [quality, setQuality] = useState(75);
  const [processing, setProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState("");
  const [resultSize, setResultSize] = useState(0);
  const [imgDimensions, setImgDimensions] = useState({ w: 0, h: 0 });

  const qualityLabel = quality > 85 ? c.high : quality > 50 ? c.medium : quality > 25 ? c.low : c.minimal;

  const handleFile = useCallback(async (files: File[]) => {
    const f = files[0]; if (!f) return;
    setFile(f); setResultUrl(""); setResultSize(0);
    const url = URL.createObjectURL(f); setPreview(url);
    const img = new Image();
    img.onload = () => setImgDimensions({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = url;
  }, []);

  const handleCompress = useCallback(async () => {
    if (!file) return; setProcessing(true);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!; ctx.drawImage(img, 0, 0);
      const isPng = file.type === "image/png";
      const outputType = isPng && quality > 90 ? "image/png" : "image/jpeg";
      canvas.toBlob((blob) => {
        if (blob) { setResultUrl(URL.createObjectURL(blob)); setResultSize(blob.size); }
        setProcessing(false);
      }, outputType, quality / 100);
    };
    img.src = preview;
  }, [file, preview, quality]);

  const handleDownload = () => {
    if (!resultUrl || !file) return;
    const ext = quality > 90 && file.type === "image/png" ? "png" : "jpg";
    const a = document.createElement("a"); a.href = resultUrl;
    a.download = `compressed_${file.name.replace(/\.[^.]+$/, "")}.${ext}`; a.click();
  };

  const handleReset = () => { setFile(null); setPreview(""); setResultUrl(""); setResultSize(0); };

  if (!file) return (<div className="space-y-5"><FileDropZone acceptedFormats={["JPG", "PNG", "WEBP"]} onFilesSelected={handleFile} /><AdSlot type="banner" slotId="tool-compressor-empty" /></div>);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-3">
          <div className="bg-card border border-border rounded-xl p-3">
            <img src={resultUrl || preview} alt={c.preview} className="max-h-[350px] w-full object-contain rounded-lg" />
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
            <Slider value={[quality]} onValueChange={([v]) => { setQuality(v); setResultUrl(""); }} min={10} max={100} step={5} className="w-full" />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>{c.smallerFile}</span><span>{c.higherQuality}</span>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-foreground">{c.quickCompress}</h3>
            <div className="grid grid-cols-2 gap-2">
              {(c.presets || []).map((p: any) => (
                <button key={p.quality} onClick={() => { setQuality(p.quality); setResultUrl(""); }}
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
          <Button onClick={handleCompress} disabled={processing} className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold flex-1 sm:flex-none">
            {processing ? <><Loader2 className="w-4 h-4 me-2 animate-spin" />{c.compressing}</> : <><Minimize2 className="w-4 h-4 me-2" />{c.compress(quality)}</>}
          </Button>
        ) : (
          <Button onClick={handleDownload} className="bg-success text-success-foreground hover:bg-success/90 font-bold flex-1 sm:flex-none">
            <Download className="w-4 h-4 me-2" />{c.download(formatFileSize(resultSize))}
          </Button>
        )}
      </div>
      <AdSlot type="banner" slotId="tool-compressor-foot" />
    </div>
  );
}
