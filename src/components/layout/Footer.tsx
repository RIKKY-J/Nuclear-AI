export default function Footer() {
  return (
    <footer className="border-t border-border/60 mt-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
          <span>© {new Date().getFullYear()} Nuclear AI · Summarize anything, instantly.</span>
          <span className="hidden sm:inline">|</span>
          <span className="font-medium text-foreground">Developer : Rikky J</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse-ring" />
          <span>Reactor online</span>
        </div>
      </div>
    </footer>
  );
}
