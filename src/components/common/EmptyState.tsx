import { Sparkles } from "lucide-react";

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-panel/40 py-16 px-6 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Sparkles className="h-6 w-6" />
      </div>
      <h3 className="font-display text-lg font-semibold">No summary yet</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Upload a document, paste a URL, or drop in some text to generate a crisp AI summary.
      </p>
    </div>
  );
}
