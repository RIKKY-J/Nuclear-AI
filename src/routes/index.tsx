import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { Sparkles, Zap, ChevronDown, Settings2, BookOpen, Code, FileText } from "lucide-react";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SourceTabs from "@/components/input/SourceTabs";
import TextInput from "@/components/input/TextInput";
import UrlInput from "@/components/input/UrlInput";
import FileUploader from "@/components/input/FileUploader";
import ErrorMessage from "@/components/common/ErrorMessage";
import Loader from "@/components/common/Loader";
import SourcePreviewCard from "@/components/input/SourcePreviewCard";
import ProgressStepper from "@/components/common/ProgressStepper";

import { useSummarizer } from "@/hooks/useSummarizer";
import { SOURCES } from "@/utils/constants";
import { addHistory } from "@/lib/history";
import { getPreviewMetadataFn } from "@/lib/summarize.functions";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const s = useSummarizer();
  const navigate = useNavigate();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [currentStage, setCurrentStage] = useState<0 | 1 | 2>(0);

  const cfg = SOURCES.find((x) => x.id === s.source)!;

  const handleSubmit = async () => {
    setCurrentStage(1); // Processing
    setPreviewData(null);

    // Fetch quick preview metadata if URL or File
    if (s.source === "website" || s.source === "youtube" || s.source === "github") {
      try {
        const urlVal = s.source === "youtube" ? s.youtubeUrl : s.websiteUrl;
        const meta = await getPreviewMetadataFn({ type: s.source as any, url: urlVal });
        setPreviewData(meta);
      } catch (e) {
        console.error("Preview fetch failed", e);
        // Fallback title card
        setPreviewData({
          type: s.source,
          title: s.source === "youtube" ? s.youtubeUrl : s.websiteUrl,
        });
      }
    } else if (s.file) {
      setPreviewData({
        type: "file",
        title: s.file.name,
        fileName: s.file.name,
        fileSize: s.file.size,
      });
    }

    const res = await s.submit("medium");
    if (!res) {
      setCurrentStage(0); // Reset
      setPreviewData(null);
      return;
    }

    setCurrentStage(2); // Result ready
    const preview = res.response.title;
    addHistory(res.response, res.input, "medium", preview, res.id);
    navigate({ to: "/result/$id", params: { id: res.id } });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 hero-grid opacity-70 pointer-events-none" />
        <div className="absolute left-1/2 top-0 -translate-x-1/2 h-64 w-[600px] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 pt-12 pb-6 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-panel/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <Zap className="h-3 w-3 text-primary animate-pulse" />
            Powered by nuclear-grade AI
          </div>
          <h1 className="mt-5 font-display text-4xl sm:text-6xl font-bold tracking-tight">
            Summarize <span className="text-primary">anything</span>,
            <br /> in seconds.
          </h1>
          <p className="mt-4 mx-auto max-w-xl text-base sm:text-lg text-muted-foreground">
            Turn code repositories, documents, audio recordings, websites, and videos into clear, structured summaries.
          </p>
        </div>
      </section>

      {/* Main Form */}
      <main className="relative mx-auto w-full max-w-4xl flex-1 px-4 sm:px-6 pb-16">
        <section className="space-y-4 rounded-2xl border border-border bg-panel/40 p-5 sm:p-6 backdrop-blur">
          
          {/* Stepper only during active loading */}
          {s.status === "loading" && <ProgressStepper currentStage={currentStage} />}

          {s.status === "loading" ? (
            <div className="space-y-6 py-6">
              {previewData && <SourcePreviewCard data={previewData} />}
              <Loader />
            </div>
          ) : (
            <>
              <SourceTabs value={s.source} onChange={s.changeSource} disabled={s.status === "loading"} />

              <AnimatePresence mode="wait">
                <motion.div
                  key={s.source}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                >
                  {cfg.kind === "text" && <TextInput value={s.text} onChange={s.setText} />}
                  {s.source === "github" && (
                    <UrlInput value={s.websiteUrl} onChange={s.setWebsiteUrl} variant="github" />
                  )}
                  {cfg.kind === "url" && s.source !== "github" && (
                    <UrlInput value={s.websiteUrl} onChange={s.setWebsiteUrl} variant="website" />
                  )}
                  {cfg.kind === "youtube" && (
                    <UrlInput value={s.youtubeUrl} onChange={s.setYoutubeUrl} variant="youtube" />
                  )}
                  {(cfg.kind === "file" || cfg.kind === "audio") && (
                    <FileUploader source={cfg} file={s.file} onChange={s.setFile} />
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Advanced Configurations Collapsible */}
              <div className="rounded-xl border border-border/60 bg-panel/20 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <Settings2 className="h-3.5 w-3.5" />
                    <span>Advanced Customizations</span>
                  </div>
                  <ChevronDown className={["h-3.5 w-3.5 transition-transform", showAdvanced && "rotate-180"].join(" ")} />
                </button>

                {showAdvanced && (
                  <div className="p-4 border-t border-border/40 space-y-4 bg-background/10 animate-in fade-in duration-200">
                    {/* Summary Focus / Custom Prompt */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Custom Lens (Prompt Guidance)
                      </label>
                      <input
                        type="text"
                        value={s.customLens}
                        onChange={(e) => s.setCustomLens(e.target.value)}
                        placeholder="e.g. Explain like I'm 5, focus on financial statistics, risk assessment"
                        className="w-full rounded-lg border border-border bg-panel px-3.5 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>

                    {/* Mode steering */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                        AI Output Mode
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {([
                          { id: "standard", label: "Standard", icon: FileText },
                          { id: "study", label: "Study Mode", icon: BookOpen },
                          { id: "code", label: "Code Mode", icon: Code },
                        ] as const).map((m) => {
                          const Icon = m.icon;
                          const active = s.mode === m.id;
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => s.setMode(m.id)}
                              className={[
                                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all",
                                active
                                  ? "bg-primary/10 border-primary/45 text-primary"
                                  : "border-border hover:bg-accent/40 text-muted-foreground",
                              ].join(" ")}
                            >
                              <Icon className="h-3.5 w-3.5" />
                              {m.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Study submodes */}
                    {s.mode === "study" && (
                      <div className="space-y-1.5 pt-1 border-t border-border/30 animate-in slide-in-from-top-1">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                          Study Submode
                        </label>
                        <div className="flex gap-2">
                          {(["notes", "flashcards", "qa"] as const).map((sub) => {
                            const active = s.studySubmode === sub;
                            return (
                              <button
                                key={sub}
                                type="button"
                                onClick={() => s.setStudySubmode(sub)}
                                className={[
                                  "rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all uppercase tracking-wider",
                                  active
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "border-border hover:bg-accent/40 text-muted-foreground",
                                ].join(" ")}
                              >
                                {sub}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {s.error && <ErrorMessage message={s.error} />}

          {s.status !== "loading" && (
            <button
              onClick={handleSubmit}
              disabled={!s.canSubmit}
              className={[
                "group inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold transition-all",
                s.canSubmit
                  ? "bg-primary text-primary-foreground glow-primary hover:brightness-110"
                  : "bg-muted text-muted-foreground cursor-not-allowed",
              ].join(" ")}
            >
              <Sparkles className="h-4 w-4 group-enabled:group-hover:rotate-12 transition-transform" />
              Summarize
            </button>
          )}
        </section>
      </main>

      <Footer />
      <Toaster richColors position="top-right" />
    </div>
  );
}
