import { useRef, useState } from "react";
import { UploadCloud, X, FileIcon } from "lucide-react";
import type { SourceConfig } from "@/utils/constants";
import { formatBytes, validateFile } from "@/utils/validators";
import { toast } from "sonner";

export default function FileUploader({
  source,
  file,
  onChange,
}: {
  source: SourceConfig;
  file: File | null;
  onChange: (f: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (f: File | null) => {
    if (!f) return onChange(null);
    const err = validateFile(f, source);
    if (err) {
      toast.error(err);
      return;
    }
    onChange(f);
  };

  if (file) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-border bg-panel/60 p-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
            <FileIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{file.name}</div>
            <div className="text-xs text-muted-foreground">{formatBytes(file.size)}</div>
          </div>
        </div>
        <button
          onClick={() => onChange(null)}
          aria-label="Remove file"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFile(e.dataTransfer.files?.[0] ?? null);
      }}
      className={[
        "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-12 px-6 text-center cursor-pointer transition-colors",
        dragOver
          ? "border-primary bg-primary/5"
          : "border-border bg-panel/40 hover:bg-panel/70",
      ].join(" ")}
    >
      <input
        ref={inputRef}
        type="file"
        accept={source.accept}
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <UploadCloud className="h-6 w-6" />
      </div>
      <div>
        <div className="font-medium">Drop your {source.label} file here</div>
        <div className="text-xs text-muted-foreground mt-1">
          or click to browse · {source.extensions?.join(", ")} · max 25 MB
        </div>
      </div>
    </label>
  );
}
