import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AdSlot } from "@/components/AdSlot";
import { UsageLimitNotice } from "@/components/PremiumComponents";
import {
  Copy,
  Download,
  ArrowLeftRight,
  Hash,
  Type,
  AlignLeft,
  CaseSensitive,
  CaseUpper,
  CaseLower,
  CheckCircle2,
  Code,
} from "lucide-react";
import { useLocale, useT } from "@/lib/i18n";
import {
  type CustomToolFreemiumProps,
  onCustomToolSuccess,
  runGatedDownload,
  trackCustomToolStart,
} from "@/lib/custom-tool-freemium";
import {
  type TextFormat,
  convertText,
  getTextStats,
  toTitleCase,
  cleanWhitespace,
  plainTextForEditing,
} from "@/lib/text-convert";

const ALL_FORMATS: TextFormat[] = ["plain", "markdown", "html"];

function otherFormat(current: TextFormat): TextFormat {
  return ALL_FORMATS.find((f) => f !== current) ?? "html";
}

type Props = { freemium?: CustomToolFreemiumProps };

export function TextToolsComponent({ freemium }: Props) {
  const t = useT();
  const { t: localeT } = useLocale();
  const tt = localeT.tool;
  const textT = t.textTools;
  const [input, setInput] = useState("");
  const [inputFormat, setInputFormat] = useState<TextFormat>("plain");
  const [outputFormat, setOutputFormat] = useState<TextFormat>("html");
  const [copied, setCopied] = useState(false);
  const [downloadGate, setDownloadGate] = useState(false);
  const [usageRecorded, setUsageRecorded] = useState(false);

  const isPremium = freemium?.isPremium ?? false;
  const atUsageLimit = freemium?.atUsageLimit ?? false;

  const formatLabels: Record<TextFormat, string> = {
    plain: textT.plainText || "Plain Text",
    markdown: "Markdown",
    html: "HTML",
  };
  const output = input.trim() ? convertText(input, inputFormat, outputFormat) : "";
  const stats = getTextStats(input, inputFormat);

  const resetFreemiumState = () => {
    setUsageRecorded(false);
    setDownloadGate(false);
  };

  const setPlainInput = (text: string) => {
    setInput(text);
    setInputFormat("plain");
    resetFreemiumState();
  };

  const handleInputFormatChange = (value: TextFormat) => {
    setInputFormat(value);
    if (outputFormat === value) setOutputFormat(otherFormat(value));
    resetFreemiumState();
  };

  const handleSwapFormats = () => {
    if (!input.trim() && !output.trim()) return;
    const nextInput = output || input;
    const nextInputFormat = output.trim() ? outputFormat : inputFormat;
    const nextOutputFormat = inputFormat;
    setInput(nextInput);
    setInputFormat(nextInputFormat);
    setOutputFormat(nextOutputFormat);
    resetFreemiumState();
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    if (!output || atUsageLimit) return;
    if (freemium?.toolId) trackCustomToolStart(freemium.toolId);
    if (freemium && !usageRecorded) {
      await onCustomToolSuccess(freemium.isPremium, freemium.recordUsage, freemium.toolId);
      setUsageRecorded(true);
    }
    const ext = outputFormat === "html" ? "html" : outputFormat === "markdown" ? "md" : "txt";
    const downloadFn = () => {
      const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `converted.${ext}`;
      a.click();
    };
    const { triggered, gateOpen } = await runGatedDownload(downloadGate, isPremium, downloadFn, {
      toolId: freemium?.toolId,
    });
    setDownloadGate(gateOpen);
    if (!triggered) return;
  };

  const downloadLabel = isPremium
    ? textT.downloadAs(outputFormat === "html" ? "HTML" : outputFormat === "markdown" ? "MD" : "TXT")
    : tt.download;

  return (
    <div className="space-y-5">
      {freemium && !isPremium && <UsageLimitNotice used={freemium.usedToday} max={freemium.maxDaily} />}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2">
          <span className="text-xs text-muted-foreground">{textT.from}</span>
          <Select value={inputFormat} onValueChange={(v) => handleInputFormatChange(v as TextFormat)}>
            <SelectTrigger className="w-28 h-7 text-xs border-0 bg-muted font-semibold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ALL_FORMATS.map((f) => (
                <SelectItem key={f} value={f}>
                  {formatLabels[f]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={handleSwapFormats}
          disabled={!input.trim() && !output.trim()}
          title={textT.swapFormats ?? "Swap formats"}
          aria-label={textT.swapFormats ?? "Swap formats"}
        >
          <ArrowLeftRight className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2">
          <span className="text-xs text-muted-foreground">{textT.to}</span>
          <Select
            value={outputFormat}
            onValueChange={(v) => {
              setOutputFormat(v as TextFormat);
              resetFreemiumState();
            }}
          >
            <SelectTrigger className="w-28 h-7 text-xs border-0 bg-primary/10 font-semibold text-primary">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ALL_FORMATS.filter((f) => f !== inputFormat).map((f) => (
                <SelectItem key={f} value={f}>
                  {formatLabels[f]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={() => setPlainInput(plainTextForEditing(input, inputFormat).toUpperCase())}
        >
          <CaseUpper className="w-3.5 h-3.5 me-1" />
          UPPERCASE
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={() => setPlainInput(plainTextForEditing(input, inputFormat).toLowerCase())}
        >
          <CaseLower className="w-3.5 h-3.5 me-1" />
          lowercase
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={() => setPlainInput(toTitleCase(plainTextForEditing(input, inputFormat)))}
        >
          <CaseSensitive className="w-3.5 h-3.5 me-1" />
          Title Case
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={() => setPlainInput(cleanWhitespace(plainTextForEditing(input, inputFormat)))}
        >
          <AlignLeft className="w-3.5 h-3.5 me-1" />
          {textT.cleanSpaces}
        </Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
            <Type className="w-4 h-4" />
            {textT.input(formatLabels[inputFormat])}
          </label>
          <Textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              resetFreemiumState();
            }}
            placeholder={textT.placeholder}
            className="min-h-[250px] lg:min-h-[350px] font-mono text-sm resize-y"
            dir="auto"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
            <Code className="w-4 h-4" />
            {textT.output(formatLabels[outputFormat])}
          </label>
          {outputFormat === "html" && inputFormat !== "html" ? (
            <div className="space-y-2">
              <div
                className="bg-card border border-border rounded-xl p-4 min-h-[150px] prose prose-sm max-w-none text-foreground overflow-auto"
                dir="auto"
                dangerouslySetInnerHTML={{ __html: output }}
              />
              <Textarea value={output} readOnly className="min-h-[100px] font-mono text-xs resize-y bg-muted" dir="ltr" />
            </div>
          ) : (
            <Textarea
              value={output}
              readOnly
              className="min-h-[250px] lg:min-h-[350px] font-mono text-sm resize-y bg-muted"
              dir="auto"
            />
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4 bg-card border border-border rounded-xl px-4 py-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Hash className="w-3.5 h-3.5" /> {stats.chars} {textT.chars}
        </span>
        <span>
          {stats.charsNoSpaces} {textT.noSpaces}
        </span>
        <span>
          {stats.words} {textT.words}
        </span>
        <span>
          {stats.lines} {textT.lines}
        </span>
        <span>
          {stats.paragraphs} {textT.paragraphs}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={handleCopy} variant="outline" disabled={!output}>
          {copied ? <CheckCircle2 className="w-4 h-4 me-1 text-success" /> : <Copy className="w-4 h-4 me-1" />}
          {copied ? textT.copied : textT.copy}
        </Button>
        <Button onClick={handleDownload} disabled={!output || atUsageLimit} className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold">
          <Download className="w-4 h-4 me-1" />
          {downloadLabel}
        </Button>
      </div>
      <AdSlot type="banner" slotId="tool-text-banner" />
    </div>
  );
}
