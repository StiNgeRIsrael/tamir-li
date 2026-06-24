import { useState, useCallback, useRef } from "react";
import { PDFDocument, degrees } from "pdf-lib";
import { Button } from "@/components/ui/button";
import { FileDropZone } from "@/components/FileDropZone";
import { AdSlot } from "@/components/AdSlot";
import { UsageLimitNotice } from "@/components/PremiumComponents";
import { Plus, Download, RotateCw, RotateCcw, Trash2, FileText, ChevronUp, ChevronDown, Loader2, CheckCircle2, Merge } from "lucide-react";
import { useLocale, useT } from "@/lib/i18n";
import {
  type CustomToolFreemiumProps,
  notifyFileRejected,
  onCustomToolSuccess,
  runGatedDownload,
  trackCustomToolStart,
} from "@/lib/custom-tool-freemium";

interface PdfPage { pdfIndex: number; pageIndex: number; rotation: number; }
interface PdfFile { name: string; data: ArrayBuffer; pageCount: number; }

type Props = { freemium?: CustomToolFreemiumProps };

export function PdfManagerTool({ freemium }: Props) {
  const t = useT();
  const { t: localeT } = useLocale();
  const tt = localeT.tool;
  const pm = t.pdfManager;
  const [pdfFiles, setPdfFiles] = useState<PdfFile[]>([]);
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [merging, setMerging] = useState(false);
  const [mergedUrl, setMergedUrl] = useState<string | null>(null);
  const [thumbnails, setThumbnails] = useState<Map<string, string>>(new Map());
  const [downloadGate, setDownloadGate] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isPremium = freemium?.isPremium ?? false;
  const atUsageLimit = freemium?.atUsageLimit ?? false;

  const generateThumbnail = useCallback(async (data: ArrayBuffer, pageNum: number): Promise<string> => {
    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(data) }).promise;
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 0.3 });
      const canvas = document.createElement("canvas"); canvas.width = viewport.width; canvas.height = viewport.height;
      await page.render({ canvasContext: canvas.getContext("2d")!, viewport }).promise;
      return canvas.toDataURL("image/jpeg", 0.6);
    } catch { return ""; }
  }, []);

  const handleFilesSelected = useCallback(async (files: File[]) => {
    setLoading(true);
    const pdfOnlyFiles = files.filter(f => f.type === "application/pdf" || f.name.endsWith(".pdf"));
    for (const file of pdfOnlyFiles) {
      const data = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(data);
      const pageCount = pdfDoc.getPageCount();
      const pdfIndex = pdfFiles.length + pdfOnlyFiles.indexOf(file);
      setPdfFiles(prev => [...prev, { name: file.name, data, pageCount }]);
      const newPages: PdfPage[] = []; const newThumbs = new Map<string, string>();
      for (let i = 0; i < pageCount; i++) {
        newPages.push({ pdfIndex, pageIndex: i, rotation: 0 });
        newThumbs.set(`${pdfIndex}-${i}`, await generateThumbnail(data, i + 1));
      }
      setPages(prev => [...prev, ...newPages]);
      setThumbnails(prev => new Map([...prev, ...newThumbs]));
    }
    setLoading(false);
  }, [pdfFiles.length, generateThumbnail]);

  const rotatePage = (i: number, deg: number) => setPages(prev => prev.map((p, idx) => idx === i ? { ...p, rotation: (p.rotation + deg + 360) % 360 } : p));
  const removePage = (i: number) => setPages(prev => prev.filter((_, idx) => idx !== i));
  const movePage = (i: number, dir: -1 | 1) => {
    const ni = i + dir; if (ni < 0 || ni >= pages.length) return;
    setPages(prev => { const a = [...prev]; [a[i], a[ni]] = [a[ni], a[i]]; return a; });
  };

  const mergeAndDownload = async () => {
    if (atUsageLimit) return;
    if (freemium?.toolId) trackCustomToolStart(freemium.toolId);
    setMerging(true);
    try {
      const mergedPdf = await PDFDocument.create();
      for (const page of pages) {
        const srcPdf = await PDFDocument.load(pdfFiles[page.pdfIndex].data);
        const [copied] = await mergedPdf.copyPages(srcPdf, [page.pageIndex]);
        copied.setRotation(degrees(page.rotation)); mergedPdf.addPage(copied);
      }
      const bytes = await mergedPdf.save();
      setMergedUrl(URL.createObjectURL(new Blob([bytes as unknown as BlobPart], { type: "application/pdf" })));
      if (freemium) {
        await onCustomToolSuccess(freemium.isPremium, freemium.recordUsage, freemium.toolId);
      }
    } catch (err) { console.error("PDF merge error:", err); }
    setMerging(false);
  };

  const downloadMerged = async () => {
    if (!mergedUrl) return;
    const downloadFn = () => {
      const a = document.createElement("a");
      a.href = mergedUrl;
      a.download = "merged.pdf";
      a.click();
    };
    const { triggered, gateOpen } = await runGatedDownload(downloadGate, isPremium, downloadFn, {
      toolId: freemium?.toolId,
    });
    setDownloadGate(gateOpen);
    if (!triggered) return;
  };

  const handleReset = () => {
    setPdfFiles([]); setPages([]); setThumbnails(new Map());
    if (mergedUrl) URL.revokeObjectURL(mergedUrl);
    setMergedUrl(null); setDownloadGate(false);
  };

  const downloadLabel = isPremium ? pm.downloadPdf : tt.download;

  if (mergedUrl) return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3"><CheckCircle2 className="w-6 h-6 text-success" /><h2 className="text-xl font-bold text-foreground">{pm.pdfReady}</h2></div>
      <div className="bg-card border border-success/30 rounded-xl p-6 text-center space-y-4">
        <FileText className="w-12 h-12 text-success mx-auto" />
        <p className="text-sm text-muted-foreground">{pm.pagesMerged(pages.length)}</p>
        <div className="flex items-center justify-center gap-3">
          <Button onClick={downloadMerged} className="bg-success text-success-foreground hover:bg-success/90 font-bold"><Download className="w-4 h-4 me-2" />{downloadLabel}</Button>
          <Button variant="outline" onClick={handleReset}>{pm.startOver}</Button>
        </div>
      </div>
      <AdSlot type="inline" slotId="tool-pdf-inline" eager />
    </div>
  );

  return (
    <div className="space-y-5">
      {freemium && !isPremium && <UsageLimitNotice used={freemium.usedToday} max={freemium.maxDaily} />}
      {pages.length === 0 && !loading && (
        <FileDropZone
          acceptedFormats={["PDF"]}
          onFilesSelected={handleFilesSelected}
          isPremium={isPremium}
          existingFileCount={pdfFiles.length}
          multiple={isPremium}
          onRejected={(reason, fileName) => notifyFileRejected(reason, isPremium, t.fileDropZone, fileName)}
        />
      )}
      {loading && (
        <div className="text-center py-8 space-y-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{pm.loadingPages}</p>
          {!isPremium && <AdSlot type="inline" slotId="tool-pdf-loading" className="mx-auto max-w-lg" eager />}
        </div>
      )}
      {merging && !isPremium && (
        <AdSlot type="inline" slotId="tool-pdf-merging" className="mx-auto max-w-lg" eager />
      )}
      {pages.length > 0 && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{pm.pagesFromFiles(pages.length, pdfFiles.length)}</p>
            <Button variant="outline" size="sm" onClick={() => document.getElementById("file-input")?.click()}><Plus className="w-4 h-4 me-1" />{pm.addPdf}</Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {pages.map((page, index) => {
              const thumb = thumbnails.get(`${page.pdfIndex}-${page.pageIndex}`);
              return (
                <div key={`${page.pdfIndex}-${page.pageIndex}-${index}`} className="bg-card border border-border rounded-xl overflow-hidden group hover:border-primary/30 transition-colors">
                  <div className="aspect-[3/4] bg-muted flex items-center justify-center overflow-hidden relative">
                    {thumb ? <img src={thumb} alt={`${pm.page} ${index + 1}`} className="w-full h-full object-contain" style={{ transform: `rotate(${page.rotation}deg)` }} /> : <FileText className="w-8 h-8 text-muted-foreground" />}
                    <div className="absolute top-1 end-1 bg-foreground/80 text-background text-[10px] font-bold px-1.5 py-0.5 rounded">{index + 1}</div>
                  </div>
                  <div className="flex items-center justify-between px-1.5 py-1.5">
                    <div className="flex items-center gap-0.5">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => movePage(index, -1)} disabled={index === 0}><ChevronUp className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => movePage(index, 1)} disabled={index === pages.length - 1}><ChevronDown className="w-3 h-3" /></Button>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => rotatePage(index, -90)}><RotateCcw className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => rotatePage(index, 90)}><RotateCw className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => removePage(index)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </div>
                  <div className="px-2 pb-1.5"><p className="text-[10px] text-muted-foreground truncate">{pdfFiles[page.pdfIndex]?.name}</p></div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-center pt-2">
            <Button onClick={mergeAndDownload} disabled={merging || pages.length === 0 || atUsageLimit} size="lg" className="font-bold bg-accent text-accent-foreground hover:bg-accent/90 px-8">
              {merging ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : <Merge className="w-4 h-4 me-2" />}
              {merging ? pm.merging : pm.mergePages(pages.length)}
            </Button>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
      <AdSlot type="banner" slotId="tool-pdf-banner" />
    </div>
  );
}
