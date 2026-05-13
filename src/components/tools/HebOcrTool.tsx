import { useState } from "react";
import { useLocale } from "@/lib/i18n";
import { FileDropZone } from "@/components/FileDropZone";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, FileText, Download, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { triggerInterstitial } from "@/components/AdSlot";

export function HebOcrTool() {
    const { t } = useLocale();
    const { toast } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<"idle" | "uploading" | "processing" | "done" | "error">("idle");
    const [progress, setProgress] = useState(0);

    const handleFilesSelected = (files: File[]) => {
        if (files.length > 0) {
            setFile(files[0]); // HebHTR processes one file at a time
            setStatus("idle");
            setProgress(0);
        }
    };

    const handleProcess = () => {
        if (!file) return;
        setStatus("uploading");

        // Simulate upload and OCR processing on the backend
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

        /*
          // Real Implementation Example once the Python server is running:
          setStatus("uploading");
          const formData = new FormData();
          formData.append("file", file);

          try {
            const response = await fetch("http://localhost:5000/api/ocr", {
              method: "POST",
              body: formData,
            });

            const blob = await response.blob();
            setStatus("done");

            // Trigger download of the output DOCX Document
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${file.name.replace(/\.[^.]+$/, "")}_ocr.docx`;
            a.click();
          } catch (error) {
            setStatus("error");
            console.error(error);
          }
        */
    };

    const handleDownloadStub = () => {
        toast({
            title: "הורדה התחילה",
            description: "מוריד את המסמך השומר על המבנה של הצילום כקובץ DOCX.",
        });
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {status === "idle" && (
                <div className="space-y-4">
                    <FileDropZone
                        acceptedFormats={["PDF", "JPG", "PNG"]}
                        onFilesSelected={handleFilesSelected}
                        maxFiles={1}
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

                    {(status === "uploading" || status === "processing") && (
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
                        <Button variant="outline" onClick={() => setStatus("idle")}>
                            המרת מסמך נוסף
                        </Button>
                        <Button
                            className="bg-success text-success-foreground hover:bg-success/90"
                            onClick={handleDownloadStub}
                        >
                            <Download className="w-5 h-5 mr-2" />
                            הורד מסמך וורד
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
