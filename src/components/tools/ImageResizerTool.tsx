import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileDropZone } from "@/components/FileDropZone";
import { AdSlot } from "@/components/AdSlot";
import { Download, Loader2, CheckCircle2, Maximize2, Shrink, RectangleHorizontal, Lock, Unlock, RotateCcw } from "lucide-react";
import { useT } from "@/lib/i18n";

type ResizeMode = "fit" | "fill" | "stretch";

const presets = [
  { label: "Instagram Post", width: 1080, height: 1080 }, { label: "Instagram Story", width: 1080, height: 1920 },
  { label: "Facebook Cover", width: 820, height: 312 }, { label: "Twitter Header", width: 1500, height: 500 },
  { label: "YouTube Thumbnail", width: 1280, height: 720 }, { label: "LinkedIn Banner", width: 1584, height: 396 },
  { label: "HD (1920×1080)", width: 1920, height: 1080 }, { label: "4K (3840×2160)", width: 3840, height: 2160 },
];

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function ImageResizerTool() {
  const t = useT();
  const r = t.resizer || {};
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState(""); const [origWidth, setOrigWidth] = useState(0); const [origHeight, setOrigHeight] = useState(0);
  const [width, setWidth] = useState(0); const [height, setHeight] = useState(0);
  const [mode, setMode] = useState<ResizeMode>("fit"); const [lockAspect, setLockAspect] = useState(true);
  const [processing, setProcessing] = useState(false); const [resultUrl, setResultUrl] = useState(""); const [resultSize, setResultSize] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const aspectRatio = origWidth / origHeight;

  const handleFile = useCallback(async (files: File[]) => {
    const f = files[0]; if (!f) return; setFile(f); setResultUrl("");
    const url = URL.createObjectURL(f); setPreview(url);
    const img = new Image();
    img.onload = () => { setOrigWidth(img.naturalWidth); setOrigHeight(img.naturalHeight); setWidth(img.naturalWidth); setHeight(img.naturalHeight); };
    img.src = url;
  }, []);

  const handleWidthChange = (val: number) => { setWidth(val); if (lockAspect && aspectRatio) setHeight(Math.round(val / aspectRatio)); };
  const handleHeightChange = (val: number) => { setHeight(val); if (lockAspect && aspectRatio) setWidth(Math.round(val * aspectRatio)); };

  const handleResize = async () => {
    if (!file || !width || !height) return; setProcessing(true);
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current || document.createElement("canvas");
      const ctx = canvas.getContext("2d")!; canvas.width = width; canvas.height = height; ctx.clearRect(0, 0, width, height);
      if (mode === "stretch") { ctx.drawImage(img, 0, 0, width, height); }
      else if (mode === "fit") {
        const scale = Math.min(width / img.naturalWidth, height / img.naturalHeight);
        const sw = img.naturalWidth * scale, sh = img.naturalHeight * scale;
        ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, (width - sw) / 2, (height - sh) / 2, sw, sh);
      } else {
        const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight);
        const sw = img.naturalWidth * scale, sh = img.naturalHeight * scale;
        ctx.drawImage(img, (width - sw) / 2, (height - sh) / 2, sw, sh);
      }
      canvas.toBlob((blob) => { if (blob) { setResultUrl(URL.createObjectURL(blob)); setResultSize(blob.size); } setProcessing(false); },
        file.type.includes("png") ? "image/png" : "image/jpeg", 0.92);
    };
    img.src = preview;
  };

  const handleDownload = () => {
    if (!resultUrl || !file) return;
    const a = document.createElement("a"); a.href = resultUrl; a.download = `resized_${width}x${height}.${file.name.split(".").pop() || "jpg"}`; a.click();
  };

  const handleReset = () => { setFile(null); setPreview(""); setResultUrl(""); setWidth(0); setHeight(0); };

  const resizeModes = [
    { value: "fit" as const, label: r.fit, desc: r.fitDesc, icon: Shrink },
    { value: "fill" as const, label: r.fill, desc: r.fillDesc, icon: Maximize2 },
    { value: "stretch" as const, label: r.stretch, desc: r.stretchDesc, icon: RectangleHorizontal },
  ];

  if (!file) return (<div className="space-y-5"><FileDropZone acceptedFormats={["JPG", "PNG", "WEBP"]} onFilesSelected={handleFile} /><AdSlot type="banner" /></div>);

  return (
    <div className="space-y-5">
      <canvas ref={canvasRef} className="hidden" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-3">
          <div className="bg-card border border-border rounded-xl p-3"><img src={resultUrl || preview} alt={r.source} className="max-h-[350px] w-full object-contain rounded-lg" /></div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{r.source}: {origWidth}×{origHeight} • {formatFileSize(file.size)}</span>
            {resultUrl && <span className="text-success font-medium">{r.result}: {width}×{height} • {formatFileSize(resultSize)}</span>}
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            <h3 className="text-sm font-bold text-foreground">{r.dimensions}</h3>
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-1"><label className="text-xs text-muted-foreground">{r.width}</label><Input type="number" value={width || ""} onChange={(e) => handleWidthChange(Number(e.target.value))} className="h-9" /></div>
              <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => setLockAspect(!lockAspect)} title={lockAspect ? r.lockedRatio : r.freeRatio}>
                {lockAspect ? <Lock className="w-4 h-4 text-primary" /> : <Unlock className="w-4 h-4 text-muted-foreground" />}
              </Button>
              <div className="flex-1 space-y-1"><label className="text-xs text-muted-foreground">{r.height}</label><Input type="number" value={height || ""} onChange={(e) => handleHeightChange(Number(e.target.value))} className="h-9" /></div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[25, 50, 75, 100, 150, 200].map((pct) => (
                <Button key={pct} variant="outline" size="sm" className={`text-xs h-7 px-2.5 ${width === Math.round(origWidth * pct / 100) ? "bg-primary/10 border-primary/30 text-primary" : ""}`}
                  onClick={() => { setWidth(Math.round(origWidth * pct / 100)); setHeight(Math.round(origHeight * pct / 100)); setLockAspect(true); }}>{pct}%</Button>
              ))}
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-foreground">{r.resizeMethod}</h3>
            <div className="grid grid-cols-3 gap-2">
              {resizeModes.map((m) => (
                <button key={m.value} onClick={() => setMode(m.value)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${mode === m.value ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/30"}`}>
                  <m.icon className="w-5 h-5" /><span className="text-xs font-medium">{m.label}</span>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">{resizeModes.find((m) => m.value === mode)?.desc}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-foreground">{r.readyPresets}</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {presets.map((p) => (
                <Button key={p.label} variant="outline" size="sm" className="text-xs justify-start h-8" onClick={() => { setWidth(p.width); setHeight(p.height); setLockAspect(false); }}>
                  {p.label}<span className="text-muted-foreground ms-auto">{p.width}×{p.height}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={handleReset}><RotateCcw className="w-4 h-4 me-1" />{r.newImage}</Button>
        {!resultUrl ? (
          <Button onClick={handleResize} disabled={processing || !width || !height} className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold flex-1 sm:flex-none">
            {processing ? <><Loader2 className="w-4 h-4 me-2 animate-spin" />{r.processing}</> : <><Maximize2 className="w-4 h-4 me-2" />{r.resizeTo(width, height)}</>}
          </Button>
        ) : (
          <Button onClick={handleDownload} className="bg-success text-success-foreground hover:bg-success/90 font-bold flex-1 sm:flex-none">
            <Download className="w-4 h-4 me-2" />{r.downloadImage(formatFileSize(resultSize))}
          </Button>
        )}
      </div>
      <AdSlot type="banner" />
    </div>
  );
}
