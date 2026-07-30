import { Atom, History } from "lucide-react";
import { Link } from "@tanstack/react-router";
import ThemeToggle from "@/components/common/ThemeToggle";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full items-center justify-between px-4 sm:px-8 lg:px-12">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Atom className="h-5 w-5 animate-pulse-ring" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-lg font-semibold tracking-tight">Nuclear AI</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Summarizer
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to="/history"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-panel/60 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
            activeProps={{ className: "!text-primary !border-primary/40" }}
          >
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">History</span>
          </Link>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
