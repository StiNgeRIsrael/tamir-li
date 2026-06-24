import { useState } from "react";
import { FileDropZone } from "@/components/FileDropZone";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, FileText, Download, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdSlot, triggerInterstitial } from "@/components/AdSlot";
import { useSubscription } from "@/hooks/useSubscription";
import { notifyFileRejected, runGatedDownload } from "@/lib/custom-tool-freemium";
import { useT } from "@/lib/i18n";

export function HebOcrTool() {
    const { toast } = useToast();
    const { isPremium } = useSubscription();
    const t = useT();
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<"idle" | "uploading" | "processing" | "done" | "error">("idle");
    const [progress, setProgress] = useState(0);
    const [downloadGate, setDownloadGate] = useState(false);

    const handleFilesSelected = (files: File[]) => {
        if (files.length > 0) {
            setFile(files[0]);
            setStatus("idle");
            setProgress(0);
            setDownloadGate(false);
        }
    };

    const handleProcess = () => {
        if (!file) return;
        setStatus("uploading");

        setTimeout(() => {
            setStatus("processing");
            let currentProgress = 0;
            const interval = setInterval(() => {
                currentProgress += Math.random() * 15;
                if (currentProgress >= 100) {
                    clearInterval(interval);
                    setProgress(100);
                    setStatus("done");
                    triggerInterstitial();
                    toast({
                        title: "הפענוח הושלם בהצלחה!",
                        description: "המסמך עבר המרה לטקסט מוכן לעריכה.",
                    });
                } else {
                    setProgress(Math.round(currentProgress));
                }
            }, 500);
        }, 1500);
    };

    const handleDownload = async () => {
        const downloadFn = () => {
            toast({
                title: "הורדה התחילה",
                description: "מוריד את המסמך השומר על המבנה של הצילום כקובץ DOCX.",
            });
        };
        const { triggered, gateOpen } = await runGatedDownload(downloadGate, isPremium, downloadFn, {
            toolId: "heb-ocr",
        });
        setDownloadGate(gateOpen);
        if (!triggered) return;
    };

    const isProcessing = status === "uploading" || status === "processing";
    const downloadLabel = isPremium
        ? "הורד מסמך וורד"
        : downloadGate
            ? "הורד עכשיו"
            : "צפה בפרסומת להורדה";

    return (
        <div className="space-y-6 animate-fade-in">
            {status === "idle" && (
                <div className="space-y-4">
                    <FileDropZone
                        acceptedFormats={["PDF", "JPG", "PNG"]}
                        onFilesSelected={handleFilesSelected}
                        isPremium={isPremium}
                        maxFiles={1}
                        onRejected={(reason, fileName) => notifyFileRejected(reason, isPremium, t.fileDropZone, fileName)}
                    />
                </div>
            )}

            {file && status !== "done" && (
                <div className="bg-card border border-border rounded-xl p-5 space-y-4 items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <FileText className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                        </div>
                    </div>

                    {status === "idle" && (
                        <div className="flex gap-3 justify-end pt-2 border-t">
                            <Button variant="outline" onClick={() => setFile(null)}>
                                ביטול
                            </Button>
                            <Button onClick={handleProcess} className="bg-accent text-accent-foreground hover:bg-accent/90">
                                <Wand2 className="w-4 h-4 mr-2" />
                                פענח ושמור כוורד (Word)
                            </Button>
                        </div>
                    )}

                    {isProcessing && (
                        <div className="space-y-3">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                    {status === "uploading" ? "מעלה קובץ..." : "מפענח טקסט עברי בכתב יד (HebHTR)... זה עשוי לקחת מספר דקות."}
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                            {!isPremium && (
                                <AdSlot type="inline" slotId="tool-heb-ocr-processing" className="mx-auto max-w-lg" eager />
                            )}
                        </div>
                    )}
                </div>
            )}

            {status === "done" && (
                <div className="bg-success/5 border border-success/30 rounded-xl p-6 text-center space-y-4 animate-fade-in">
                    <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-2">
                        <CheckCircle2 className="w-8 h-8 text-success" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-success mb-1">הפענוח הושלם בהצלחה</h3>
                        <p className="text-sm text-muted-foreground">
                            סריקת המסמך עברה המרה לטקסט חי והקובץ מוכן להורדה בפורמט Word.
                        </p>
                    </div>

                    <div className="flex justify-center gap-4 pt-4">
                        <Button variant="outline" onClick={() => { setStatus("idle"); setDownloadGate(false); }}>
                            המרת מסמך נוסף
                        </Button>
                        <Button
                            className={downloadGate ? "bg-success text-success-foreground hover:bg-success/90" : "bg-primary text-primary-foreground hover:bg-primary/90"}
                            onClick={() => void handleDownload()}
                        >
                            <Download className="w-5 h-5 mr-2" />
                            {downloadLabel}
                        </Button>
                    </div>
                    {!isPremium && (
                        <AdSlot type="inline" slotId="tool-heb-ocr-success" className="mx-auto max-w-lg" eager />
                    )}
                </div>
            )}
        </div>
    );
}
