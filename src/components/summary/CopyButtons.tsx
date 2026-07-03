import { Copy, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { SummaryResponse } from "@/services/api";

export default function CopyButtons({
  result,
  onClear,
}: {
  result: SummaryResponse;
  onClear: () => void;
}) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result.summary);
      toast.success("Summary copied");
    } catch {
      toast.error("Could not copy");
    }
  };

  const download = () => {
    const body = [
      result.title,
      "".padEnd(result.title.length, "="),
      "",
      "SUMMARY",
      result.summary,
      "",
      "KEY POINTS",
      ...result.keyPoints.map((p) => `• ${p}`),
      "",
      "KEYWORDS",
      result.keywords.join(", "),
      "",
      `Reading time: ${result.readingTime}  ·  Words: ${result.wordCount}  ·  Source: ${result.source}`,
    ].join("\n");
    const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${result.title.replace(/[^\w-]+/g, "_")}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const btn =
    "inline-flex items-center gap-1.5 rounded-lg border border-border bg-panel hover:bg-accent px-3 py-2 text-sm font-medium transition-colors";
  return (
    <div className="flex flex-wrap gap-2">
      <button onClick={copy} className={btn}>
        <Copy className="h-3.5 w-3.5" /> Copy Summary
      </button>
      <button onClick={download} className={btn}>
        <Download className="h-3.5 w-3.5" /> Download TXT
      </button>
      <button
        onClick={onClear}
        className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 px-3 py-2 text-sm font-medium transition-colors"
      >
        <Trash2 className="h-3.5 w-3.5" /> Clear
      </button>
    </div>
  );
}
