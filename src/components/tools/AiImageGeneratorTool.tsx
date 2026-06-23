import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Crown, Sparkles, Loader2, Download, RefreshCw, ImageIcon } from "lucide-react";
import { CreditsDisplay, CreditPackages } from "@/components/PremiumCredits";
import { useT, useLocale, localePath } from "@/lib/i18n";
import { useSubscription } from "@/hooks/useSubscription";
import { Link } from "react-router-dom";

type GenerationState = "idle" | "generating" | "done";
interface GeneratedImage { prompt: string; url: string; timestamp: number; }

export function AiImageGeneratorTool() {
  const t = useT();
  const { locale } = useLocale();
  const ai = t.aiGenerator;
  const { isPremium, credits } = useSubscription();
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("realistic");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [state, setState] = useState<GenerationState>("idle");
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [showPackages, setShowPackages] = useState(false);

  const handleGenerate = () => {
    if (!prompt.trim() || credits <= 0) return;
    setState("generating");
    setTimeout(() => {
      setGeneratedImages((prev) => [{ prompt: prompt.trim(), url: "", timestamp: Date.now() }, ...prev]);
      setState("done");
    }, 3000);
  };

  const styles = ai.styles || [];
  const ratios = ai.ratios || [];

  return (
    <div className="space-y-5">
      <CreditsDisplay credits={credits} isPremium={isPremium} />
      {!isPremium && credits <= 0 && (
        <div className="text-center py-6 px-4 bg-muted/50 rounded-2xl border border-border space-y-4">
          <Crown className="w-8 h-8 text-premium mx-auto" />
          <p className="text-sm text-muted-foreground max-w-md mx-auto">{ai.desc}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild className="bg-premium text-premium-foreground hover:bg-premium/90 font-bold">
              <Link to={localePath("/premium", locale)}><Crown className="w-4 h-4 me-1" />{ai.upgradeToPremium}</Link>
            </Button>
            <Button variant="outline" onClick={() => setShowPackages(true)}>{ai.viewCreditPackages}</Button>
          </div>
        </div>
      )}
      {showPackages && <CreditPackages onClose={() => setShowPackages(false)} />}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">{ai.describeImage}</label>
          <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={ai.promptPlaceholder} className="min-h-[100px] resize-none text-sm" dir="auto" />
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">{ai.style}</label>
            <Select value={style} onValueChange={setStyle}><SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{(styles as { value: string; label: string }[]).map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">{ai.aspectRatio}</label>
            <Select value={aspectRatio} onValueChange={setAspectRatio}><SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{(ratios as { value: string; label: string }[]).map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent></Select>
          </div>
        </div>
        <Button onClick={handleGenerate} disabled={!prompt.trim() || state === "generating" || credits <= 0} className="w-full h-11 font-bold bg-premium text-premium-foreground hover:bg-premium/90" size="lg">
          {state === "generating" ? <><Loader2 className="w-4 h-4 me-2 animate-spin" />{ai.generating}</> : <><Sparkles className="w-4 h-4 me-2" />{ai.generateBtn}</>}
        </Button>
      </div>
      {state === "generating" && (
        <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-4 animate-fade-in">
          <div className="w-20 h-20 rounded-2xl bg-premium/10 flex items-center justify-center mx-auto animate-pulse"><Sparkles className="w-10 h-10 text-premium" /></div>
          <p className="text-sm text-muted-foreground">{ai.aiCreating}</p>
        </div>
      )}
      {generatedImages.length > 0 && state !== "generating" && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-foreground">{ai.generatedImages}</h3>
          {generatedImages.map((img, index) => (
            <div key={img.timestamp} className="bg-card border border-border rounded-2xl overflow-hidden animate-fade-in">
              <div className="aspect-square max-h-[400px] bg-muted flex items-center justify-center">
                <div className="text-center space-y-2"><ImageIcon className="w-12 h-12 text-muted-foreground/30 mx-auto" /><p className="text-xs text-muted-foreground">{ai.imagePlaceholder}</p></div>
              </div>
              <div className="p-3 space-y-2">
                <p className="text-xs text-muted-foreground truncate">"{img.prompt}"</p>
                <div className="flex items-center gap-2">
                  <Button size="sm" className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"><Download className="w-3.5 h-3.5 me-1" />{ai.downloadImage}</Button>
                  <Button size="sm" variant="outline" onClick={() => { setPrompt(img.prompt); setState("idle"); }}><RefreshCw className="w-3.5 h-3.5 me-1" />{ai.regenerate}</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
