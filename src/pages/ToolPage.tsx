import { useParams, Link } from "react-router-dom";
import { getToolById, categoryLabels } from "@/lib/tools-data";
import { AppLayout } from "@/components/AppLayout";
import { FileDropZone } from "@/components/FileDropZone";
import { AdSlot } from "@/components/AdSlot";
import { PremiumBanner, PremiumLock, ConversionSuccessUsage } from "@/components/PremiumComponents";
import { triggerInterstitial } from "@/components/AdSlot";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { ArrowLeft, Download, Loader2, CheckCircle2, Crown, X, FileUp, RefreshCw, Plus } from "lucide-react";

interface FileWithFormat {
  file: File;
  outputFormat: string;
}

export default function ToolPage() {
  const { toolId } = useParams();
  const tool = getToolById(toolId || "");
  const [fileItems, setFileItems] = useState<FileWithFormat[]>([]);
  const [converting, setConverting] = useState(false);
  const [done, setDone] = useState(false);
  const [usedToday] = useState(3);
  const maxDaily = 5;
  const [globalFormat, setGlobalFormat] = useState("");

  if (!tool) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh] text-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">כלי לא נמצא</h1>
            <Link to="/" className="text-primary hover:underline">חזור לדף הבית</Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const handleFilesSelected = (files: File[]) => {
    const newItems = files.map((file) => ({ file, outputFormat: globalFormat }));
    setFileItems((prev) => [...prev, ...newItems]);
  };

  const removeFile = (index: number) => {
    setFileItems((prev) => prev.filter((_, i) => i !== index));
  };

  const setFileFormat = (index: number, format: string) => {
    setFileItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, outputFormat: format } : item))
    );
  };

  const applyGlobalFormat = (format: string) => {
    setGlobalFormat(format);
    setFileItems((prev) => prev.map((item) => ({ ...item, outputFormat: format })));
  };

  const allHaveFormat = fileItems.length > 0 && fileItems.every((f) => f.outputFormat);

  const handleConvert = () => {
    if (!allHaveFormat) return;
    triggerInterstitial();
    setConverting(true);
    setTimeout(() => {
      setConverting(false);
      setDone(true);
      triggerInterstitial();
    }, 2500);
  };

  const handleReset = () => {
    setFileItems([]);
    setGlobalFormat("");
    setDone(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-8 lg:py-12 space-y-8">
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">דף הבית</Link>
          <span>/</span>
          <span>{categoryLabels[tool.category]}</span>
          <span>/</span>
          <span className="text-foreground font-medium">{tool.name}</span>
        </nav>

        {/* Header with inline format selector */}
        <header className="space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-extrabold text-foreground">{tool.name}</h1>
                {tool.premium && <Crown className="w-5 h-5 text-premium" />}
              </div>
              <p className="text-muted-foreground mt-1">{tool.description}</p>
            </div>
            {/* Global format selector in header */}
            {tool.toFormats.length > 1 && (
              <div className="flex items-center gap-2 shrink-0 bg-card border border-border rounded-xl px-4 py-2.5">
                <span className="text-sm text-muted-foreground whitespace-nowrap">המר ל</span>
                <Select value={globalFormat} onValueChange={applyGlobalFormat}>
                  <SelectTrigger className="w-28 h-8 text-sm border-0 bg-muted">
                    <SelectValue placeholder="בחר..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tool.toFormats.map((fmt) => (
                      <SelectItem key={fmt} value={fmt}>{fmt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </header>

        {tool.premium ? (
          <PremiumLock />
        ) : done ? (
          /* Success State */
          <div className="text-center py-12 space-y-4 animate-fade-in">
            <CheckCircle2 className="w-16 h-16 text-success mx-auto" />
            <h2 className="text-2xl font-bold">ההמרה הושלמה!</h2>
            <p className="text-muted-foreground">
              {fileItems.length} {fileItems.length === 1 ? "קובץ" : "קבצים"} הומרו בהצלחה
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button className="bg-success text-success-foreground hover:bg-success/90">
                <Download className="w-4 h-4 ml-2" />
                הורד קבצים
              </Button>
              <Button variant="outline" onClick={handleReset}>
                המרה נוספת
              </Button>
            </div>
            <ConversionSuccessUsage used={usedToday + 1} max={maxDaily} />
            <AdSlot type="inline" className="mt-8" />
          </div>
        ) : (
          /* Upload & Convert */
          <div className="space-y-5">
            {/* Drop zone - show when no files yet or always for adding more */}
            {fileItems.length === 0 && (
              <FileDropZone
                acceptedFormats={tool.fromFormats}
                onFilesSelected={handleFilesSelected}
              />
            )}

            {/* File rows */}
            {fileItems.length > 0 && (
              <div className="space-y-2 animate-fade-in">
                {fileItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 group"
                  >
                    {/* File icon + info */}
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FileUp className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(item.file.size)}</p>
                    </div>

                    {/* Convert to indicator */}
                    <div className="flex items-center gap-2 shrink-0">
                      <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground hidden sm:inline">המר ל</span>
                      <Select
                        value={item.outputFormat}
                        onValueChange={(val) => setFileFormat(index, val)}
                      >
                        <SelectTrigger className="w-24 h-7 text-xs border-0 bg-muted">
                          <SelectValue placeholder="..." />
                        </SelectTrigger>
                        <SelectContent>
                          {tool.toFormats.map((fmt) => (
                            <SelectItem key={fmt} value={fmt}>{fmt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Remove */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 opacity-50 hover:opacity-100"
                      onClick={() => removeFile(index)}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}

                {/* Add more files + Convert row */}
                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-sm"
                    onClick={() => document.getElementById("file-input")?.click()}
                  >
                    <Plus className="w-4 h-4 ml-1" />
                    הוסף קבצים
                  </Button>

                  <Button
                    onClick={handleConvert}
                    disabled={!allHaveFormat || converting}
                    className="h-10 px-8 font-bold bg-accent text-accent-foreground hover:bg-accent/90"
                    size="lg"
                  >
                    {converting ? (
                      <>
                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                        ממיר...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 ml-2" />
                        המר
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            <AdSlot type="banner" />
          </div>
        )}

        <PremiumBanner />
      </div>
    </AppLayout>
  );
}
