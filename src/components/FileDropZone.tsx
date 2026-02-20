import { useCallback, useState, type DragEvent } from "react";
import { Upload, FileUp, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileDropZoneProps {
  acceptedFormats: string[];
  onFilesSelected: (files: File[]) => void;
  multiple?: boolean;
  maxFiles?: number;
  maxSizeMB?: number;
}

export function FileDropZone({
  acceptedFormats,
  onFilesSelected,
  multiple = true,
  maxFiles = 10,
  maxSizeMB = 50,
}: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFiles = Array.from(e.dataTransfer.files).slice(0, maxFiles);
      setFiles(droppedFiles);
      onFilesSelected(droppedFiles);
    },
    [maxFiles, onFilesSelected]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const selectedFiles = Array.from(e.target.files).slice(0, maxFiles);
        setFiles(selectedFiles);
        onFilesSelected(selectedFiles);
      }
    },
    [maxFiles, onFilesSelected]
  );

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onFilesSelected(newFiles);
  };

  const formatAccept = acceptedFormats.map((f) => `.${f.toLowerCase()}`).join(",");

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`drop-zone flex flex-col items-center justify-center gap-4 p-10 text-center cursor-pointer min-h-[220px] ${
          isDragging ? "drop-zone-active" : ""
        }`}
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Upload className="w-8 h-8 text-primary" />
        </div>
        <div>
          <p className="text-lg font-semibold text-foreground">גרור קבצים לכאן</p>
          <p className="text-sm text-muted-foreground mt-1">
            או לחץ לבחירת קבצים • עד {maxSizeMB}MB • {acceptedFormats.join(", ")}
          </p>
        </div>
        <Button variant="outline" size="sm" className="mt-2">
          <FileUp className="w-4 h-4 ml-2" />
          בחר קבצים
        </Button>
        <input
          id="file-input"
          type="file"
          accept={formatAccept}
          multiple={multiple}
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      {files.length > 0 && (
        <div className="space-y-2 animate-fade-in">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-card border border-border rounded-lg p-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                  <FileUp className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium truncate max-w-[200px]">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => removeFile(index)} className="h-8 w-8">
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
