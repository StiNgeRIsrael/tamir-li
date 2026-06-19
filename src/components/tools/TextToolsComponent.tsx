import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AdSlot } from "@/components/AdSlot";
import { Copy, Download, ArrowLeftRight, Hash, Type, AlignLeft, CaseSensitive, CaseUpper, CaseLower, CheckCircle2, FileText, Code } from "lucide-react";
import { marked } from "marked";
import TurndownService from "turndown";
import { useT } from "@/lib/i18n";

type TextFormat = "plain" | "markdown" | "html";

function convertText(input: string, from: TextFormat, to: TextFormat): string {
  if (from === to) return input;
  if (from === "markdown" && to === "html") return marked.parse(input, { async: false }) as string;
  if (from === "html" && to === "markdown") { const td = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced" }); return td.turndown(input); }
  if (from === "html" && to === "plain") { const div = document.createElement("div"); div.innerHTML = input; return div.textContent || ""; }
  if (from === "markdown" && to === "plain") { const html = marked.parse(input, { async: false }) as string; const div = document.createElement("div"); div.innerHTML = html; return div.textContent || ""; }
  if (from === "plain" && to === "markdown") return input.split("\n\n").map(p => p.trim()).filter(Boolean).join("\n\n");
  if (from === "plain" && to === "html") return input.split("\n\n").map(p => `<p>${p.trim().replace(/\n/g, "<br>")}</p>`).filter(p => p !== "<p></p>").join("\n");
  return input;
}

function getStats(text: string) {
  const chars = text.length; const charsNoSpaces = text.replace(/\s/g, "").length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const lines = text.split("\n").length; const paragraphs = text.split(/\n\n+/).filter(p => p.trim()).length;
  return { chars, charsNoSpaces, words, lines, paragraphs };
}

export function TextToolsComponent() {
  const t = useT();
  const tt = t.textTools || {};
  const [input, setInput] = useState("");
  const [inputFormat, setInputFormat] = useState<TextFormat>("plain");
  const [outputFormat, setOutputFormat] = useState<TextFormat>("html");
  const [copied, setCopied] = useState(false);

  const formatLabels: Record<TextFormat, string> = { plain: tt.plainText || "Plain Text", markdown: "Markdown", html: "HTML" };
  const output = input ? convertText(input, inputFormat, outputFormat) : "";
  const stats = getStats(input);

  const handleCopy = async () => { await navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const handleDownload = () => {
    const ext = outputFormat === "html" ? "html" : outputFormat === "markdown" ? "md" : "txt";
    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `converted.${ext}`; a.click();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2">
          <span className="text-xs text-muted-foreground">{tt.from}</span>
          <Select value={inputFormat} onValueChange={(v) => setInputFormat(v as TextFormat)}>
            <SelectTrigger className="w-28 h-7 text-xs border-0 bg-muted font-semibold"><SelectValue /></SelectTrigger>
            <SelectContent>{(Object.keys(formatLabels) as TextFormat[]).map(f => <SelectItem key={f} value={f}>{formatLabels[f]}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
        <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2">
          <span className="text-xs text-muted-foreground">{tt.to}</span>
          <Select value={outputFormat} onValueChange={(v) => setOutputFormat(v as TextFormat)}>
            <SelectTrigger className="w-28 h-7 text-xs border-0 bg-primary/10 font-semibold text-primary"><SelectValue /></SelectTrigger>
            <SelectContent>{(Object.keys(formatLabels) as TextFormat[]).filter(f => f !== inputFormat).map(f => <SelectItem key={f} value={f}>{formatLabels[f]}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" className="text-xs" onClick={() => setInput(input.toUpperCase())}><CaseUpper className="w-3.5 h-3.5 me-1" />UPPERCASE</Button>
        <Button variant="outline" size="sm" className="text-xs" onClick={() => setInput(input.toLowerCase())}><CaseLower className="w-3.5 h-3.5 me-1" />lowercase</Button>
        <Button variant="outline" size="sm" className="text-xs" onClick={() => setInput(input.replace(/\w\S*/g, t => t.charAt(0).toUpperCase() + t.substring(1).toLowerCase()))}><CaseSensitive className="w-3.5 h-3.5 me-1" />Title Case</Button>
        <Button variant="outline" size="sm" className="text-xs" onClick={() => setInput(input.replace(/ +/g, " ").replace(/\n{3,}/g, "\n\n"))}><AlignLeft className="w-3.5 h-3.5 me-1" />{tt.cleanSpaces}</Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-1.5"><Type className="w-4 h-4" />{tt.input(formatLabels[inputFormat])}</label>
          <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder={tt.placeholder} className="min-h-[250px] lg:min-h-[350px] font-mono text-sm resize-y" dir="auto" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-1.5"><Code className="w-4 h-4" />{tt.output(formatLabels[outputFormat])}</label>
          {outputFormat === "html" && inputFormat !== "html" ? (
            <div className="space-y-2">
              <div className="bg-card border border-border rounded-xl p-4 min-h-[150px] prose prose-sm max-w-none text-foreground overflow-auto" dir="auto" dangerouslySetInnerHTML={{ __html: output }} />
              <Textarea value={output} readOnly className="min-h-[100px] font-mono text-xs resize-y bg-muted" dir="ltr" />
            </div>
          ) : (
            <Textarea value={output} readOnly className="min-h-[250px] lg:min-h-[350px] font-mono text-sm resize-y bg-muted" dir="auto" />
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4 bg-card border border-border rounded-xl px-4 py-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Hash className="w-3.5 h-3.5" /> {stats.chars} {tt.chars}</span>
        <span>{stats.charsNoSpaces} {tt.noSpaces}</span>
        <span>{stats.words} {tt.words}</span>
        <span>{stats.lines} {tt.lines}</span>
        <span>{stats.paragraphs} {tt.paragraphs}</span>
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={handleCopy} variant="outline" disabled={!output}>
          {copied ? <CheckCircle2 className="w-4 h-4 me-1 text-success" /> : <Copy className="w-4 h-4 me-1" />}
          {copied ? tt.copied : tt.copy}
        </Button>
        <Button onClick={handleDownload} disabled={!output} className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold">
          <Download className="w-4 h-4 me-1" />{tt.downloadAs(outputFormat === "html" ? "HTML" : outputFormat === "markdown" ? "MD" : "TXT")}
        </Button>
      </div>
      <AdSlot type="banner" slotId="tool-text-banner" />
    </div>
  );
}
