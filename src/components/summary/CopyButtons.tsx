import { Copy, Download, Trash2, Check, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { SummaryResponse } from "@/services/api";

export default function CopyButtons({
  result,
  onClear,
}: {
  result: SummaryResponse;
  onClear: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    if (confirmClear) {
      const timer = setTimeout(() => setConfirmClear(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [confirmClear]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.summary);
      setCopied(true);
      toast.success("Summary copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy summary");
    }
  };

  const downloadTxt = () => {
    const body = [
      result.title,
      "".padEnd(result.title.length, "="),
      "",
      "EXECUTIVE SUMMARY",
      result.summary,
      "",
      "KEY HIGHLIGHTS",
      ...result.keyPoints.map((p) => `• ${p}`),
      "",
      "ACTION ITEMS",
      ...(result.actionItems && result.actionItems.length > 0
        ? result.actionItems.map((p) => `[ ] ${p}`)
        : ["None"]),
      "",
      "OPEN QUESTIONS",
      ...(result.openQuestions && result.openQuestions.length > 0
        ? result.openQuestions.map((p) => `? ${p}`)
        : ["None"]),
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

  const downloadMarkdown = () => {
    const body = [
      `# ${result.title}`,
      "",
      "## Executive Summary",
      result.summary,
      "",
      "## Key Takeaways",
      ...result.keyPoints.map((p) => `- ${p}`),
      "",
      "## Action Items",
      ...(result.actionItems && result.actionItems.length > 0
        ? result.actionItems.map((item) => `- [ ] ${item}`)
        : ["*No action items detected.*"]),
      "",
      "## Open Questions / Gaps",
      ...(result.openQuestions && result.openQuestions.length > 0
        ? result.openQuestions.map((q) => `- ${q}`)
        : ["*No unresolved questions or gaps detected.*"]),
      "",
      "## Keywords",
      result.keywords.map((k) => `\`${k}\``).join(", "),
      "",
      "---",
      `*Reading Time: ${result.readingTime} · Word Count: ${result.wordCount} · Source: ${result.source}*`,
    ].join("\n");

    const blob = new Blob([body], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${result.title.replace(/[^\w-]+/g, "_")}_Summary.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleClearClick = () => {
    if (confirmClear) {
      onClear();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      toast.info("Click again to confirm clear");
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/50 pt-4 w-full">
      <div className="flex flex-wrap gap-2">
        {/* Copy - Primary Filled Button */}
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground font-semibold px-5 py-2.5 text-sm transition-all hover:brightness-110 glow-primary min-h-[44px]"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 shrink-0" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 shrink-0" />
              Copy Summary
            </>
          )}
        </button>

        {/* Download TXT - Secondary Outline Button */}
        <button
          onClick={downloadTxt}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-panel hover:bg-accent px-4 py-2.5 text-sm font-medium transition-colors min-h-[44px] text-muted-foreground hover:text-foreground"
        >
          <Download className="h-4 w-4 shrink-0" />
          TXT
        </button>

        {/* Download MD - Secondary Outline Button */}
        <button
          onClick={downloadMarkdown}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-panel hover:bg-accent px-4 py-2.5 text-sm font-medium transition-colors min-h-[44px] text-muted-foreground hover:text-foreground"
        >
          <FileText className="h-4 w-4 shrink-0" />
          Markdown
        </button>
      </div>

      {/* Clear - De-emphasized Text Button */}
      <button
        onClick={handleClearClick}
        className={[
          "inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all min-h-[40px]",
          confirmClear
            ? "bg-red-500/10 text-red-500 border border-red-500/20"
            : "text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-transparent",
        ].join(" ")}
      >
        <Trash2 className="h-4 w-4 shrink-0" />
        {confirmClear ? "Confirm Clear?" : "Clear"}
      </button>
    </div>
  );
}
