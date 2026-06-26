import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { FileDropZone } from "@/components/FileDropZone";
import { AdSlot } from "@/components/AdSlot";
import { UsageLimitNotice } from "@/components/PremiumComponents";
import { Download, Loader2, CheckCircle2, RotateCcw, Minimize2, ArrowDown, Film } from "lucide-react";
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
  if (original <= 0) return 0;
  return Math.round((1 - compressed / original) * 100);
}

type CompressPreset = { label: string; bitrateMbps: number; desc: string };

type Props = { freemium?: CustomToolFreemiumProps };

export function VideoCompressorTool({ freemium }: Props) {
  const t = useT();
  const { t: localeT } = useLocale();
  const tt = localeT.tool;
  const vc = t.videoCompressor || {};
  const presets: CompressPreset[] = vc.presets || [
    { label: "WhatsApp", bitrateMbps: 0.8, desc: "Small file for messaging apps" },
    { label: "Email", bitrateMbps: 1.2, desc: "Balanced size for email attachments" },
    { label: "Web", bitrateMbps: 2.5, desc: "Good quality for websites" },
    { label: "High", bitrateMbps: 5, desc: "Higher quality, larger file" },
  ];

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [bitrateMbps, setBitrateMbps] = useState(1.2);
  const [processing, setProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = useState("");
  const [durationSec, setDurationSec] = useState(0);
  const [downloadGate, setDownloadGate] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewUrlRef = useRef("");
  const resultUrlRef = useRef("");

  const isPremium = freemium?.isPremium ?? false;
  const atUsageLimit = freemium?.atUsageLimit ?? false;

  const revokePreview = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = "";
    }
    setPreviewUrl("");
  }, []);

  const revokeResult = useCallback(() => {
    if (resultUrlRef.current) {
      URL.revokeObjectURL(resultUrlRef.current);
      resultUrlRef.current = "";
    }
    setResultUrl("");
    setResultBlob(null);
    setDownloadGate(false);
  }, []);

  const handleFile = useCallback(
    (files: File[]) => {
      const f = files[0];
      if (!f) return;
      revokeResult();
      revokePreview();
      setFile(f);
      setDurationSec(0);
      const url = URL.createObjectURL(f);
      previewUrlRef.current = url;
      setPreviewUrl(url);
    },
    [revokePreview, revokeResult]
  );

  const handleLoadedMetadata = () => {
    const v = videoRef.current;
    if (v && Number.isFinite(v.duration)) setDurationSec(v.duration);
  };

  const handleCompress = async () => {
    const video = videoRef.current;
    if (!file || !video || atUsageLimit) return;

    if (freemium?.toolId) trackCustomToolStart(freemium.toolId);
    setProcessing(true);
    revokeResult();

    try {
      await video.play().catch(() => undefined);
      video.pause();
      video.currentTime = 0;

      const stream = (video as HTMLVideoElement & { captureStream?: () => MediaStream }).captureStream?.();
      if (!stream) throw new Error("CAPTURE_STREAM_UNSUPPORTED");

      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : MediaRecorder.isTypeSupported("video/webm")
          ? "video/webm"
          : "video/mp4";

      const chunks: Blob[] = [];
      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: Math.round(bitrateMbps * 1_000_000),
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const done = new Promise<Blob>((resolve, reject) => {
        recorder.onerror = () => reject(new Error("RECORD_FAILED"));
        recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType.split(";")[0] }));
      });

      recorder.start(250);
      video.currentTime = 0;
      await video.play();

      await new Promise<void>((resolve) => {
        const onEnded = () => {
          video.removeEventListener("ended", onEnded);
          resolve();
        };
        video.addEventListener("ended", onEnded);
      });

      recorder.stop();
      stream.getTracks().forEach((track) => track.stop());
      video.pause();

      const blob = await done;
      setResultBlob(blob);
      const url = URL.createObjectURL(blob);
      resultUrlRef.current = url;
      setResultUrl(url);

      if (freemium) {
        await onCustomToolSuccess(freemium.isPremium, freemium.recordUsage, freemium.toolId);
      }
    } catch {
      revokeResult();
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!resultBlob || !file) return;
    const ext = resultBlob.type.includes("webm") ? "webm" : "mp4";
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
    revokePreview();
    revokeResult();
    setDurationSec(0);
  };

  const downloadLabel = isPremium
    ? vc.download?.(formatFileSize(resultBlob?.size ?? 0)) ?? `Download (${formatFileSize(resultBlob?.size ?? 0)})`
    : tt.download;

  if (!file) {
    return (
      <div className="space-y-5">
        {freemium && !isPremium && <UsageLimitNotice used={freemium.usedToday} max={freemium.maxDaily} />}
        <FileDropZone
          acceptedFormats={["MP4", "MOV", "WEBM"]}
          onFilesSelected={handleFile}
          isPremium={isPremium}
          onRejected={(reason, fileName) => notifyFileRejected(reason, isPremium, t.fileDropZone, fileName)}
        />
        <AdSlot type="banner" slotId="tool-video-compressor-empty" />
      </div>
    );
  }

  const savings = resultBlob ? getSavingsPercent(file.size, resultBlob.size) : 0;

  return (
    <div className="space-y-5">
      {freemium && !isPremium && <UsageLimitNotice used={freemium.usedToday} max={freemium.maxDaily} />}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-3">
          <div className="bg-card border border-border rounded-xl p-3">
            <video
              ref={videoRef}
              src={previewUrl}
              className="max-h-[350px] w-full rounded-lg bg-black"
              controls
              muted
              playsInline
              onLoadedMetadata={handleLoadedMetadata}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Film className="w-3.5 h-3.5" />
              {vc.source || "Original"}: {formatFileSize(file.size)}
            </span>
            {durationSec > 0 && <span>{Math.round(durationSec)}s</span>}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            <h3 className="text-sm font-bold text-foreground">{vc.targetQuality || "Target quality"}</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{vc.bitrate || "Bitrate"}</span>
                <span className="font-semibold text-primary">{bitrateMbps.toFixed(1)} Mbps</span>
              </div>
              <Slider
                value={[bitrateMbps]}
                min={0.5}
                max={8}
                step={0.1}
                onValueChange={([v]) => {
                  setBitrateMbps(v);
                  revokeResult();
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {presets.map((p) => (
                <Button
                  key={p.label}
                  variant="outline"
                  size="sm"
                  className={`text-xs justify-start h-auto py-2 ${bitrateMbps === p.bitrateMbps ? "bg-primary/10 border-primary/30 text-primary" : ""}`}
                  onClick={() => {
                    setBitrateMbps(p.bitrateMbps);
                    revokeResult();
                  }}
                >
                  <span className="font-medium">{p.label}</span>
                  <span className="text-muted-foreground ms-auto">{p.bitrateMbps}M</span>
                </Button>
              ))}
            </div>
          </div>

          {resultBlob && (
            <div className="bg-success/5 border border-success/30 rounded-xl p-4 space-y-2 animate-fade-in">
              <div className="flex items-center gap-2 text-success font-semibold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                {vc.compressionDone || "Compression complete"}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(file.size)} → {formatFileSize(resultBlob.size)}
                {savings > 0 && ` (${vc.saved?.(savings) ?? `Saved ${savings}%`})`}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={handleReset}>
          <RotateCcw className="w-4 h-4 me-1" />
          {vc.newVideo || "New video"}
        </Button>
        {!resultBlob ? (
          <Button
            onClick={handleCompress}
            disabled={processing || atUsageLimit}
            className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold flex-1 sm:flex-none"
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 me-2 animate-spin" />
                {vc.compressing || "Compressing..."}
              </>
            ) : (
              <>
                <Minimize2 className="w-4 h-4 me-2" />
                {vc.compress || "Compress video"}
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={handleDownload}
            className="bg-success text-success-foreground hover:bg-success/90 font-bold flex-1 sm:flex-none"
          >
            <Download className="w-4 h-4 me-2" />
            {downloadLabel}
          </Button>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
        <ArrowDown className="w-3 h-3" />
        {vc.note || "Output format depends on your browser (WebM or MP4). Re-encode runs locally in your browser."}
      </p>
      {processing && !isPremium && (
        <AdSlot type="inline" slotId="tool-video-compressor-processing" className="mx-auto max-w-lg" eager />
      )}
      {resultBlob && !isPremium && (
        <AdSlot type="inline" slotId="tool-video-compressor-success" className="mx-auto max-w-lg" eager />
      )}
      <AdSlot type="banner" slotId="tool-video-compressor-foot" />
    </div>
  );
}
