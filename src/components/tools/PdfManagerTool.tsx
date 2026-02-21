import { useState, useCallback, useRef, useEffect } from "react";
import { PDFDocument, degrees } from "pdf-lib";
import { Button } from "@/components/ui/button";
import { FileDropZone } from "@/components/FileDropZone";
import { AdSlot } from "@/components/AdSlot";
import {
  Plus, Download, RotateCw, RotateCcw, Trash2, GripVertical, FileText,
  ChevronUp, ChevronDown, Loader2, CheckCircle2, Merge
} from "lucide-react";

interface PdfPage {
  pdfIndex: number;
  pageIndex: number;
  rotation: number;
  thumbnail?: string;
}

interface PdfFile {
  name: string;
  data: ArrayBuffer;
  pageCount: number;
}

export function PdfManagerTool() {
  const [pdfFiles, setPdfFiles] = useState<PdfFile[]>([]);
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [merging, setMerging] = useState(false);
  const [mergedUrl, setMergedUrl] = useState<string | null>(null);
  const [thumbnails, setThumbnails] = useState<Map<string, string>>(new Map());
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateThumbnail = useCallback(async (data: ArrayBuffer, pageNum: number): Promise<string> => {
    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;

      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(data) }).promise;
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 0.3 });

      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d")!;
      await page.render({ canvasContext: ctx, viewport }).promise;
      return canvas.toDataURL("image/jpeg", 0.6);
    } catch {
      return "";
    }
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

      const newPages: PdfPage[] = [];
      const newThumbs = new Map<string, string>();

      for (let i = 0; i < pageCount; i++) {
        const key = `${pdfIndex}-${i}`;
        newPages.push({ pdfIndex, pageIndex: i, rotation: 0 });
        const thumb = await generateThumbnail(data, i + 1);
        newThumbs.set(key, thumb);
      }

      setPages(prev => [...prev, ...newPages]);
      setThumbnails(prev => new Map([...prev, ...newThumbs]));
    }
    setLoading(false);
  }, [pdfFiles.length, generateThumbnail]);

  const rotatePage = (index: number, deg: number) => {
    setPages(prev => prev.map((p, i) =>
      i === index ? { ...p, rotation: (p.rotation + deg + 360) % 360 } : p
    ));
  };

  const removePage = (index: number) => {
    setPages(prev => prev.filter((_, i) => i !== index));
  };

  const movePage = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= pages.length) return;
    setPages(prev => {
      const arr = [...prev];
      [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
      return arr;
    });
  };

  const mergeAndDownload = async () => {
    setMerging(true);
    try {
      const mergedPdf = await PDFDocument.create();

      for (const page of pages) {
        const srcPdf = await PDFDocument.load(pdfFiles[page.pdfIndex].data);
        const [copiedPage] = await mergedPdf.copyPages(srcPdf, [page.pageIndex]);
        copiedPage.setRotation(degrees(page.rotation));
        mergedPdf.addPage(copiedPage);
      }

      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setMergedUrl(url);
    } catch (err) {
      console.error("PDF merge error:", err);
    }
    setMerging(false);
  };

  const downloadMerged = () => {
    if (!mergedUrl) return;
    const a = document.createElement("a");
    a.href = mergedUrl;
    a.download = "merged.pdf";
    a.click();
  };

  const handleReset = () => {
    setPdfFiles([]);
    setPages([]);
    setThumbnails(new Map());
    if (mergedUrl) URL.revokeObjectURL(mergedUrl);
    setMergedUrl(null);
  };

  if (mergedUrl) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-success" />
          <h2 className="text-xl font-bold text-foreground">ה-PDF מוכן!</h2>
        </div>
        <div className="bg-card border border-success/30 rounded-xl p-6 text-center space-y-4">
          <FileText className="w-12 h-12 text-success mx-auto" />
          <p className="text-sm text-muted-foreground">{pages.length} עמודים מוזגו בהצלחה</p>
          <div className="flex items-center justify-center gap-3">
            <Button onClick={downloadMerged} className="bg-success text-success-foreground hover:bg-success/90 font-bold">
              <Download className="w-4 h-4 ml-2" />
              הורד PDF
            </Button>
            <Button variant="outline" onClick={handleReset}>
              התחל מחדש
            </Button>
          </div>
        </div>
        <AdSlot type="inline" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {pages.length === 0 && !loading && (
        <FileDropZone
          acceptedFormats={["PDF"]}
          onFilesSelected={handleFilesSelected}
          multiple
        />
      )}

      {loading && (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">טוען עמודים...</p>
        </div>
      )}

      {pages.length > 0 && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {pages.length} עמודים מ-{pdfFiles.length} קבצים — גררו לסידור מחדש
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <Plus className="w-4 h-4 ml-1" />
              הוסף PDF
            </Button>
          </div>

          {/* Page grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {pages.map((page, index) => {
              const thumbKey = `${page.pdfIndex}-${page.pageIndex}`;
              const thumb = thumbnails.get(thumbKey);
              return (
                <div
                  key={`${thumbKey}-${index}`}
                  className="bg-card border border-border rounded-xl overflow-hidden group hover:border-primary/30 transition-colors"
                >
                  {/* Thumbnail */}
                  <div className="aspect-[3/4] bg-muted flex items-center justify-center overflow-hidden relative">
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={`עמוד ${index + 1}`}
                        className="w-full h-full object-contain"
                        style={{ transform: `rotate(${page.rotation}deg)` }}
                      />
                    ) : (
                      <FileText className="w-8 h-8 text-muted-foreground" />
                    )}
                    {/* Page number badge */}
                    <div className="absolute top-1 right-1 bg-foreground/80 text-background text-[10px] font-bold px-1.5 py-0.5 rounded">
                      {index + 1}
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-between px-1.5 py-1.5">
                    <div className="flex items-center gap-0.5">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => movePage(index, -1)} disabled={index === 0}>
                        <ChevronUp className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => movePage(index, 1)} disabled={index === pages.length - 1}>
                        <ChevronDown className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => rotatePage(index, -90)}>
                        <RotateCcw className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => rotatePage(index, 90)}>
                        <RotateCw className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => removePage(index)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Source file label */}
                  <div className="px-2 pb-1.5">
                    <p className="text-[10px] text-muted-foreground truncate">{pdfFiles[page.pdfIndex]?.name}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Merge button */}
          <div className="flex items-center justify-center pt-2">
            <Button
              onClick={mergeAndDownload}
              disabled={merging || pages.length === 0}
              size="lg"
              className="font-bold bg-accent text-accent-foreground hover:bg-accent/90 px-8"
            >
              {merging ? (
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              ) : (
                <Merge className="w-4 h-4 ml-2" />
              )}
              {merging ? "ממזג..." : `מזג ${pages.length} עמודים`}
            </Button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
      <AdSlot type="banner" />
    </div>
  );
}
