import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SummaryCard from "@/components/summary/SummaryCard";
import KeyPoints from "@/components/summary/KeyPoints";
import Keywords from "@/components/summary/Keywords";
import Metadata from "@/components/summary/Metadata";
import CopyButtons from "@/components/summary/CopyButtons";
import EmptyState from "@/components/common/EmptyState";
import Loader from "@/components/common/Loader";

import { getHistoryItem, removeHistory, updateHistoryItem, type HistoryItem } from "@/lib/history";
import { summarizeFn } from "@/lib/summarize.functions";

export const Route = createFileRoute("/result/$id")({
  component: ResultPage,
});

function ResultPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<HistoryItem | undefined>(undefined);
  const [loaded, setLoaded] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [hasShownWarning, setHasShownWarning] = useState(false);

  useEffect(() => {
    setHasShownWarning(false);
  }, [id]);

  useEffect(() => {
    const historyItem = getHistoryItem(id);
    setItem(historyItem);
    setLoaded(true);

    if (
      historyItem &&
      historyItem.input?.type === "youtube" &&
      historyItem.response.transcriptAvailable === false &&
      !hasShownWarning
    ) {
      toast.error("Transcript not available for this video.", {
        description: "Summarized using video information and description instead.",
        duration: 8000,
      });
      setHasShownWarning(true);
    }
  }, [id, hasShownWarning]);

  const handleClear = () => {
    removeHistory(id);
    navigate({ to: "/" });
  };

  const handleLengthChange = async (len: "short" | "medium" | "detailed") => {
    if (!item || isRegenerating || len === (item.length || "medium")) return;

    // Check cache first
    if (item.summaries && item.summaries[len]) {
      const updated = {
        ...item,
        length: len,
        response: item.summaries[len]!,
      };
      setItem(updated);
      updateHistoryItem(id, updated);
      toast.success(`Switched to ${len} summary`);
      return;
    }

    if (!item.input) {
      toast.error("Original input data is not available to regenerate this summary.");
      return;
    }

    setIsRegenerating(true);
    try {
      const res = (await summarizeFn({
        data: {
          ...item.input,
          length: len,
        },
      })) as any;

      const updatedSummaries = {
        ...(item.summaries || {}),
        [len]: res,
      };

      const updated: HistoryItem = {
        ...item,
        length: len,
        response: res,
        summaries: updatedSummaries,
      };

      setItem(updated);
      updateHistoryItem(id, updated);
      toast.success(`Generated ${len} summary`);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to generate summary.");
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 pt-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-panel/60 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </div>

      <main className="relative mx-auto w-full max-w-4xl flex-1 px-4 sm:px-6 py-6">
        {!loaded ? null : !item ? (
          <div className="space-y-4">
            <EmptyState />
            <p className="text-center text-sm text-muted-foreground">
              This summary is no longer available. Go{" "}
              <Link to="/" className="text-primary underline">
                back
              </Link>{" "}
              to create a new one.
            </p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Length Selector Toggle */}
            {item.input && (
              <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-panel/60 p-2.5 backdrop-blur sm:flex-row flex-col">
                <div className="text-sm font-medium text-muted-foreground">Summary Length</div>
                <div className="flex items-center gap-1.5 rounded-lg bg-background p-1 border border-border/50">
                  {(["short", "medium", "detailed"] as const).map((len) => {
                    const active = (item.length || "medium") === len;
                    return (
                      <button
                        key={len}
                        disabled={isRegenerating}
                        onClick={() => handleLengthChange(len)}
                        className={[
                          "px-3 py-1.5 text-xs font-semibold rounded-md transition-all uppercase tracking-wider",
                          active
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent/40",
                          isRegenerating && "opacity-50 cursor-not-allowed",
                        ].join(" ")}
                      >
                        {len}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="relative">
              <AnimatePresence mode="wait">
                {isRegenerating ? (
                  <motion.div
                    key="loader"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="rounded-2xl border border-border bg-panel/80 backdrop-blur-sm min-h-[400px] flex items-center justify-center"
                  >
                    <Loader />
                  </motion.div>
                ) : (
                  <motion.div
                    key="content"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <SummaryCard title={item.response.title} summary={item.response.summary} />
                    <KeyPoints points={item.response.keyPoints} />
                    <Keywords keywords={item.response.keywords} />
                    <Metadata
                      readingTime={item.response.readingTime}
                      wordCount={item.response.wordCount}
                      source={item.response.source}
                    />
                    <CopyButtons result={item.response} onClear={handleClear} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </main>

      <Footer />
      <Toaster richColors position="top-right" />
    </div>
  );
}
