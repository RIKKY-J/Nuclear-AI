import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Clock,
  FileText,
  Trash2,
  Heart,
  Search,
  Filter,
  ArrowUpDown,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  getHistoryListFn,
  toggleFavoriteFn,
  deleteSummaryFn,
  clearUserHistoryFn,
  syncAnonymousHistoryFn,
} from "@/lib/history.functions";
import { getCurrentUserFn } from "@/lib/auth.functions";
import { type HistoryItem } from "@/lib/history";

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
  return new Date(ts).toLocaleDateString();
}

const FILTER_SOURCES = [
  { id: "all", label: "All" },
  { id: "pdf", label: "PDF" },
  { id: "docx", label: "DOCX" },
  { id: "txt", label: "TXT" },
  { id: "markdown", label: "Markdown" },
  { id: "website", label: "Website" },
  { id: "youtube", label: "YouTube" },
  { id: "github", label: "GitHub" },
  { id: "audio", label: "Audio" },
];

function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);

  // Filter/Sort States
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"date" | "wordCount">("date");
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const activeUser = await getCurrentUserFn();
      setUser(activeUser);

      if (activeUser) {
        // Sync any session storage history
        const localRaw = sessionStorage.getItem("nuclear:history");
        if (localRaw) {
          const localItems = JSON.parse(localRaw) as HistoryItem[];
          const localIds = localItems.map((x) => x.id);
          if (localIds.length > 0) {
            await syncAnonymousHistoryFn({ ids: localIds });
            sessionStorage.removeItem("nuclear:history");
          }
        }
        const serverItems = await getHistoryListFn();
        setItems(serverItems as HistoryItem[]);
      } else {
        const localRaw = sessionStorage.getItem("nuclear:history");
        const localItems = localRaw ? (JSON.parse(localRaw) as HistoryItem[]) : [];
        setItems(localItems);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load history list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleToggleFavorite = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const { favorite } = await toggleFavoriteFn({ id });
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, favorite } : item)));
      toast.success(favorite ? "Added to favorites" : "Removed from favorites");
    } catch {
      toast.error("Could not toggle favorite");
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await deleteSummaryFn({ id });
      setItems((prev) => prev.filter((item) => item.id !== id));
      // Update local storage too if anonymous
      if (!user) {
        const localRaw = sessionStorage.getItem("nuclear:history");
        if (localRaw) {
          const localItems = JSON.parse(localRaw) as HistoryItem[];
          sessionStorage.setItem(
            "nuclear:history",
            JSON.stringify(localItems.filter((x) => x.id !== id)),
          );
        }
      }
      toast.success("Summary deleted");
    } catch {
      toast.error("Could not delete summary");
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to clear all history? This cannot be undone."))
      return;

    try {
      await clearUserHistoryFn();
      setItems([]);
      sessionStorage.removeItem("nuclear:history");
      toast.success("History cleared");
    } catch {
      toast.error("Could not clear history");
    }
  };

  // Perform client side search filtering and sorting
  const filteredItems = items
    .filter((item) => {
      const matchesSearch =
        item.response.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.response.summary.toLowerCase().includes(searchQuery.toLowerCase());

      const sType = item.sourceType?.toLowerCase() || item.input?.type?.toLowerCase() || "";
      const matchesSource = sourceFilter === "all" || sType === sourceFilter.toLowerCase();

      const matchesFav = !showOnlyFavorites || item.favorite;

      return matchesSearch && matchesSource && matchesFav;
    })
    .sort((a, b) => {
      if (sortBy === "wordCount") {
        return b.response.wordCount - a.response.wordCount;
      }
      return b.createdAt - a.createdAt;
    });

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
              onClick={handleClearAll}
              className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 px-3 py-2 text-sm font-medium transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear all
            </button>
          )}
        </div>

        <h1 className="font-display text-3xl font-bold tracking-tight mb-2">History Log</h1>
        <p className="text-sm text-muted-foreground mb-6">
          {user
            ? "Syncing history securely to your Nuclear account."
            : "Your summaries from this browser session. Sign In to save permanently."}
        </p>

        {loading ? (
          <div className="min-h-[250px] flex items-center justify-center">
            <Loader />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-panel/40 py-16 px-6 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Clock className="h-6 w-6" />
            </div>
            <h3 className="font-display text-lg font-semibold">No history yet</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Generate a summary on the home page, and it will appear here.
            </p>
            <Link
              to="/"
              className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:brightness-110"
            >
              Create a summary
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Search, Filter, Sort Controls */}
            <div className="space-y-4 rounded-2xl border border-border/60 bg-panel/30 p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search history by title or content…"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="flex gap-2">
                  {/* Sort selection dropdown */}
                  <div className="flex items-center gap-1.5 border border-border bg-background rounded-xl px-3 py-2 text-xs font-semibold">
                    <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as "date" | "wordCount")}
                      className="bg-transparent text-foreground focus:outline-none cursor-pointer font-semibold"
                    >
                      <option value="date" className="bg-panel">
                        Sort: Newest
                      </option>
                      <option value="wordCount" className="bg-panel">
                        Sort: Word Count
                      </option>
                    </select>
                  </div>

                  {/* Favorite Toggle button Filter */}
                  <button
                    onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                    className={[
                      "flex items-center gap-1.5 border rounded-xl px-3.5 py-2 text-xs font-semibold transition-all",
                      showOnlyFavorites
                        ? "bg-primary/20 border-primary/40 text-primary"
                        : "border-border bg-background text-muted-foreground hover:text-foreground",
                    ].join(" ")}
                  >
                    <Heart
                      className={["h-3.5 w-3.5", showOnlyFavorites && "fill-primary"].join(" ")}
                    />
                    <span>Favorites</span>
                  </button>
                </div>
              </div>

              {/* Source chips filter list */}
              <div className="space-y-1.5 pt-2 border-t border-border/40">
                <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground/75 font-semibold">
                  <Filter className="h-3 w-3" />
                  <span>Filter by source type</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {FILTER_SOURCES.map((s) => {
                    const active = sourceFilter === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setSourceFilter(s.id)}
                        className={[
                          "px-2.5 py-1 text-xs font-medium rounded-lg transition-colors border",
                          active
                            ? "bg-primary border-primary text-primary-foreground font-semibold"
                            : "border-border/80 bg-background/50 hover:bg-accent/40 text-muted-foreground",
                        ].join(" ")}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* List log */}
            {filteredItems.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground border border-dashed border-border rounded-xl">
                No history entries matched your search criteria.
              </div>
            ) : (
              <ul className="space-y-3">
                {filteredItems.map((item) => {
                  const sType = item.sourceType || item.input?.type || "Text";
                  return (
                    <li
                      key={item.id}
                      className="group rounded-2xl border border-border bg-panel p-4 hover:border-primary/40 transition-colors relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <Link to="/result/$id" params={{ id: item.id }} className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-primary">
                            <FileText className="h-3 w-3" />
                            {sType}
                            <span className="text-muted-foreground normal-case tracking-normal">
                              · {timeAgo(item.createdAt)}
                              {item.response.wordCount > 0 &&
                                ` · ${item.response.wordCount.toLocaleString()} words`}
                            </span>
                          </div>
                          <div className="mt-1 font-display text-lg font-semibold truncate pr-16">
                            {item.response.title}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                            {item.preview || item.response.summary}
                          </p>
                        </Link>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Heart Favorite button */}
                          <button
                            onClick={(e) => handleToggleFavorite(e, item.id)}
                            aria-label="Favorite"
                            className={[
                              "p-2 rounded-lg border border-border hover:bg-accent transition-colors shrink-0",
                              item.favorite
                                ? "text-red-500 border-red-500/25 bg-red-500/5"
                                : "text-muted-foreground",
                            ].join(" ")}
                          >
                            <Heart
                              className={["h-3.5 w-3.5", item.favorite && "fill-red-500"].join(" ")}
                            />
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={(e) => handleDelete(e, item.id)}
                            aria-label="Remove"
                            className="rounded-lg border border-border p-2 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:border-destructive/40 hover:bg-destructive/10 transition-all shrink-0"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </main>

      <Footer />
      <Toaster richColors position="top-right" />
    </div>
  );
}
