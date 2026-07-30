import { Globe, Youtube, Github, FileIcon, Star, Code2, Clock } from "lucide-react";
import { formatBytes } from "@/utils/validators";

export interface PreviewData {
  type: "website" | "youtube" | "github" | "file";
  title: string;
  description?: string;
  favicon?: string;
  thumbnail?: string;
  author?: string;
  stars?: number;
  primaryLanguage?: string;
  fileSize?: number;
  fileName?: string;
}

export default function SourcePreviewCard({ data }: { data: PreviewData }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-panel/60 p-4 backdrop-blur shadow-[0_0_15px_rgba(var(--primary-rgb),0.05)] animate-in fade-in zoom-in-95 duration-200">
      {/* Glow highlight */}
      <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-primary/10 blur-2xl pointer-events-none" />

      <div className="flex gap-4">
        {/* Source Icon or Image */}
        {data.type === "youtube" && data.thumbnail ? (
          <div className="relative h-16 w-24 flex-shrink-0 rounded-lg overflow-hidden border border-border/80">
            <img src={data.thumbnail} alt={data.title} className="h-full w-full object-cover" />
            <div className="absolute bottom-1 right-1 bg-black/80 text-[10px] font-bold px-1 py-0.5 rounded text-white flex items-center gap-0.5">
              <Youtube className="h-2.5 w-2.5 text-red-500" />
              YT
            </div>
          </div>
        ) : data.type === "website" && data.favicon ? (
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-panel/80 border border-border text-foreground">
            <img
              src={data.favicon}
              alt={data.title}
              className="h-6 w-6 rounded-sm"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
            <Globe className="h-5 w-5 text-primary absolute" />
          </div>
        ) : data.type === "github" ? (
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/30 text-primary">
            <Github className="h-6 w-6" />
          </div>
        ) : (
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary border border-primary/30">
            <FileIcon className="h-6 w-6" />
          </div>
        )}

        {/* Content Details */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="text-[10px] font-semibold text-primary uppercase tracking-widest flex items-center gap-1.5">
            {data.type === "youtube" && <span>YouTube Video</span>}
            {data.type === "website" && <span>Website URL</span>}
            {data.type === "github" && <span>GitHub Repository</span>}
            {data.type === "file" && <span>Document Upload</span>}
            <span className="h-1 w-1 rounded-full bg-border" />
            <span className="text-muted-foreground normal-case font-medium">Source Confirmed</span>
          </div>

          <h4 className="font-display text-sm font-semibold truncate text-foreground leading-tight">
            {data.title || data.fileName}
          </h4>

          {/* Subtitle / Details */}
          {data.type === "youtube" && data.author && (
            <p className="text-xs text-muted-foreground truncate">Channel: {data.author}</p>
          )}

          {data.type === "website" && data.description && (
            <p className="text-xs text-muted-foreground truncate">{data.description}</p>
          )}

          {data.type === "github" && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground pt-0.5">
              {data.primaryLanguage && (
                <span className="flex items-center gap-1">
                  <Code2 className="h-3.5 w-3.5 text-primary" />
                  {data.primaryLanguage}
                </span>
              )}
              {data.stars !== undefined && (
                <span className="flex items-center gap-0.5">
                  <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  {data.stars.toLocaleString()} stars
                </span>
              )}
            </div>
          )}

          {data.type === "file" && data.fileSize !== undefined && (
            <p className="text-xs text-muted-foreground">Size: {formatBytes(data.fileSize)}</p>
          )}
        </div>
      </div>
    </div>
  );
}
