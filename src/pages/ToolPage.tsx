import { useParams, Link, useNavigate } from "react-router-dom";
import { getToolByFormatSlug, getToolById, getDefaultSlug, buildFormatSlug, getRelatedTools, categoryIcons, type Tool, type ToolCategory } from "@/lib/tools-data";
import { AppLayout } from "@/components/AppLayout";
import { FileDropZone } from "@/components/FileDropZone";
import { AdSlot } from "@/components/AdSlot";
import { AdNativeSlot } from "@/components/ads/AdNativeSlot";
import { PremiumBanner, PremiumLock, DailyLimitLock, ConversionSuccessUsage, UsageLimitNotice, FreePremiumComparison } from "@/components/PremiumComponents";
import { InternalToolLinks } from "@/components/InternalToolLinks";
import { showAdVignette } from "@/components/ads/AdVignette";
import { handleGatedDownload, triggerFileDownload, triggerBlobDownload, type DownloadGateState } from "@/lib/ads/download-gate";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SEOHead, toolCategoryOgImage } from "@/components/SEOHead";
import { ToolSeoBlocks, toolFaqJsonLd } from "@/components/ToolSeoBlocks";
import { TOP_TOOL_IDS } from "@/lib/tool-seo-content";
import { PdfManagerTool } from "@/components/tools/PdfManagerTool";
import { TextToolsComponent } from "@/components/tools/TextToolsComponent";
import { AiImageGeneratorTool } from "@/components/tools/AiImageGeneratorTool";
import { ImageResizerTool } from "@/components/tools/ImageResizerTool";
import { ImageCompressorTool } from "@/components/tools/ImageCompressorTool";
import { HebOcrTool } from "@/components/tools/HebOcrTool";
import { useState, useCallback, useEffect, useRef } from "react";
import { ArrowLeft, ArrowRight, Download, Loader2, CheckCircle2, Crown, X, RefreshCw, Plus, ImageIcon, FileText, FileVideo, FileAudio, Shield, Zap, Globe, AlertCircle } from "lucide-react";
import { useLocale, localePath, htmlLangTag } from "@/lib/i18n";
import { siteUrl } from "@/lib/site";
import { allowMockFileConversion } from "@/lib/feature-flags";
import { getApiBaseUrl } from "@/lib/api/client";
import { useToolConfig } from "@/contexts/ToolConfigContext";
import { toast } from "sonner";
import { ANALYTICS_EVENTS, trackEvent } from "@/lib/analytics/events";
import { useUsage } from "@/hooks/useUsage";
import { useSubscription } from "@/hooks/useSubscription";
import { useConversionJob } from "@/hooks/useConversionJob";
import { hasAdSurface } from "@/lib/custom-tool-freemium";
import { isToolFunctional } from "@/lib/tool-availability";
import { convertImageFile, isOutputFormatSupported, usesClientImageConversion } from "@/lib/image-convert";
import { usesClientDocumentConversion } from "@/lib/document-convert";
import { convertWordFileToPdf } from "@/lib/word-to-pdf";
import { isServerUnavailableError } from "@/lib/conversion-errors";
import { ComingSoonPanel } from "@/components/ComingSoonPanel";
import { DownloadGateIndicator } from "@/components/ads/DownloadGateIndicator";

const categoryHeaderIcon: Record<ToolCategory, string> = {
  image: "bg-tool-image/10 text-tool-image",
  video: "bg-tool-video/10 text-tool-video",
  audio: "bg-tool-audio/10 text-tool-audio",
  document: "bg-tool-document/10 text-tool-document",
  ai: "bg-premium/10 text-premium",
};

interface FileWithFormat {
  file: File;
  outputFormat: string;
  thumbnail?: string;
  progress: number;
  status: "pending" | "converting" | "done" | "error";
  resultBlob?: Blob;
  errorMessage?: string;
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
  const [converted, setConverted] = useState(false);
  const [showSuccessPanel, setShowSuccessPanel] = useState(false);
  const [downloadGate, setDownloadGate] = useState<DownloadGateState>({});
  const [allDownloadGate, setAllDownloadGate] = useState(false);
  const { used: usedToday, max: maxDaily, isPremium: usageIsPremium, atLimit, recordUsage } = useUsage();
  const { isPremium: isSubPremium } = useSubscription();
  const { startJob: startConversionJob, polling: jobPolling } = useConversionJob();
  const isPremium = isSubPremium || usageIsPremium;
  const isProcessing = converting || jobPolling;
  const [usageUnlocked, setUsageUnlocked] = useState(false);
  const [premiumUnlocked, setPremiumUnlocked] = useState(false);
  const [serverUnavailable, setServerUnavailable] = useState(false);
  const atUsageLimit = atLimit && !usageUnlocked && !isPremium;
  const showPremiumToolLock = tool?.premium && !isSubPremium && !premiumUnlocked;
  const convertSuccessHandled = useRef(false);
  const usageRecordedOnServer = useRef(false);

  useEffect(() => {
    if (!tool) return;
    trackEvent(ANALYTICS_EVENTS.TOOL_VIEW, { tool_id: tool.id, slug: slug ?? "" });

    if (isPremium) return;

    if (!hasAdSurface()) return;

    const key = `tamir_tool_vignette_${tool.id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");

    // Defer until after first paint so SPA navigations don't show a blank overlay.
    const timer = window.setTimeout(() => {
      void showAdVignette({ minMs: 3500, slotId: "tool-first-visit-vignette" });
    }, 600);
    return () => window.clearTimeout(timer);
  }, [tool, slug, isPremium]);

  useEffect(() => {
    if (!tool?.premium || premiumUnlocked || isSubPremium) return;
    trackEvent(ANALYTICS_EVENTS.PAYWALL_HIT, { tool_id: tool.id, type: "premium_tool" });
  }, [tool, premiumUnlocked, isSubPremium]);

  useEffect(() => {
    if (!tool || isPremium || usageUnlocked || !atLimit) return;
    trackEvent(ANALYTICS_EVENTS.PAYWALL_HIT, { tool_id: tool.id, type: "daily_limit" });
  }, [tool, isPremium, usageUnlocked, atLimit]);

  useEffect(() => {
    if (!converted) {
      convertSuccessHandled.current = false;
      return;
    }
    if (showSuccessPanel || !tool || convertSuccessHandled.current) return;

    convertSuccessHandled.current = true;

    const revealSuccess = (skipUsageRecord = false) => {
      setShowSuccessPanel(true);
      trackEvent(ANALYTICS_EVENTS.CONVERT_SUCCESS, {
        tool_id: tool.id,
        from_format: activeFrom,
        to_format: activeTo,
        file_count: fileItems.length,
      });
      if (!skipUsageRecord) {
        recordUsage({ toolId: tool.id, fromFormat: activeFrom, toFormat: activeTo }).catch(() => {});
      }
    };

    const skipUsageRecord = usageRecordedOnServer.current;
    if (skipUsageRecord) usageRecordedOnServer.current = false;

    if (isPremium) {
      revealSuccess(skipUsageRecord);
      return;
    }

    void showAdVignette({ minMs: 4000, slotId: "convert-success-vignette" }).then(() =>
      revealSuccess(skipUsageRecord)
    );
  }, [converted, showSuccessPanel, tool, activeFrom, activeTo, fileItems.length, recordUsage, isPremium]);

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
    if (tool) {
      trackEvent(ANALYTICS_EVENTS.FILE_UPLOAD, { tool_id: tool.id, file_count: files.length });
    }
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
    setServerUnavailable(false);
  }, [activeTo, generateThumbnail, tool]);

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
    trackEvent(ANALYTICS_EVENTS.CONVERT_START, {
      tool_id: tool!.id,
      from_format: activeFrom,
      to_format: activeTo,
      file_count: fileItems.length,
    });
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
      setConverted(true);
    }, totalTime);
  };

  const handleConvert = async () => {
    if (!allHaveFormat || !tool) return;

    if (atUsageLimit) {
      trackEvent(ANALYTICS_EVENTS.PAYWALL_HIT, { tool_id: tool.id, type: "daily_limit" });
      return;
    }

    if (usesClientImageConversion(tool.id, tool.fromFormats, tool.toFormats)) {
      trackEvent(ANALYTICS_EVENTS.CONVERT_START, {
        tool_id: tool.id,
        from_format: activeFrom,
        to_format: activeTo,
        file_count: fileItems.length,
      });
      setConverting(true);
      let hadError = false;

      for (let index = 0; index < fileItems.length; index++) {
        setFileItems((prev) =>
          prev.map((item, i) =>
            i === index ? { ...item, status: "converting", progress: 0, errorMessage: undefined } : item
          )
        );

        try {
          const item = fileItems[index];
          const blob = await convertImageFile(item.file, item.outputFormat);
          setFileItems((prev) =>
            prev.map((it, i) =>
              i === index ? { ...it, status: "done", progress: 100, resultBlob: blob } : it
            )
          );
        } catch {
          hadError = true;
          setFileItems((prev) =>
            prev.map((it, i) =>
              i === index
                ? { ...it, status: "error", progress: 0, errorMessage: tt.conversionFormatError }
                : it
            )
          );
        }
      }

      setConverting(false);
      if (!hadError) {
        setConverted(true);
      } else {
        toast.error(tt.conversionFormatError);
      }
      return;
    }

    if (usesClientDocumentConversion(tool.id)) {
      trackEvent(ANALYTICS_EVENTS.CONVERT_START, {
        tool_id: tool.id,
        from_format: activeFrom,
        to_format: activeTo,
        file_count: fileItems.length,
      });
      setConverting(true);
      let hadError = false;

      for (let index = 0; index < fileItems.length; index++) {
        setFileItems((prev) =>
          prev.map((item, i) =>
            i === index ? { ...item, status: "converting", progress: 0, errorMessage: undefined } : item
          )
        );

        try {
          const item = fileItems[index];
          const blob = await convertWordFileToPdf(item.file);
          setFileItems((prev) =>
            prev.map((it, i) =>
              i === index ? { ...it, status: "done", progress: 100, resultBlob: blob } : it
            )
          );
        } catch (err) {
          hadError = true;
          const code = err instanceof Error ? err.message : "";
          const errorMessage =
            code === "LEGACY_DOC_NOT_SUPPORTED"
              ? tt.wordToPdfLegacyDocError
              : code === "EMPTY_DOCUMENT"
                ? tt.wordToPdfEmptyDocError
                : tt.documentConversionError;
          setFileItems((prev) =>
            prev.map((it, i) =>
              i === index ? { ...it, status: "error", progress: 0, errorMessage } : it
            )
          );
        }
      }

      setConverting(false);
      if (!hadError) {
        setConverted(true);
      } else {
        toast.error(tt.documentConversionError);
      }
      return;
    }

    if (allowMockFileConversion()) {
      runMockConversion();
      return;
    }

    const api = getApiBaseUrl();
    if (!api) {
      toast.error(tt.conversionNoApi);
      return;
    }

    trackEvent(ANALYTICS_EVENTS.CONVERT_START, {
      tool_id: tool.id,
      from_format: activeFrom,
      to_format: activeTo,
      file_count: fileItems.length,
    });
    setConverting(true);
    setServerUnavailable(false);
    setFileItems((prev) =>
      prev.map((item) => ({ ...item, status: "converting" as const, progress: 0, errorMessage: undefined }))
    );

    try {
      const result = await startConversionJob({
        toolId: tool.id,
        fromFormat: activeFrom,
        toFormat: activeTo,
        files: fileItems.map((item) => item.file),
      });

      if (result.kind === "not_ready") {
        toast.error(tt.conversionNotReady);
        setFileItems((prev) => prev.map((item) => ({ ...item, status: "pending" as const, progress: 0 })));
        return;
      }

      const outputBlob = result.outputBlob;
      setFileItems((prev) =>
        prev.map((item, index) => ({
          ...item,
          status: "done" as const,
          progress: 100,
          ...(outputBlob && index === 0 ? { resultBlob: outputBlob } : {}),
        }))
      );
      setConverted(true);
      usageRecordedOnServer.current = true;
      toast.success(tt.conversionDone);
    } catch (err) {
      const serverDown = isServerUnavailableError(err);
      setServerUnavailable(serverDown);
      const msg = serverDown ? tt.conversionServerError : tt.conversionApiError;
      toast.error(msg);
      setFileItems((prev) =>
        prev.map((item) => ({
          ...item,
          status: "error" as const,
          progress: 0,
          errorMessage: msg,
        }))
      );
    } finally {
      setConverting(false);
    }
  };

  const handleReset = () => {
    setFileItems([]);
    setConverted(false);
    setShowSuccessPanel(false);
    setDownloadGate({});
    setAllDownloadGate(false);
    setServerUnavailable(false);
    usageRecordedOnServer.current = false;
  };

  const onDownloadFile = async (index: number) => {
    const item = fileItems[index];
    if (!item) return;
    const { triggered, nextState } = await handleGatedDownload(
      index,
      item.file,
      item.outputFormat,
      downloadGate,
      isPremium,
      item.resultBlob
    );
    setDownloadGate(nextState);
    if (triggered) {
      trackEvent(ANALYTICS_EVENTS.FILE_DOWNLOAD, { tool_id: tool!.id, file_index: index });
    }
  };

  const onDownloadAll = async () => {
    if (isPremium || allDownloadGate) {
      fileItems.forEach((item, index) => {
        const baseName = item.file.name.replace(/\.[^.]+$/, "");
        if (item.resultBlob) {
          triggerBlobDownload(item.resultBlob, baseName, item.outputFormat);
        } else {
          triggerFileDownload(item.file, item.outputFormat);
        }
      });
      trackEvent(ANALYTICS_EVENTS.FILE_DOWNLOAD_ALL, { tool_id: tool!.id, file_count: fileItems.length });
      return;
    }

    const adUrl = import.meta.env.VITE_AD_CLICK_URL?.trim();
    trackEvent(ANALYTICS_EVENTS.AD_CLICK_DOWNLOAD, { file_index: -1, method: adUrl ? "popup" : "vignette" });
    if (adUrl) {
      window.open(adUrl, "_blank", "noopener,noreferrer");
    } else {
      await showAdVignette({ minMs: 3000, slotId: "download-all-vignette" });
    }
    setAllDownloadGate(true);
  };

  if (toolCfgLoading && apiBase && tool) {
    return (
      <AppLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label={tt.loading ?? "Loading"} />
        </div>
      </AppLayout>
    );
  }

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
  const toolIsFunctional = isToolFunctional(tool.id);
  const availableToFormats = usesClientImageConversion(tool.id, tool.fromFormats, tool.toFormats)
    ? tool.toFormats.filter((f) => isOutputFormatSupported(f))
    : tool.toFormats;
  const pageTitle = isCustom
    ? `${toolName} — ${t.brandName}`
    : `${tt.convertTitle(activeFrom, activeTo)} — ${t.brandName}`;
  const pageDesc = tt.convertDesc(activeFrom, activeTo);
  const related = filterTools(getRelatedTools(tool)).slice(0, 3);
  const toolPagePath = isCustom ? `/${tool.id}` : `/${buildFormatSlug(activeFrom, activeTo)}`;
  const customFreemium = {
    toolId: tool.id,
    isPremium,
    atUsageLimit,
    usedToday,
    maxDaily,
    recordUsage: () => recordUsage({ toolId: tool.id }).catch(() => {}),
  };
  const toolPageUrl = siteUrl(localePath(toolPagePath, locale));
  const homeUrl = siteUrl(localePath("/", locale));

  const faqLd = TOP_TOOL_IDS.includes(tool.id) ? toolFaqJsonLd(tool.id, locale) : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: pageTitle,
        description: pageDesc,
        url: toolPageUrl,
        applicationCategory: "UtilityApplication",
        operatingSystem: "Any",
        offers: { "@type": "Offer", price: "0", priceCurrency: "ILS" },
        inLanguage: htmlLangTag(locale),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: tt.breadcrumbHome,
            item: homeUrl,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: catLabels[tool.category],
          },
          {
            "@type": "ListItem",
            position: 3,
            name: isCustom ? toolName : tt.convertTitle(activeFrom, activeTo),
            item: toolPageUrl,
          },
        ],
      },
      ...(faqLd ? [faqLd] : []),
    ],
  };

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

      <AdSlot type="inline" slotId="tool-sidebar-inline" eager={isProcessing || showSuccessPanel} />

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
        ogImage={toolCategoryOgImage(tool.category)}
        jsonLd={jsonLd}
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
        <header className="space-y-3 border-b border-border pb-5">
          <div className="flex items-start gap-3">
            {(() => {
              const CatIcon = categoryIcons[tool.category];
              return (
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${categoryHeaderIcon[tool.category]}`}>
                  <CatIcon className="h-5 w-5" />
                </div>
              );
            })()}
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
                  {isCustom ? toolName : tt.convertTitle(activeFrom, activeTo)}
                </h1>
                {tool.premium && <Crown className="w-5 h-5 text-premium shrink-0" />}
                {tool.id === "word-to-pdf" && (
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/25">
                    {tt.basicExportBadge}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground max-w-3xl">{toolLongDesc}</p>
            </div>
          </div>

          {!isCustom && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
                <span className="text-muted-foreground font-medium">{tt.from}</span>
                <Select value={activeFrom} onValueChange={changeFrom}>
                  <SelectTrigger className="h-8 w-24 border-0 bg-muted text-sm font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tool.fromFormats.map((fmt) => (
                      <SelectItem key={fmt} value={fmt}>{fmt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Arrow className="w-4 h-4 text-muted-foreground" />
              <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
                <span className="text-muted-foreground font-medium">{tt.to}</span>
                <Select value={activeTo} onValueChange={changeTo}>
                  <SelectTrigger className="h-8 w-24 border-0 bg-primary/10 text-sm font-semibold text-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableToFormats.filter(f => f !== activeFrom).map((fmt) => (
                      <SelectItem key={fmt} value={fmt}>{fmt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

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
            {!toolIsFunctional ? (
              <ComingSoonPanel toolName={toolName} toolId={tool.id} />
            ) : showPremiumToolLock ? (
              <PremiumLock onUnlock={() => setPremiumUnlocked(true)} />
            ) : atUsageLimit ? (
              <DailyLimitLock onUnlock={() => setUsageUnlocked(true)} />
            ) : tool.customComponent === "pdf-manager" ? (
              <PdfManagerTool freemium={customFreemium} />
            ) : tool.customComponent === "text-tools" ? (
              <TextToolsComponent freemium={customFreemium} />
            ) : tool.customComponent === "ai-image-generator" ? (
              <AiImageGeneratorTool />
            ) : tool.customComponent === "image-resizer" ? (
              <ImageResizerTool freemium={customFreemium} />
            ) : tool.customComponent === "image-compressor" ? (
              <ImageCompressorTool freemium={customFreemium} />
            ) : tool.customComponent === "heb-ocr" ? (
              <HebOcrTool />
            ) : showSuccessPanel ? (
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
                        {item.errorMessage && (
                          <p className="text-xs text-destructive">{item.errorMessage}</p>
                        )}
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                      <Button
                        size="sm"
                        variant="outline"
                        className={`shrink-0 ${downloadGate[index] ? "text-success border-success/30 hover:bg-success/10" : "text-primary border-primary/30 hover:bg-primary/5"}`}
                        onClick={() => onDownloadFile(index)}
                      >
                        <Download className="w-3.5 h-3.5 ml-1" />
                        {isPremium ? tt.download : downloadGate[index] ? tt.downloadNow : tt.watchAdToDownload}
                      </Button>
                    </div>
                  );
                })}
                <div className="flex flex-col gap-2 pt-3 sm:flex-row sm:items-center sm:justify-between">
                  <Button variant="outline" onClick={handleReset}>{tt.moreConversion}</Button>
                  <div className="flex flex-col items-stretch gap-2 sm:items-end">
                    {!isPremium && (
                      <DownloadGateIndicator
                        step1Done={allDownloadGate}
                        className="sm:max-w-xs"
                      />
                    )}
                    <Button
                      className={allDownloadGate ? "bg-success text-success-foreground hover:bg-success/90" : "bg-primary text-primary-foreground hover:bg-primary/90"}
                      onClick={onDownloadAll}
                    >
                      <Download className="w-4 h-4 ml-2" />
                      {isPremium ? tt.downloadAll : allDownloadGate ? tt.downloadAll : tt.watchAdToDownload}
                    </Button>
                  </div>
                </div>
                <ConversionSuccessUsage used={usedToday} max={maxDaily} />
                {!isPremium && (
                  <AdSlot type="inline" slotId="tool-download-area" className="mt-2" eager />
                )}
                <AdSlot type="inline" slotId="tool-after-success" className="mt-4" eager />
              </div>
            ) : converted ? (
              <div className="space-y-4 py-8 text-center">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">{tt.preparingDownload ?? tt.convertingWait}</p>
                {!isPremium && (
                  <AdSlot type="inline" slotId="tool-preparing-inline" className="mx-auto max-w-lg" eager />
                )}
              </div>
            ) : (
              <div className="space-y-5">
                {!isPremium && <UsageLimitNotice used={usedToday} max={maxDaily} />}
                {tool.id === "word-to-pdf" && (
                  <Alert className="border-amber-500/25 bg-amber-500/5">
                    <AlertCircle className="h-4 w-4 text-amber-700 dark:text-amber-400" />
                    <AlertDescription className="text-sm text-muted-foreground leading-relaxed">
                      {tt.basicExportNotice}
                    </AlertDescription>
                  </Alert>
                )}
                {fileItems.length === 0 && (
                  <section className="space-y-4">
                    <div className="flex items-start gap-3">
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground"
                        aria-hidden="true"
                      >
                        1
                      </span>
                      <div className="space-y-1 min-w-0">
                        <h2 className="text-lg font-semibold text-foreground">
                          {t.fileDropZone.uploadStepTitle(activeFrom, activeTo)}
                        </h2>
                        <p className="text-sm text-muted-foreground">{t.fileDropZone.uploadStepHint}</p>
                      </div>
                    </div>
                    <FileDropZone
                      inputId="tool-file-input"
                      emphasized
                      acceptedFormats={tool.fromFormats}
                      onFilesSelected={handleFilesSelected}
                    />
                  </section>
                )}
                {fileItems.length > 0 && (
                  <div className="space-y-3 animate-fade-in">
                    <div className="overflow-hidden rounded-md border border-border bg-card">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border">
                            <TableHead className="h-8 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{tt.queueFile ?? "File"}</TableHead>
                            <TableHead className="hidden sm:table-cell h-8 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{tt.queueSize ?? "Size"}</TableHead>
                            <TableHead className="h-8 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{tt.queueFormat ?? "Format"}</TableHead>
                            <TableHead className="hidden md:table-cell h-8 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{tt.queueStatus ?? "Status"}</TableHead>
                            <TableHead className="w-10 h-8 text-end" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {fileItems.map((item, index) => {
                            const Icon = getFileIcon(item.file);
                            const statusLabel =
                              item.status === "converting"
                                ? tt.converting
                                : item.status === "done"
                                  ? tt.done
                                  : item.status === "error"
                                    ? tt.error ?? "Error"
                                    : tt.queuePending ?? "Waiting";
                            return (
                              <TableRow key={index} className="hover:bg-muted/20">
                                <TableCell className="py-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    {item.thumbnail ? (
                                      <img src={item.thumbnail} alt="" className="h-8 w-8 rounded object-cover border border-border shrink-0" />
                                    ) : (
                                      <div className="flex h-8 w-8 items-center justify-center rounded border border-border bg-muted shrink-0">
                                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                                      </div>
                                    )}
                                    <span className="truncate text-sm font-medium">{item.file.name}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="hidden sm:table-cell py-2 font-mono text-xs text-muted-foreground">
                                  {formatFileSize(item.file.size)}
                                </TableCell>
                                <TableCell className="py-2">
                                  <Select value={item.outputFormat} onValueChange={(val) => setFileFormat(index, val)} disabled={converting}>
                                    <SelectTrigger className="h-7 w-[4.5rem] rounded border-0 bg-muted text-xs font-mono">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {availableToFormats.filter(f => f !== activeFrom).map((fmt) => (
                                        <SelectItem key={fmt} value={fmt}>{fmt}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell className="hidden md:table-cell py-2">
                                  <div className="flex items-center gap-1.5">
                                    {item.status === "converting" && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                                    {item.status === "done" && <CheckCircle2 className="h-3 w-3 text-success" />}
                                    {item.status === "error" && <X className="h-3 w-3 text-destructive" />}
                                    {item.status === "pending" && <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />}
                                    <span className={`text-xs ${item.status === "done" ? "text-success" : "text-muted-foreground"}`}>{statusLabel}</span>
                                  </div>
                                  {(item.status === "converting" || item.status === "done") && (
                                    <div className="mt-1 h-0.5 max-w-[100px] overflow-hidden rounded-full bg-muted">
                                      <div
                                        className={`h-full transition-all ${item.status === "done" ? "bg-success" : "bg-primary"}`}
                                        style={{ width: `${item.progress}%` }}
                                      />
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className="py-2 text-end">
                                  {!converting && (
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeFile(index)}>
                                      <X className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                    {serverUnavailable && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>{tt.conversionServerErrorTitle}</AlertTitle>
                        <AlertDescription>
                          {tt.conversionServerError}{" "}
                          <Link to={localePath("/contact", locale)} className="font-medium underline underline-offset-4">
                            {tt.conversionServerErrorContact}
                          </Link>
                        </AlertDescription>
                      </Alert>
                    )}
                    {!converting && (
                      <div className="flex items-center justify-between pt-1">
                        <Button variant="outline" size="sm" onClick={() => document.getElementById("tool-file-input")?.click()}>
                          <Plus className="w-4 h-4 me-1" />
                          {tt.addFiles}
                        </Button>
                        <Button onClick={handleConvert} disabled={!allHaveFormat || converting || atUsageLimit} size="lg">
                          <RefreshCw className="w-4 h-4 me-2" />
                          {tt.convertN(fileItems.length)}
                        </Button>
                      </div>
                    )}
                    {isProcessing && (
                      <div className="space-y-4 py-2 text-center">
                        <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">{tt.convertingWait}</p>
                        {!isPremium && (
                          <>
                            <p className="text-xs text-muted-foreground">
                              {tt.convertingPremiumHint}{" "}
                              <Link to={localePath("/premium", locale)} className="font-medium text-primary hover:underline">
                                {t.upgradePage.ctaMain}
                              </Link>
                            </p>
                            <AdSlot type="inline" slotId="tool-converting-inline" className="mx-auto max-w-lg" eager />
                            <AdSlot type="banner" slotId="tool-converting-banner" className="xl:hidden" eager />
                          </>
                        )}
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
        <AdNativeSlot slotId="tool-mid-native" className="mt-4" />

        {/* SEO rich text */}
        <section className="rounded-md border border-border bg-card p-4 lg:p-6 space-y-3 text-sm text-muted-foreground leading-relaxed">
          <h2 className="text-base font-bold text-foreground">
            {tt.seoTitle(toolName, activeFrom, activeTo, isCustom)}
          </h2>
          <p>{tt.seoText(toolName, activeFrom, activeTo, isCustom)}</p>
          {!isCustom && <p>{tt.seoFormats(tool.fromFormats, tool.toFormats)}</p>}
        </section>

        <FreePremiumComparison />

        {TOP_TOOL_IDS.includes(tool.id) && <ToolSeoBlocks toolId={tool.id} />}

        <InternalToolLinks />

        <AdSlot type="inline" slotId="tool-bottom" />
      </div>
    </AppLayout>
  );
}
