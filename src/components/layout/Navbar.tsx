import { History } from "lucide-react";
import { Link } from "@tanstack/react-router";
import ThemeToggle from "@/components/common/ThemeToggle";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full items-center justify-between px-4 sm:px-8 lg:px-12">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden bg-white border border-border/50">
            <svg viewBox="0 0 512 512" className="h-6 w-6 text-black">
              <circle cx="256" cy="256" r="250" fill="#ffffff" />
              <g fill="none" stroke="#000000" strokeWidth="40" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="256" cy="256" r="46" />
                <path d="M 228 304.5 A 56 56 0 0 0 284 304.5 L 343.5 407.6 A 175 175 0 0 1 168.5 407.6 Z" />
                <path d="M 228 304.5 A 56 56 0 0 0 284 304.5 L 343.5 407.6 A 175 175 0 0 1 168.5 407.6 Z" transform="rotate(120 256 256)" />
                <path d="M 228 304.5 A 56 56 0 0 0 284 304.5 L 343.5 407.6 A 175 175 0 0 1 168.5 407.6 Z" transform="rotate(240 256 256)" />
              </g>
            </svg>
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
