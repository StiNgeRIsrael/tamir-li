import { useState } from "react";
import { FileDropZone } from "@/components/FileDropZone";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, FileText, Download, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdSlot, triggerInterstitial } from "@/components/AdSlot";
import { useSubscription } from "@/hooks/useSubscription";
import { notifyFileRejected, runGatedDownload } from "@/lib/custom-tool-freemium";
import { useLocale } from "@/lib/i18n";
import { getApiBaseUrl } from "@/lib/api/client";
import { triggerBlobDownload } from "@/lib/ads/download-gate";

export function HebOcrTool() {
    const { t } = useLocale();
    const ocr = t.hebrewOcr || {};
    const { toast } = useToast();
    const { isPremium } = useSubscription();
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<"idle" | "uploading" | "processing" | "done" | "error">("idle");
    const [resultBlob, setResultBlob] = useState<Blob | null>(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [downloadGate, setDownloadGate] = useState(false);

    const handleFilesSelected = (files: File[]) => {
        if (files.length > 0) {
            setFile(files[0]);
            setStatus("idle");
            setResultBlob(null);
            setErrorMessage("");
            setDownloadGate(false);
        }
    };

    const handleProcess = async () => {
        if (!file) return;
        const api = getApiBaseUrl();
        if (!api) {
            setErrorMessage(ocr.noApi || "API is not configured.");
            setStatus("error");
            return;
        }

        setStatus("uploading");
        setErrorMessage("");

        try {
            const formData = new FormData();
            formData.append("file", file);

            setStatus("processing");
            const response = await fetch(`${api}/api/tools/hebrew-ocr`, {
                method: "POST",
                body: formData,
                credentials: "include",
            });

            if (!response.ok) {
                const payload = await response.json().catch(() => ({}));
                throw new Error(payload.message || ocr.failed || "OCR failed");
            }

            const blob = await response.blob();
            setResultBlob(blob);
            setStatus("done");
            triggerInterstitial();
            toast({
                title: ocr.doneTitle || "OCR complete",
                description: ocr.doneDesc || "Your document is ready to download.",
            });
        } catch (err) {
            setStatus("error");
            setErrorMessage(err instanceof Error ? err.message : ocr.failed || "OCR failed");
        }
    };

    const handleDownload = async () => {
        if (!resultBlob || !file) return;
        const downloadFn = () => {
            triggerBlobDownload(resultBlob, file.name.replace(/\.[^.]+$/, ""), "txt");
        };
        const { triggered, gateOpen } = await runGatedDownload(downloadGate, isPremium, downloadFn, {
            toolId: "hebrew-ocr",
        });
        setDownloadGate(gateOpen);
        if (!triggered) return;
    };

    const isProcessing = status === "uploading" || status === "processing";
    const downloadLabel = isPremium ? (ocr.download || "Download text file") : t.tool.download;

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
                    <p className="text-xs text-muted-foreground">{ocr.hint}</p>
                </div>
            )}

            {file && status !== "done" && status !== "error" && (
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
                                {ocr.cancel || "Cancel"}
                            </Button>
                            <Button onClick={() => void handleProcess()} className="bg-accent text-accent-foreground hover:bg-accent/90">
                                <Wand2 className="w-4 h-4 me-2" />
                                {ocr.start || "Extract Hebrew text"}
                            </Button>
                        </div>
                    )}

                    {isProcessing && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                {status === "uploading" ? ocr.uploading : ocr.processing}
                            </div>
                            {!isPremium && (
                                <AdSlot type="inline" slotId="tool-heb-ocr-processing" className="mx-auto max-w-lg" eager />
                            )}
                        </div>
                    )}
                </div>
            )}

            {status === "error" && (
                <div className="bg-destructive/5 border border-destructive/30 rounded-xl p-5 space-y-3">
                    <p className="text-sm text-destructive font-medium">{ocr.failed || "OCR failed"}</p>
                    <p className="text-xs text-muted-foreground">{errorMessage}</p>
                    <Button variant="outline" onClick={() => { setStatus("idle"); setFile(null); }}>
                        {ocr.tryAgain || "Try again"}
                    </Button>
                </div>
            )}

            {status === "done" && resultBlob && (
                <div className="bg-success/5 border border-success/30 rounded-xl p-6 text-center space-y-4 animate-fade-in">
                    <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-2">
                        <CheckCircle2 className="w-8 h-8 text-success" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-success mb-1">{ocr.doneTitle || "OCR complete"}</h3>
                        <p className="text-sm text-muted-foreground">{ocr.doneDesc}</p>
                    </div>

                    <div className="flex justify-center gap-4 pt-4">
                        <Button variant="outline" onClick={() => { setStatus("idle"); setFile(null); setResultBlob(null); setDownloadGate(false); }}>
                            {ocr.another || "Process another document"}
                        </Button>
                        <Button
                            className={downloadGate ? "bg-success text-success-foreground hover:bg-success/90" : "bg-primary text-primary-foreground hover:bg-primary/90"}
                            onClick={() => void handleDownload()}
                        >
                            <Download className="w-5 h-5 me-2" />
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
