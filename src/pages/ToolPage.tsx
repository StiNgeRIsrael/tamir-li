import { useParams, Link, useNavigate } from "react-router-dom";
import { getToolByFormatSlug, getToolById, getDefaultSlug, buildFormatSlug, getRelatedTools, categoryLabels, type Tool } from "@/lib/tools-data";
import { AppLayout } from "@/components/AppLayout";
import { FileDropZone } from "@/components/FileDropZone";
import { AdSlot } from "@/components/AdSlot";
import { PremiumBanner, PremiumLock, ConversionSuccessUsage } from "@/components/PremiumComponents";
import { triggerInterstitial } from "@/components/AdSlot";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SEOHead } from "@/components/SEOHead";
import { PdfManagerTool } from "@/components/tools/PdfManagerTool";
import { TextToolsComponent } from "@/components/tools/TextToolsComponent";
import { useState, useCallback } from "react";
import { ArrowLeft, Download, Loader2, CheckCircle2, Crown, X, RefreshCw, Plus, ImageIcon, FileText, FileVideo, FileAudio, Shield, Zap, Globe } from "lucide-react";

interface FileWithFormat {
  file: File;
  outputFormat: string;
  thumbnail?: string;
  progress: number;
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
  const { slug } = useParams();
  const navigate = useNavigate();

  // Try format slug first (e.g. "jpg-to-png"), fallback to tool id
  const formatMatch = slug ? getToolByFormatSlug(slug) : null;
  const legacyTool = slug ? getToolById(slug) : null;

  const tool = formatMatch?.tool || legacyTool || null;
  const activeFrom = formatMatch?.from || tool?.fromFormats[0] || "";
  const activeTo = formatMatch?.to || tool?.toFormats[0] || "";

  const [fileItems, setFileItems] = useState<FileWithFormat[]>([]);
  const [converting, setConverting] = useState(false);
  const [allDone, setAllDone] = useState(false);
  const [usedToday] = useState(3);
  const maxDaily = 5;
  const [premiumUnlocked, setPremiumUnlocked] = useState(false);

  // Navigate to new slug when format changes
  const changeFrom = (from: string) => {
    const to = from === activeTo ? (tool?.toFormats.find(f => f !== from) || activeTo) : activeTo;
    navigate(`/${buildFormatSlug(from, to)}`, { replace: true });
  };

  const changeTo = (to: string) => {
    const from = to === activeFrom ? (tool?.fromFormats.find(f => f !== to) || activeFrom) : activeFrom;
    navigate(`/${buildFormatSlug(from, to)}`, { replace: true });
  };

  const generateThumbnail = useCallback((file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith("image/")) { resolve(undefined); return; }
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
        outputFormat: activeTo,
        thumbnail: await generateThumbnail(file),
        progress: 0,
        status: "pending" as const,
      }))
    );
    setFileItems((prev) => [...prev, ...newItems]);
  }, [activeTo, generateThumbnail]);

  const removeFile = (index: number) => {
    setFileItems((prev) => prev.filter((_, i) => i !== index));
  };

  const setFileFormat = (index: number, format: string) => {
    setFileItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, outputFormat: format } : item))
    );
  };

  const allHaveFormat = fileItems.length > 0 && fileItems.every((f) => f.outputFormat);

  const handleConvert = () => {
    if (!allHaveFormat) return;
    triggerInterstitial();
    setConverting(true);

    fileItems.forEach((_, index) => {
      const startDelay = index * 400;
      setTimeout(() => {
        setFileItems((prev) =>
          prev.map((item, i) => (i === index ? { ...item, status: "converting", progress: 0 } : item))
        );
        const steps = 20;
        const stepDuration = (1500 + Math.random() * 1000) / steps;
        for (let step = 1; step <= steps; step++) {
          setTimeout(() => {
            setFileItems((prev) =>
              prev.map((item, i) =>
                i === index
                  ? { ...item, progress: Math.min(Math.round((step / steps) * 100), 100), ...(step === steps ? { status: "done" as const } : {}) }
                  : item
              )
            );
          }, step * stepDuration);
        }
      }, startDelay);
    });

    const totalTime = fileItems.length * 400 + 2500;
    setTimeout(() => {
      setConverting(false);
      setAllDone(true);
      triggerInterstitial();
    }, totalTime);
  };

  const handleReset = () => {
    setFileItems([]);
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

  const pageTitle = `המרת ${activeFrom} ל-${activeTo} — תמיר לי`;
  const pageDesc = `המירו קבצי ${activeFrom} ל-${activeTo} בחינם, ישירות בדפדפן. מהיר, מאובטח, וללא הורדת תוכנה. תמיר לי — אתר המרות הקבצים של ישראל.`;
  const related = getRelatedTools(tool);

  return (
    <AppLayout>
      <SEOHead
        title={pageTitle}
        description={pageDesc}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": pageTitle,
          "description": pageDesc,
          "url": `https://tamirli.co.il/${buildFormatSlug(activeFrom, activeTo)}`,
          "applicationCategory": "UtilityApplication",
          "operatingSystem": "Any",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "ILS" },
          "inLanguage": "he"
        }}
      />
      <div className="max-w-4xl lg:max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 space-y-6 lg:space-y-8">
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">דף הבית</Link>
          <span>/</span>
          <span>{categoryLabels[tool.category]}</span>
          <span>/</span>
          <span className="text-foreground font-medium">המרת {activeFrom} ל-{activeTo}</span>
        </nav>

        {/* Header with format selectors */}
        <header className="space-y-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl lg:text-3xl font-extrabold text-foreground">
              המרת {activeFrom} ל-{activeTo}
            </h1>
            {tool.premium && <Crown className="w-5 h-5 text-premium" />}
          </div>
          <p className="text-sm text-muted-foreground">{tool.longDescription || tool.description}</p>

          {/* Format selector badges */}
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-3 py-1.5">
              <span className="text-muted-foreground text-xs">מ:</span>
              <Select value={activeFrom} onValueChange={changeFrom}>
                <SelectTrigger className="w-20 h-7 text-xs border-0 bg-muted font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tool.fromFormats.map((fmt) => (
                    <SelectItem key={fmt} value={fmt}>{fmt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
            <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-3 py-1.5">
              <span className="text-muted-foreground text-xs">ל:</span>
              <Select value={activeTo} onValueChange={changeTo}>
                <SelectTrigger className="w-20 h-7 text-xs border-0 bg-primary/10 font-semibold text-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tool.toFormats.filter(f => f !== activeFrom).map((fmt) => (
                    <SelectItem key={fmt} value={fmt}>{fmt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-success" /> מאובטח</span>
            <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-accent" /> מהיר</span>
            <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5 text-primary" /> אונליין</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-success" /> חינם</span>
          </div>
        </header>

        {tool.customComponent === "pdf-manager" ? (
          <PdfManagerTool />
        ) : tool.customComponent === "text-tools" ? (
          <TextToolsComponent />
        ) : tool.premium && !premiumUnlocked ? (
          <PremiumLock onUnlock={() => setPremiumUnlocked(true)} />
        ) : allDone ? (
          <div className="space-y-3 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 className="w-6 h-6 text-success" />
              <h2 className="text-xl font-bold">ההמרה הושלמה!</h2>
            </div>
            {fileItems.map((item, index) => {
              const Icon = getFileIcon(item.file);
              return (
                <div key={index} className="flex items-center gap-4 bg-card border border-success/30 rounded-xl px-4 py-3 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt={item.file.name} className="w-12 h-12 rounded-lg object-cover border border-border" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-success" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.file.name.replace(/\.[^.]+$/, '')}.{item.outputFormat.toLowerCase()}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(item.file.size)} → {item.outputFormat}</p>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                  <Button size="sm" variant="outline" className="shrink-0 text-success border-success/30 hover:bg-success/10">
                    <Download className="w-3.5 h-3.5 ml-1" />
                    הורד
                  </Button>
                </div>
              );
            })}
            <div className="flex items-center justify-between pt-3">
              <Button variant="outline" onClick={handleReset}>המרה נוספת</Button>
              <Button className="bg-success text-success-foreground hover:bg-success/90">
                <Download className="w-4 h-4 ml-2" />
                הורד הכל
              </Button>
            </div>
            <ConversionSuccessUsage used={usedToday + fileItems.length} max={maxDaily} />
            <AdSlot type="inline" className="mt-4" />
          </div>
        ) : (
          <div className="space-y-5">
            {fileItems.length === 0 && (
              <FileDropZone acceptedFormats={tool.fromFormats} onFilesSelected={handleFilesSelected} />
            )}
            {fileItems.length > 0 && (
              <div className="space-y-2 animate-fade-in">
                {fileItems.map((item, index) => {
                  const Icon = getFileIcon(item.file);
                  return (
                    <div key={index} className={`bg-card border rounded-xl px-4 py-3 transition-all duration-300 ${item.status === "done" ? "border-success/40" : item.status === "converting" ? "border-primary/40" : "border-border"}`}>
                      <div className="flex items-center gap-3">
                        {item.thumbnail ? (
                          <img src={item.thumbnail} alt={item.file.name} className="w-10 h-10 rounded-lg object-cover border border-border shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.file.name}</p>
                          <p className="text-xs text-muted-foreground">{formatFileSize(item.file.size)}</p>
                        </div>
                        {item.status === "converting" && <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />}
                        {item.status === "done" && <CheckCircle2 className="w-4 h-4 text-success shrink-0" />}
                        <div className="flex items-center gap-2 shrink-0">
                          <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
                          <Select value={item.outputFormat} onValueChange={(val) => setFileFormat(index, val)} disabled={converting}>
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
                        {!converting && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 opacity-50 hover:opacity-100" onClick={() => removeFile(index)}>
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                      {(item.status === "converting" || item.status === "done") && (
                        <div className="mt-2.5">
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-300 ease-out ${item.status === "done" ? "bg-success" : "bg-primary"}`} style={{ width: `${item.progress}%` }} />
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] text-muted-foreground">{item.status === "converting" ? "ממיר..." : "הושלם"}</span>
                            <span className="text-[10px] text-muted-foreground">{item.progress}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {!converting && (
                  <div className="flex items-center justify-between pt-2">
                    <Button variant="outline" size="sm" className="text-sm" onClick={() => document.getElementById("file-input")?.click()}>
                      <Plus className="w-4 h-4 ml-1" />
                      הוסף קבצים
                    </Button>
                    <Button onClick={handleConvert} disabled={!allHaveFormat || converting} className="h-10 px-8 font-bold bg-accent text-accent-foreground hover:bg-accent/90" size="lg">
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

        {/* SEO: How it works */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">איך להמיר {activeFrom} ל-{activeTo}?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { step: "1", title: `העלו קובץ ${activeFrom}`, desc: "גררו או בחרו את הקבצים שלכם" },
              { step: "2", title: `בחרו ${activeTo}`, desc: "הפורמט כבר מוגדר — אפשר לשנות" },
              { step: "3", title: "הורידו את התוצאה", desc: "הקובץ המומר מוכן תוך שניות" },
            ].map((s, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 text-center space-y-2">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center mx-auto">{s.step}</div>
                <h3 className="font-semibold text-sm text-foreground">{s.title}</h3>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <AdSlot type="inline" />

        {/* SEO: Related conversions */}
        {related.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-base font-bold text-foreground">המרות נוספות</h2>
            <div className="flex flex-wrap gap-2">
              {tool.fromFormats.flatMap(from =>
                tool.toFormats.filter(to => to !== from).map(to => (
                  <Link
                    key={`${from}-${to}`}
                    to={`/${buildFormatSlug(from, to)}`}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      from === activeFrom && to === activeTo
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                    }`}
                  >
                    {from} → {to}
                  </Link>
                ))
              )}
            </div>
          </section>
        )}

        <AdSlot type="banner" />

        {/* SEO rich text */}
        <section className="bg-card border border-border rounded-xl p-5 space-y-2 text-sm text-muted-foreground leading-relaxed">
          <h2 className="text-base font-bold text-foreground">המרת {activeFrom} ל-{activeTo} אונליין</h2>
          <p>
            תמיר לי מאפשר לכם להמיר קבצי {activeFrom} ל-{activeTo} בחינם, ישירות בדפדפן.
            אין צורך להוריד תוכנה או להירשם — פשוט העלו את הקובץ, בחרו את הפורמט הרצוי, ולחצו "המר".
            הקבצים שלכם מעובדים באופן מאובטח ואינם נשמרים על השרתים שלנו.
          </p>
          <p>
            הכלי תומך בהמרה בין כל הפורמטים: {tool.fromFormats.join(", ")} → {tool.toFormats.join(", ")}.
            ניתן לבצע עד 5 המרות בחינם ביום. צריכים יותר? שדרגו לפרימיום ב-₪4.90 בלבד לחודש.
          </p>
        </section>

        <AdSlot type="inline" />
      </div>
    </AppLayout>
  );
}
