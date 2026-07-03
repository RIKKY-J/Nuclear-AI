import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Clock, FileText, Trash2 } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { clearHistory, removeHistory, useHistory } from "@/lib/history";

export const Route = createFileRoute("/history")({
  component: HistoryPage,
});

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(ts).toLocaleString();
}

function HistoryPage() {
  const items = useHistory();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="relative mx-auto w-full max-w-4xl flex-1 px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-panel/60 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          {items.length > 0 && (
            <button
              onClick={clearHistory}
              className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 px-3 py-2 text-sm font-medium transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear all
            </button>
          )}
        </div>

        <h1 className="font-display text-3xl font-bold tracking-tight mb-2">History</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Your summaries from this session. Cleared when you close the tab.
        </p>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-panel/40 py-16 px-6 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Clock className="h-6 w-6" />
            </div>
            <h3 className="font-display text-lg font-semibold">No history yet</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Generate a summary and it will appear here for the rest of this session.
            </p>
            <Link
              to="/"
              className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:brightness-110"
            >
              Create a summary
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="group rounded-2xl border border-border bg-panel p-4 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <Link
                    to="/result/$id"
                    params={{ id: item.id }}
                    className="flex-1 min-w-0"
                  >
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-primary">
                      <FileText className="h-3 w-3" />
                      {item.response.source}
                      <span className="text-muted-foreground normal-case tracking-normal">
                        · {timeAgo(item.createdAt)}
                      </span>
                    </div>
                    <div className="mt-1 font-display text-lg font-semibold truncate">
                      {item.response.title}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {item.preview || item.response.summary}
                    </p>
                  </Link>
                  <button
                    onClick={() => removeHistory(item.id)}
                    aria-label="Remove"
                    className="shrink-0 rounded-lg border border-border p-2 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:border-destructive/40 transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      <Footer />
      <Toaster richColors position="top-right" />
    </div>
  );
}
