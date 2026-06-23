import { useCallback, useState, type DragEvent, type KeyboardEvent } from "react";
import { Upload, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";

interface FileDropZoneProps {
  acceptedFormats: string[];
  onFilesSelected: (files: File[]) => void;
  multiple?: boolean;
  maxFiles?: number;
  maxSizeMB?: number;
  inputId?: string;
  emphasized?: boolean;
}

export function FileDropZone({
  acceptedFormats,
  onFilesSelected,
  multiple = true,
  maxFiles = 10,
  maxSizeMB = 50,
  inputId = "file-input",
  emphasized = false,
}: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const t = useT();
  const fdz = t.fileDropZone || { dragHere: "Drag files here", orClick: () => "", selectFiles: "Select Files" };

  const handleDragOver = useCallback((e: DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);
  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    onFilesSelected(Array.from(e.dataTransfer.files).slice(0, maxFiles));
  }, [maxFiles, onFilesSelected]);
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) { onFilesSelected(Array.from(e.target.files).slice(0, maxFiles)); e.target.value = ""; }
  }, [maxFiles, onFilesSelected]);

  const openPicker = useCallback(() => {
    document.getElementById(inputId)?.click();
  }, [inputId]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openPicker();
    }
  }, [openPicker]);

  const formatAccept = acceptedFormats.map((f) => `.${f.toLowerCase()}`).join(",");

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openPicker}
        onKeyDown={handleKeyDown}
        aria-label={fdz.dragHere}
        className={`drop-zone flex flex-col items-center justify-center gap-3 p-10 lg:p-12 text-center cursor-pointer min-h-[200px] lg:min-h-[260px] ${isDragging ? "drop-zone-active" : ""} ${emphasized ? "border-primary/30 bg-primary/[0.03] hover:border-primary/40" : ""}`}
      >
        <div className={`flex items-center justify-center rounded-full border ${emphasized ? "h-16 w-16 border-primary/25 bg-primary/10" : "h-14 w-14 border-border bg-card"}`}>
          <Upload className={`text-primary ${emphasized ? "h-8 w-8" : "h-7 w-7"}`} />
        </div>
        <div>
          <p className={`font-semibold text-foreground ${emphasized ? "text-lg" : "text-base"}`}>{fdz.dragHere}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {emphasized ? fdz.orClickShort(maxSizeMB) : fdz.orClick(maxSizeMB, acceptedFormats.join(", "))}
          </p>
        </div>
        {emphasized && acceptedFormats.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5">
            {acceptedFormats.map((fmt) => (
              <span
                key={fmt}
                className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary"
              >
                .{fmt.toLowerCase()}
              </span>
            ))}
          </div>
        )}
        <Button variant={emphasized ? "default" : "outline"} size={emphasized ? "default" : "sm"} className="mt-1 pointer-events-none">
          <FileUp className="w-4 h-4 me-2" />
          {fdz.selectFiles}
        </Button>
      </div>
      <input id={inputId} type="file" accept={formatAccept} multiple={multiple} onChange={handleFileInput} className="hidden" />
    </div>
  );
}
