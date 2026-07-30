import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Share2, Languages, MessageSquare, AlertTriangle, Code2 } from "lucide-react";
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
import StudyModeCard from "@/components/summary/StudyModeCard";
import ChatPanel from "@/components/summary/ChatPanel";

import { getHistoryItem, removeHistory, updateHistoryItem, type HistoryItem } from "@/lib/history";
import { summarizeFn } from "@/lib/summarize.functions";
import { fetchSummaryDetailsFn, updateSummaryResponseFn } from "@/lib/history.functions";

export const Route = createFileRoute("/result/$id")({
  component: ResultPage,
});

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "ja", label: "Japanese" },
  { code: "zh", label: "Chinese" },
];

function ResultPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<HistoryItem | undefined>(undefined);
  const [loaded, setLoaded] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [hasShownWarning, setHasShownWarning] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState("English");

  useEffect(() => {
    setHasShownWarning(false);
    setChatOpen(false);
    setCurrentLang("English");
  }, [id]);

  useEffect(() => {
    const fetchItem = async () => {
      const historyItem = getHistoryItem(id);
      if (historyItem) {
        setItem(historyItem);
        setLoaded(true);

        if (
          historyItem.input?.type === "youtube" &&
          historyItem.response.transcriptAvailable === false &&
          !hasShownWarning
        ) {
          toast.warning("Transcript not available for this video.", {
            description: "Summarized using video information and description instead.",
            duration: 8000,
          });
          setHasShownWarning(true);
        }
      } else {
        // Fallback to fetch from database if page reloaded/shared
        try {
          const dbItem = await fetchSummaryDetailsFn({ data: { id } });
          if (dbItem) {
            setItem(dbItem as any);
          }
        } catch (err) {
          console.error(err);
          toast.error("Failed to load summary from database.");
        } finally {
          setLoaded(true);
        }
      }
    };
    fetchItem();
  }, [id, hasShownWarning]);

  const handleClear = () => {
    removeHistory(id);
    navigate({ to: "/" });
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/share/${id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Shareable link copied to clipboard!");
    } catch {
      toast.error("Could not copy link.");
    }
  };

  const handleTranslate = async (langLabel: string) => {
    if (!item || isRegenerating || langLabel === currentLang) return;

    if (!item.input) {
      toast.error("Original input data is not available to translate this summary.");
      return;
    }

    setIsRegenerating(true);
    try {
      const res = (await summarizeFn({
        data: {
          ...item.input,
          language: langLabel,
        },
      })) as any;

      const updated: HistoryItem = {
        ...item,
        response: res.response,
      };

      setItem(updated);
      updateHistoryItem(id, updated);
      await updateSummaryResponseFn({ data: { id, response: res.response } });
      setCurrentLang(langLabel);
      toast.success(`Translated summary to ${langLabel}`);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Translation failed.");
    } finally {
      setIsRegenerating(false);
    }
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
      await updateSummaryResponseFn({ data: { id, response: item.summaries[len]! } });
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
          language: currentLang !== "English" ? currentLang : undefined,
        },
      })) as any;

      const updatedSummaries = {
        ...(item.summaries || {}),
        [len]: res.response,
      };

      const updated: HistoryItem = {
        ...item,
        length: len,
        response: res.response,
        summaries: updatedSummaries,
      };

      setItem(updated);
      updateHistoryItem(id, updated);
      await updateSummaryResponseFn({ data: { id, response: res.response } });
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

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 pt-6 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-panel/60 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        {item && (
          <div className="flex gap-2">
            {/* Share Link Button */}
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-panel/60 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
            >
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </button>

            {/* Chat Trigger Button */}
            <button
              onClick={() => setChatOpen(!chatOpen)}
              className={[
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold transition-all shadow-sm",
                chatOpen
                  ? "bg-primary border-primary text-primary-foreground glow-primary"
                  : "border-border bg-panel/60 text-muted-foreground hover:text-foreground hover:bg-accent/60",
              ].join(" ")}
            >
              <MessageSquare className="h-4 w-4" />
              <span>Chat</span>
            </button>
          </div>
        )}
      </div>

      <main className="relative mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6 py-6">
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
            {/* Length and Language Toggle Control Panel */}
            {item.input && (
              <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-panel/60 p-2.5 backdrop-blur md:flex-row flex-col">
                <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                  Summary Length
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Length Selector */}
                  <div className="flex items-center gap-1 rounded-lg bg-background p-1 border border-border/50">
                    {(["short", "medium", "detailed"] as const).map((len) => {
                      const active = (item.length || "medium") === len;
                      return (
                        <button
                          key={len}
                          disabled={isRegenerating}
                          onClick={() => handleLengthChange(len)}
                          className={[
                            "px-2.5 py-1 text-xs font-semibold rounded-md transition-all uppercase tracking-wider",
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

                  {/* Language Selector */}
                  <div className="flex items-center gap-1.5 rounded-lg bg-background p-1.5 border border-border/50 text-xs">
                    <Languages className="h-3.5 w-3.5 text-muted-foreground" />
                    <select
                      value={currentLang}
                      disabled={isRegenerating}
                      onChange={(e) => handleTranslate(e.target.value)}
                      className="bg-transparent text-foreground focus:outline-none font-semibold cursor-pointer"
                    >
                      {LANGUAGES.map((l) => (
                        <option key={l.code} value={l.label} className="bg-panel text-foreground">
                          {l.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* SSE Coverage Note Alerts */}
            {item.response.coverageNote && (
              <div className="flex gap-2.5 items-start rounded-xl border border-amber-500/20 bg-amber-500/10 p-3.5 text-xs text-amber-500">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Coverage Alert:</span> {item.response.coverageNote}
                </div>
              </div>
            )}

            {/* Layout Grid (Main vs Chat Panel) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Left Side: Summary and Highlights Content */}
              <div
                className={[chatOpen ? "lg:col-span-2" : "lg:col-span-3", "space-y-4"].join(" ")}
              >
                <div className="relative">
                  <AnimatePresence mode="wait">
                    {isRegenerating ? (
                      <motion.div
                        key="loader"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="rounded-2xl border border-border bg-panel/85 backdrop-blur-sm min-h-[400px] flex items-center justify-center"
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

                        {/* Study mode guides */}
                        {item.input?.mode === "study" && item.response.studyOutput && (
                          <StudyModeCard
                            data={item.response.studyOutput}
                            submode={item.input.studySubmode || "notes"}
                          />
                        )}

                        {/* Code analysis fields */}
                        {item.input?.mode === "code" && item.response.complexity && (
                          <div className="rounded-2xl border border-border bg-panel p-6 space-y-4 shadow-sm animate-in fade-in duration-200">
                            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-primary">
                              <Code2 className="h-3.5 w-3.5" />
                              <span>Code Logic Analysis</span>
                            </div>

                            <h3 className="font-semibold text-base sm:text-lg leading-snug">
                              {item.response.complexity.purposeOverview}
                            </h3>

                            <div className="flex flex-wrap gap-2">
                              <span className="rounded-md bg-primary/15 text-primary text-xs font-bold px-2.5 py-1">
                                {item.response.complexity.language}
                              </span>
                              <span className="rounded-md bg-amber-500/15 text-amber-500 text-xs font-bold px-2.5 py-1">
                                Time Complexity: {item.response.complexity.timeComplexity}
                              </span>
                              <span className="rounded-md bg-emerald-500/15 text-emerald-500 text-xs font-bold px-2.5 py-1">
                                Space Complexity: {item.response.complexity.spaceComplexity}
                              </span>
                            </div>

                            {item.response.complexity.algorithmBreakdown?.length > 0 && (
                              <div className="space-y-2 pt-2 border-t border-border/40">
                                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                  Algorithm breakdown
                                </div>
                                <ul className="space-y-2">
                                  {item.response.complexity.algorithmBreakdown.map(
                                    (item: string, i: number) => (
                                      <li key={i} className="flex gap-2.5 items-start text-sm">
                                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                                        <span className="leading-relaxed">{item}</span>
                                      </li>
                                    ),
                                  )}
                                </ul>
                              </div>
                            )}

                            {item.response.complexity.potentialIssues?.length > 0 && (
                              <div className="space-y-2 pt-2 border-t border-border/40">
                                <div className="text-xs font-bold text-destructive uppercase tracking-wider">
                                  Potential Issues / Vulnerabilities
                                </div>
                                <ul className="space-y-2">
                                  {item.response.complexity.potentialIssues.map(
                                    (item: string, i: number) => (
                                      <li
                                        key={i}
                                        className="flex gap-2.5 items-start text-sm text-muted-foreground"
                                      >
                                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                                        <span className="leading-relaxed">{item}</span>
                                      </li>
                                    ),
                                  )}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}

                        {/* GitHub Repository info details */}
                        {item.input?.type === "github" && item.response.repoDetails && (
                          <div className="rounded-2xl border border-border bg-panel p-6 space-y-4 shadow-sm animate-in fade-in duration-200">
                            <div className="text-[10px] uppercase tracking-[0.2em] text-primary">
                              GitHub Ingestion Details
                            </div>

                            <h3 className="font-semibold text-lg">
                              {item.response.repoDetails.repoName}
                            </h3>
                            <p className="text-sm leading-relaxed text-muted-foreground">
                              {item.response.repoDetails.architectureOverview}
                            </p>

                            {item.response.repoDetails.keyDependencies?.length > 0 && (
                              <div className="space-y-2">
                                <div className="text-xs font-bold text-muted-foreground uppercase">
                                  Key Dependencies
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {item.response.repoDetails.keyDependencies.map(
                                    (dep: string, i: number) => (
                                      <span
                                        key={i}
                                        className="bg-panel border border-border rounded-lg text-xs font-medium px-2 py-1"
                                      >
                                        {dep}
                                      </span>
                                    ),
                                  )}
                                </div>
                              </div>
                            )}

                            {item.response.repoDetails.setupInstructions && (
                              <div className="space-y-1.5">
                                <div className="text-xs font-bold text-muted-foreground uppercase">
                                  Setup Instructions
                                </div>
                                <pre className="p-3 bg-background border border-border rounded-xl text-xs overflow-x-auto font-mono text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                  {item.response.repoDetails.setupInstructions}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}

                        {item.response.keyPoints?.length > 0 && (
                          <KeyPoints points={item.response.keyPoints} />
                        )}

                        {/* Action items optional render */}
                        {item.response.actionItems && item.response.actionItems.length > 0 && (
                          <div className="rounded-2xl border border-border bg-panel p-6 shadow-sm">
                            <div className="text-[10px] uppercase tracking-[0.2em] text-primary mb-3">
                              Action Items
                            </div>
                            <ul className="space-y-2">
                              {item.response.actionItems.map((ai: string, i: number) => (
                                <li
                                  key={i}
                                  className="flex items-start gap-2.5 text-sm leading-relaxed"
                                >
                                  <span className="mt-1 h-3.5 w-3.5 shrink-0 rounded border border-border bg-panel flex items-center justify-center text-primary" />
                                  <span>{ai}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Open questions optional render */}
                        {item.response.openQuestions && item.response.openQuestions.length > 0 && (
                          <div className="rounded-2xl border border-border bg-panel p-6 shadow-sm">
                            <div className="text-[10px] uppercase tracking-[0.2em] text-amber-500 mb-3">
                              Open Questions & Gaps
                            </div>
                            <ul className="space-y-2">
                              {item.response.openQuestions.map((oq: string, i: number) => (
                                <li
                                  key={i}
                                  className="flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground"
                                >
                                  <span className="text-amber-500 font-bold">?</span>
                                  <span>{oq}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {item.response.keywords?.length > 0 && (
                          <Keywords keywords={item.response.keywords} />
                        )}

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
              </div>

              {/* Right Side: Chat Panel Drawer */}
              {chatOpen && (
                <div className="lg:col-span-1 lg:sticky lg:top-20 z-10">
                  <ChatPanel summaryId={id} onClose={() => setChatOpen(false)} />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </main>

      <Footer />
      <Toaster richColors position="top-right" />
    </div>
  );
}
