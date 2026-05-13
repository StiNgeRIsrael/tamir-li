import { useParams, Link, useNavigate } from "react-router-dom";
import { getToolByFormatSlug, getToolById, getDefaultSlug, buildFormatSlug, getRelatedTools, type Tool, type ToolCategory } from "@/lib/tools-data";
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
import { AiImageGeneratorTool } from "@/components/tools/AiImageGeneratorTool";
import { ImageResizerTool } from "@/components/tools/ImageResizerTool";
import { ImageCompressorTool } from "@/components/tools/ImageCompressorTool";
import { HebOcrTool } from "@/components/tools/HebOcrTool";
import { useState, useCallback } from "react";
import { ArrowLeft, ArrowRight, Download, Loader2, CheckCircle2, Crown, X, RefreshCw, Plus, ImageIcon, FileText, FileVideo, FileAudio, Shield, Zap, Globe } from "lucide-react";
import { useLocale, localePath, htmlLangTag } from "@/lib/i18n";
import { siteUrl } from "@/lib/site";
import { allowMockFileConversion } from "@/lib/feature-flags";
import { getApiBaseUrl } from "@/lib/api/client";
import { useToolConfig } from "@/contexts/ToolConfigContext";
import { toast } from "sonner";

const toolHeaderTint: Record<ToolCategory, string> = {
  image: "from-tool-image/10 via-card to-card dark:from-tool-image/18",
  video: "from-tool-video/10 via-card to-card dark:from-tool-video/18",
  audio: "from-tool-audio/10 via-card to-card dark:from-tool-audio/18",
  document: "from-tool-document/10 via-card to-card dark:from-tool-document/18",
  ai: "from-premium/12 via-card to-card dark:from-premium/18",
};

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
  const { locale, t, dir } = useLocale();
  const { isToolEnabled, loading: toolCfgLoading, filterTools } = useToolConfig();
  const apiBase = getApiBaseUrl();
  const isRtl = dir === "rtl";
  const Arrow = isRtl ? ArrowLeft : ArrowRight;
  const tt = t.tool;
  const toolNames = t.toolNames as Record<string, string>;
  const catLabels = t.categories as Record<string, string>;

  const formatMatch = slug ? getToolByFormatSlug(slug) : null;
  const legacyTool = slug ? getToolById(slug) : null;

  const tool = formatMatch?.tool || legacyTool || null;
  const disabledByAdmin = !!(tool && apiBase && !toolCfgLoading && !isToolEnabled(tool.id));
  const activeFrom = formatMatch?.from || tool?.fromFormats[0] || "";
  const activeTo = formatMatch?.to || tool?.toFormats[0] || "";

  const [fileItems, setFileItems] = useState<FileWithFormat[]>([]);
  const [converting, setConverting] = useState(false);
  const [allDone, setAllDone] = useState(false);
  const [usedToday] = useState(0);
  const maxDaily = 5;
  const [premiumUnlocked, setPremiumUnlocked] = useState(false);

  const changeFrom = (from: string) => {
    const to = from === activeTo ? (tool?.toFormats.find(f => f !== from) || activeTo) : activeTo;
    navigate(localePath(`/${buildFormatSlug(from, to)}`, locale), { replace: true, preventScrollReset: true });
  };

  const changeTo = (to: string) => {
    const from = to === activeFrom ? (tool?.fromFormats.find(f => f !== to) || activeFrom) : activeFrom;
    navigate(localePath(`/${buildFormatSlug(from, to)}`, locale), { replace: true, preventScrollReset: true });
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

  const runMockConversion = () => {
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

  const handleConvert = async () => {
    if (!allHaveFormat || !tool) return;

    if (allowMockFileConversion()) {
      runMockConversion();
      return;
    }

    const api = getApiBaseUrl();
    if (!api) {
      toast.error(tt.conversionNoApi);
      return;
    }

    triggerInterstitial();
    setConverting(true);
    try {
      const fd = new FormData();
      fd.append("toolId", tool.id);
      fd.append("fromFormat", activeFrom);
      fd.append("toFormat", activeTo);
      fileItems.forEach((item) => fd.append("files", item.file));

      const res = await fetch(`${api}/api/conversions`, { method: "POST", body: fd, credentials: "include" });

      if (res.status === 501) {
        toast.error(tt.conversionNotReady);
        return;
      }
      if (!res.ok) {
        toast.error(tt.conversionApiError);
        return;
      }

      setAllDone(true);
      toast.success(tt.conversionDone);
    } catch {
      toast.error(tt.conversionApiError);
    } finally {
      setConverting(false);
    }
  };

  const handleReset = () => {
    setFileItems([]);
    setAllDone(false);
  };

  if (!tool || disabledByAdmin) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh] text-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">{tt.notFound}</h1>
            <Link to={localePath("/", locale)} className="text-primary hover:underline">{tt.backHome}</Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const toolName = toolNames[tool.id] || tool.name;
  const toolLongDescs = t.toolLongDescriptions as Record<string, string>;
  const toolLongDesc = toolLongDescs?.[tool.id] || tool.longDescription;
  const isCustom = !!tool.customComponent;
  const pageTitle = isCustom
    ? `${toolName} — ${t.brandName}`
    : `${tt.convertTitle(activeFrom, activeTo)} — ${t.brandName}`;
  const pageDesc = tt.convertDesc(activeFrom, activeTo);
  const related = filterTools(getRelatedTools(tool)).slice(0, 3);

  const SidebarContent = () => (
    <div className="space-y-5">
      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-foreground">{tt.whyUs}</h3>
        <div className="space-y-2.5">
          <span className="flex items-center gap-2 text-sm text-muted-foreground"><Shield className="w-4 h-4 text-success shrink-0" /> {tt.secure}</span>
          <span className="flex items-center gap-2 text-sm text-muted-foreground"><Zap className="w-4 h-4 text-accent shrink-0" /> {tt.fast}</span>
          <span className="flex items-center gap-2 text-sm text-muted-foreground"><Globe className="w-4 h-4 text-primary shrink-0" /> {tt.online}</span>
          <span className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle2 className="w-4 h-4 text-success shrink-0" /> {tt.free}</span>
        </div>
      </div>

      <AdSlot type="inline" slotId="tool-sidebar-inline" />

      {related.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-foreground">{tt.moreConversions}</h3>
          <div className="flex flex-wrap gap-1.5">
            {tool.fromFormats.flatMap(from =>
              tool.toFormats.filter(to => to !== from).map(to => (
                <Link
                  key={`${from}-${to}`}
                  to={localePath(`/${buildFormatSlug(from, to)}`, locale)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${from === activeFrom && to === activeTo
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                    }`}
                >
                  {from} → {to}
                </Link>
              ))
            )}
          </div>
        </div>
      )}

      <AdSlot type="banner" slotId="tool-sidebar-banner" />
    </div>
  );

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
          "url": siteUrl(localePath(`/${buildFormatSlug(activeFrom, activeTo)}`, locale)),
          "applicationCategory": "UtilityApplication",
          "operatingSystem": "Any",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "ILS" },
          "inLanguage": htmlLangTag(locale),
        }}
      />
      <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 lg:py-10 space-y-6 lg:space-y-8">
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to={localePath("/", locale)} className="hover:text-foreground transition-colors">{tt.breadcrumbHome}</Link>
          <span>/</span>
          <span>{catLabels[tool.category]}</span>
          <span>/</span>
          <span className="text-foreground font-medium">
            {isCustom ? toolName : tt.convertTitle(activeFrom, activeTo)}
          </span>
        </nav>

        {/* Header */}
        <header
          className={`space-y-3 animate-fade-in rounded-2xl border border-border/70 bg-gradient-to-br ${toolHeaderTint[tool.category]} p-5 shadow-md shadow-black/[0.04] backdrop-blur-sm lg:p-6 dark:shadow-black/20`}
        >
          <div className="flex items-center gap-2">
            <h1 className="bg-gradient-to-l from-foreground to-foreground/80 bg-clip-text text-2xl font-extrabold text-transparent lg:text-3xl xl:text-4xl dark:from-white dark:to-white/85">
              {isCustom ? toolName : tt.convertTitle(activeFrom, activeTo)}
            </h1>
            {tool.premium && <Crown className="w-5 h-5 text-premium" />}
          </div>
          <p className="text-sm lg:text-base text-muted-foreground max-w-3xl">{toolLongDesc}</p>

          {!isCustom && (
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
              <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2.5">
                <span className="text-muted-foreground text-sm font-medium">{tt.from}</span>
                <Select value={activeFrom} onValueChange={changeFrom}>
                  <SelectTrigger className="w-24 h-9 text-sm border-0 bg-muted font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tool.fromFormats.map((fmt) => (
                      <SelectItem key={fmt} value={fmt}>{fmt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Arrow className="w-5 h-5 text-muted-foreground" />
              <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2.5">
                <span className="text-muted-foreground text-sm font-medium">{tt.to}</span>
                <Select value={activeTo} onValueChange={changeTo}>
                  <SelectTrigger className="w-24 h-9 text-sm border-0 bg-primary/10 font-bold text-primary">
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
          )}

          {/* Trust badges — mobile only */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground xl:hidden">
            <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-success" /> {tt.secureBadge}</span>
            <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-accent" /> {tt.fastBadge}</span>
            <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5 text-primary" /> {tt.onlineBadge}</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-success" /> {tt.freeBadge}</span>
          </div>
        </header>

        {/* Main content: tool + desktop sidebar */}
        <div className={`grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-6 xl:gap-8`}>
          <aside className="hidden xl:block">
            <div className="sticky top-20">
              <SidebarContent />
            </div>
          </aside>

          <div className="min-w-0">
            {tool.customComponent === "pdf-manager" ? (
              <PdfManagerTool />
            ) : tool.customComponent === "text-tools" ? (
              <TextToolsComponent />
            ) : tool.customComponent === "ai-image-generator" ? (
              <AiImageGeneratorTool />
            ) : tool.customComponent === "image-resizer" ? (
              <ImageResizerTool />
            ) : tool.customComponent === "image-compressor" ? (
              <ImageCompressorTool />
            ) : tool.customComponent === "heb-ocr" ? (
              <HebOcrTool />
            ) : tool.premium && !premiumUnlocked ? (
              <PremiumLock onUnlock={() => setPremiumUnlocked(true)} />
            ) : allDone ? (
              <div className="space-y-3 animate-fade-in">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle2 className="w-6 h-6 text-success" />
                  <h2 className="text-xl font-bold">{tt.conversionDone}</h2>
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
                        {tt.download}
                      </Button>
                    </div>
                  );
                })}
                <div className="flex items-center justify-between pt-3">
                  <Button variant="outline" onClick={handleReset}>{tt.moreConversion}</Button>
                  <Button className="bg-success text-success-foreground hover:bg-success/90">
                    <Download className="w-4 h-4 ml-2" />
                    {tt.downloadAll}
                  </Button>
                </div>
                <ConversionSuccessUsage used={usedToday + fileItems.length} max={maxDaily} />
                <AdSlot type="inline" slotId="tool-after-success" className="mt-4" />
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
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {tool.toFormats.filter(f => f !== activeFrom).map((fmt) => (
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
                                <span className="text-[10px] text-muted-foreground">{item.status === "converting" ? tt.converting : tt.done}</span>
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
                          {tt.addFiles}
                        </Button>
                        <Button onClick={handleConvert} disabled={!allHaveFormat || converting} className="h-10 px-8 font-bold bg-accent text-accent-foreground hover:bg-accent/90" size="lg">
                          <RefreshCw className="w-4 h-4 ml-2" />
                          {tt.convertN(fileItems.length)}
                        </Button>
                      </div>
                    )}
                    {converting && (
                      <div className="text-center py-2 text-sm text-muted-foreground animate-fade-in">
                        <Loader2 className="w-5 h-5 mx-auto animate-spin mb-2 text-primary" />
                        {tt.convertingWait}
                      </div>
                    )}
                  </div>
                )}
                <AdSlot type="banner" slotId="tool-mobile-banner" className="xl:hidden" />
              </div>
            )}
          </div>
        </div>

        {/* Mobile: related conversions */}
        <div className="xl:hidden space-y-6">
          {related.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-base font-bold text-foreground">{tt.moreConversions}</h2>
              <div className="flex flex-wrap gap-2">
                {tool.fromFormats.flatMap(from =>
                  tool.toFormats.filter(to => to !== from).map(to => (
                    <Link
                      key={`${from}-${to}`}
                      to={localePath(`/${buildFormatSlug(from, to)}`, locale)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${from === activeFrom && to === activeTo
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
        </div>

        <PremiumBanner />

        {/* SEO: How it works */}
        <section className="space-y-4">
          <h2 className="text-lg lg:text-xl font-bold text-foreground">
            {tt.howToTitle(toolName, activeFrom, activeTo, isCustom)}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
            {(tt.howToSteps(toolName, activeFrom, activeTo, isCustom) as { step: string; title: string; desc: string }[]).map((s, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-5 lg:p-6 text-center space-y-2 lg:space-y-3">
                <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-primary text-primary-foreground font-bold text-sm lg:text-base flex items-center justify-center mx-auto">{s.step}</div>
                <h3 className="font-semibold text-sm lg:text-base text-foreground">{s.title}</h3>
                <p className="text-xs lg:text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <AdSlot type="inline" slotId="tool-mid-page" />

        {/* SEO rich text */}
        <section className="bg-card border border-border rounded-xl p-5 lg:p-8 space-y-3 text-sm lg:text-base text-muted-foreground leading-relaxed">
          <h2 className="text-base lg:text-lg font-bold text-foreground">
            {tt.seoTitle(toolName, activeFrom, activeTo, isCustom)}
          </h2>
          <p>{tt.seoText(toolName, activeFrom, activeTo, isCustom)}</p>
          {!isCustom && <p>{tt.seoFormats(tool.fromFormats, tool.toFormats)}</p>}
        </section>

        <AdSlot type="inline" slotId="tool-bottom" />
      </div>
    </AppLayout>
  );
}
