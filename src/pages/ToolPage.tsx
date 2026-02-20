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
import { ArrowLeft, Download, Loader2, CheckCircle2, Crown } from "lucide-react";

export default function ToolPage() {
  const { toolId } = useParams();
  const tool = getToolById(toolId || "");
  const [files, setFiles] = useState<File[]>([]);
  const [outputFormat, setOutputFormat] = useState("");
  const [converting, setConverting] = useState(false);
  const [done, setDone] = useState(false);
  const [usedToday] = useState(3);
  const maxDaily = 5;

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

  const Icon = tool.icon;

  const handleConvert = () => {
    if (files.length === 0 || !outputFormat) return;
    triggerInterstitial(); // Trigger vignette before conversion starts
    setConverting(true);
    setTimeout(() => {
      setConverting(false);
      setDone(true);
      triggerInterstitial(); // Trigger vignette after conversion completes
    }, 2500);
  };

  const handleReset = () => {
    setFiles([]);
    setOutputFormat("");
    setDone(false);
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

        {/* Header */}
        <header className="space-y-2 animate-fade-in">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-foreground">{tool.name}</h1>
            {tool.premium && <Crown className="w-5 h-5 text-premium" />}
          </div>
          <p className="text-muted-foreground">{tool.description}</p>
        </header>

        {tool.premium ? (
          <PremiumLock />
        ) : done ? (
          /* Success State */
          <div className="text-center py-12 space-y-4 animate-fade-in">
            <CheckCircle2 className="w-16 h-16 text-success mx-auto" />
            <h2 className="text-2xl font-bold">ההמרה הושלמה!</h2>
            <p className="text-muted-foreground">
              {files.length} {files.length === 1 ? "קובץ" : "קבצים"} הומרו בהצלחה ל-{outputFormat}
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

            {/* Show remaining conversions after success */}
            <ConversionSuccessUsage used={usedToday + 1} max={maxDaily} />

            <AdSlot type="inline" className="mt-8" />
          </div>
        ) : (
          /* Upload & Convert */
          <div className="space-y-6">
            <FileDropZone
              acceptedFormats={tool.fromFormats}
              onFilesSelected={setFiles}
            />

            {files.length > 0 && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium whitespace-nowrap">המר ל:</label>
                  <Select value={outputFormat} onValueChange={setOutputFormat}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="בחר פורמט" />
                    </SelectTrigger>
                    <SelectContent>
                      {tool.toFormats.map((fmt) => (
                        <SelectItem key={fmt} value={fmt}>{fmt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleConvert}
                  disabled={!outputFormat || converting}
                  className="w-full h-12 text-base font-bold bg-accent text-accent-foreground hover:bg-accent/90 animate-pulse-glow"
                  size="lg"
                >
                  {converting ? (
                    <>
                      <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                      ממיר...
                    </>
                  ) : (
                    <>
                      <ArrowLeft className="w-5 h-5 ml-2" />
                      התחל המרה
                    </>
                  )}
                </Button>
              </div>
            )}

            <AdSlot type="banner" />
          </div>
        )}

        {/* Premium Banner */}
        <PremiumBanner />
      </div>
    </AppLayout>
  );
}
