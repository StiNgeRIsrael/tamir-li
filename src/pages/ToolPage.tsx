import { useParams, Link } from "react-router-dom";
import { getToolById, categoryLabels } from "@/lib/tools-data";
import { AppLayout } from "@/components/AppLayout";
import { FileDropZone } from "@/components/FileDropZone";
import { AdSlot } from "@/components/AdSlot";
import { PremiumBanner, PremiumLock, ConversionSuccessUsage } from "@/components/PremiumComponents";
import { triggerInterstitial } from "@/components/AdSlot";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Download, Loader2, CheckCircle2, Crown, X, FileUp, RefreshCw, Plus, ImageIcon, FileText, FileVideo, FileAudio } from "lucide-react";

interface FileWithFormat {
  file: File;
  outputFormat: string;
  thumbnail?: string;
  progress: number; // 0-100
  status: "pending" | "converting" | "done" | "error";
}

function getFileIcon(file: File) {
  const type = file.type;
  if (type.startsWith("image/")) return ImageIcon;
  if (type.startsWith("video/")) return FileVideo;
  if (type.startsWith("audio/")) return FileAudio;
  return FileText;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default function ToolPage() {
  const { toolId } = useParams();
  const tool = getToolById(toolId || "");
  const [fileItems, setFileItems] = useState<FileWithFormat[]>([]);
  const [converting, setConverting] = useState(false);
  const [allDone, setAllDone] = useState(false);
  const [usedToday] = useState(3);
  const maxDaily = 5;
  const [globalFormat, setGlobalFormat] = useState("");

  // Generate thumbnails for image files
  const generateThumbnail = useCallback((file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith("image/")) {
        resolve(undefined);
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => resolve(undefined);
      reader.readAsDataURL(file);
    });
  }, []);

  const handleFilesSelected = useCallback(async (files: File[]) => {
    const newItems: FileWithFormat[] = await Promise.all(
      files.map(async (file) => ({
        file,
        outputFormat: globalFormat,
        thumbnail: await generateThumbnail(file),
        progress: 0,
        status: "pending" as const,
      }))
    );
    setFileItems((prev) => [...prev, ...newItems]);
  }, [globalFormat, generateThumbnail]);

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

    // Animate each file sequentially with staggered progress
    fileItems.forEach((_, index) => {
      const startDelay = index * 400;

      setTimeout(() => {
        setFileItems((prev) =>
          prev.map((item, i) => (i === index ? { ...item, status: "converting", progress: 0 } : item))
        );

        // Animate progress
        const steps = 20;
        const stepDuration = (1500 + Math.random() * 1000) / steps;
        for (let step = 1; step <= steps; step++) {
          setTimeout(() => {
            setFileItems((prev) =>
              prev.map((item, i) =>
                i === index
                  ? { ...item, progress: Math.min(Math.round((step / steps) * 100), 100) }
                  : item
              )
            );

            // Mark done on last step
            if (step === steps) {
              setFileItems((prev) =>
                prev.map((item, i) =>
                  i === index ? { ...item, status: "done", progress: 100 } : item
                )
              );
            }
          }, step * stepDuration);
        }
      }, startDelay);
    });

    // All done after all files finish
    const totalTime = fileItems.length * 400 + 2500;
    setTimeout(() => {
      setConverting(false);
      setAllDone(true);
      triggerInterstitial();
    }, totalTime);
  };

  const handleReset = () => {
    setFileItems([]);
    setGlobalFormat("");
    setAllDone(false);
  };

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
            {tool.toFormats.length > 1 && !allDone && (
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
        ) : allDone ? (
          /* All Done - show results */
          <div className="space-y-3 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 className="w-6 h-6 text-success" />
              <h2 className="text-xl font-bold">ההמרה הושלמה!</h2>
            </div>

            {fileItems.map((item, index) => {
              const Icon = getFileIcon(item.file);
              return (
                <div
                  key={index}
                  className="flex items-center gap-4 bg-card border border-success/30 rounded-xl px-4 py-3 animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Thumbnail or icon */}
                  {item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt={item.file.name}
                      className="w-12 h-12 rounded-lg object-cover border border-border"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-success" />
                    </div>
                  )}

                  {/* File info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {item.file.name.replace(/\.[^.]+$/, '')}.{item.outputFormat.toLowerCase()}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(item.file.size)} → {item.outputFormat}</p>
                  </div>

                  {/* Status */}
                  <CheckCircle2 className="w-5 h-5 text-success shrink-0" />

                  {/* Download button */}
                  <Button size="sm" variant="outline" className="shrink-0 text-success border-success/30 hover:bg-success/10">
                    <Download className="w-3.5 h-3.5 ml-1" />
                    הורד
                  </Button>
                </div>
              );
            })}

            <div className="flex items-center justify-between pt-3">
              <Button variant="outline" onClick={handleReset}>
                המרה נוספת
              </Button>
              <Button className="bg-success text-success-foreground hover:bg-success/90">
                <Download className="w-4 h-4 ml-2" />
                הורד הכל
              </Button>
            </div>

            <ConversionSuccessUsage used={usedToday + fileItems.length} max={maxDaily} />
            <AdSlot type="inline" className="mt-4" />
          </div>
        ) : (
          /* Upload & Convert */
          <div className="space-y-5">
            {fileItems.length === 0 && (
              <FileDropZone
                acceptedFormats={tool.fromFormats}
                onFilesSelected={handleFilesSelected}
              />
            )}

            {/* File rows */}
            {fileItems.length > 0 && (
              <div className="space-y-2 animate-fade-in">
                {fileItems.map((item, index) => {
                  const Icon = getFileIcon(item.file);
                  return (
                    <div
                      key={index}
                      className={`bg-card border rounded-xl px-4 py-3 transition-all duration-300 ${
                        item.status === "done"
                          ? "border-success/40"
                          : item.status === "converting"
                          ? "border-primary/40"
                          : "border-border"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Thumbnail or icon */}
                        {item.thumbnail ? (
                          <img
                            src={item.thumbnail}
                            alt={item.file.name}
                            className="w-10 h-10 rounded-lg object-cover border border-border shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                        )}

                        {/* File info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.file.name}</p>
                          <p className="text-xs text-muted-foreground">{formatFileSize(item.file.size)}</p>
                        </div>

                        {/* Status indicator */}
                        {item.status === "converting" && (
                          <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
                        )}
                        {item.status === "done" && (
                          <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                        )}

                        {/* Convert to */}
                        <div className="flex items-center gap-2 shrink-0">
                          <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
                          <Select
                            value={item.outputFormat}
                            onValueChange={(val) => setFileFormat(index, val)}
                            disabled={converting}
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
                        {!converting && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0 opacity-50 hover:opacity-100"
                            onClick={() => removeFile(index)}
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>

                      {/* Progress bar */}
                      {(item.status === "converting" || item.status === "done") && (
                        <div className="mt-2.5">
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ease-out ${
                                item.status === "done" ? "bg-success" : "bg-primary"
                              }`}
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] text-muted-foreground">
                              {item.status === "converting" ? "ממיר..." : "הושלם"}
                            </span>
                            <span className="text-[10px] text-muted-foreground">{item.progress}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Actions row */}
                {!converting && (
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
                      className="h-10 px-8 font-bold bg-accent text-accent-foreground hover:bg-accent/90 animate-pulse-glow"
                      size="lg"
                    >
                      <RefreshCw className="w-4 h-4 ml-2" />
                      המר {fileItems.length > 1 ? `${fileItems.length} קבצים` : ""}
                    </Button>
                  </div>
                )}

                {converting && (
                  <div className="text-center py-2 text-sm text-muted-foreground animate-fade-in">
                    <Loader2 className="w-5 h-5 mx-auto animate-spin mb-2 text-primary" />
                    ממיר קבצים... אנא המתן
                  </div>
                )}
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
