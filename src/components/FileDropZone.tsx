import { useCallback, useState, type DragEvent } from "react";
import { Upload, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";

interface FileDropZoneProps {
  acceptedFormats: string[];
  onFilesSelected: (files: File[]) => void;
  multiple?: boolean;
  maxFiles?: number;
  maxSizeMB?: number;
}

export function FileDropZone({ acceptedFormats, onFilesSelected, multiple = true, maxFiles = 10, maxSizeMB = 50 }: FileDropZoneProps) {
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

  const formatAccept = acceptedFormats.map((f) => `.${f.toLowerCase()}`).join(",");

  return (
    <div>
      <div
        onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
        className={`drop-zone flex flex-col items-center justify-center gap-3 p-10 lg:p-12 text-center cursor-pointer min-h-[200px] lg:min-h-[260px] ${isDragging ? "drop-zone-active" : ""}`}
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-card">
          <Upload className="h-7 w-7 text-primary" />
        </div>
        <div>
          <p className="text-base font-semibold text-foreground">{fdz.dragHere}</p>
          <p className="text-sm text-muted-foreground mt-1">{fdz.orClick(maxSizeMB, acceptedFormats.join(", "))}</p>
        </div>
        <Button variant="outline" size="sm" className="mt-1">
          <FileUp className="w-4 h-4 me-2" />
          {fdz.selectFiles}
        </Button>
      </div>
      <input id="file-input" type="file" accept={formatAccept} multiple={multiple} onChange={handleFileInput} className="hidden" />
    </div>
  );
}
