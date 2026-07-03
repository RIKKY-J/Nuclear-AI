import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { Sparkles, Zap } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SourceTabs from "@/components/input/SourceTabs";
import TextInput from "@/components/input/TextInput";
import UrlInput from "@/components/input/UrlInput";
import FileUploader from "@/components/input/FileUploader";
import ErrorMessage from "@/components/common/ErrorMessage";
import Loader from "@/components/common/Loader";

import { useSummarizer } from "@/hooks/useSummarizer";
import { SOURCES } from "@/utils/constants";
import { addHistory } from "@/lib/history";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const s = useSummarizer();
  const navigate = useNavigate();
  const cfg = SOURCES.find((x) => x.id === s.source)!;

  const handleSubmit = async () => {
    const res = await s.submit("medium");
    if (!res) return;
    const preview =
      s.source === "text"
        ? s.text
        : s.source === "website"
          ? s.websiteUrl
          : s.source === "youtube"
            ? s.youtubeUrl
            : s.file?.name ?? "";
    const item = addHistory(res.response, res.input, "medium", preview);
    navigate({ to: "/result/$id", params: { id: item.id } });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 hero-grid opacity-70 pointer-events-none" />
        <div className="absolute left-1/2 top-0 -translate-x-1/2 h-64 w-[600px] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 pt-16 pb-10 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-panel/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <Zap className="h-3 w-3 text-primary" />
            Powered by nuclear-grade AI
          </div>
          <h1 className="mt-5 font-display text-4xl sm:text-6xl font-bold tracking-tight">
            Summarize <span className="text-primary">anything</span>,
            <br /> in seconds.
          </h1>
          <p className="mt-4 mx-auto max-w-xl text-base sm:text-lg text-muted-foreground">
            Turn documents, websites, and YouTube transcripts into clear, structured summaries with Nuclear AI.
          </p>
        </div>
      </section>

      {/* Input only */}
      <main className="relative mx-auto w-full max-w-4xl flex-1 px-4 sm:px-6 pb-16">
        <section className="space-y-4 rounded-2xl border border-border bg-panel/40 p-5 sm:p-6 backdrop-blur">
          <SourceTabs value={s.source} onChange={s.changeSource} disabled={s.status === "loading"} />

          <AnimatePresence mode="wait">
            <motion.div
              key={s.status === "loading" ? "loading" : s.source}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              {s.status === "loading" ? (
                <Loader />
              ) : (
                <>
                  {cfg.kind === "text" && <TextInput value={s.text} onChange={s.setText} />}
                  {cfg.kind === "url" && (
                    <UrlInput value={s.websiteUrl} onChange={s.setWebsiteUrl} variant="website" />
                  )}
                  {cfg.kind === "youtube" && (
                    <UrlInput value={s.youtubeUrl} onChange={s.setYoutubeUrl} variant="youtube" />
                  )}
                  {cfg.kind === "file" && (
                    <FileUploader source={cfg} file={s.file} onChange={s.setFile} />
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>

          {s.error && <ErrorMessage message={s.error} />}

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
            {s.status === "loading" ? "Generating Summary…" : "Summarize"}
          </button>
        </section>
      </main>

      <Footer />
      <Toaster richColors position="top-right" />
    </div>
  );
}
