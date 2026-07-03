export default function Keywords({ keywords }: { keywords: string[] }) {
  return (
    <div className="rounded-2xl border border-border bg-panel p-6">
      <div className="text-[10px] uppercase tracking-[0.2em] text-primary mb-3">Keywords</div>
      <div className="flex flex-wrap gap-2">
        {keywords.map((k) => (
          <span
            key={k}
            className="inline-flex items-center rounded-full border border-border bg-accent/40 px-3 py-1 text-xs font-medium"
          >
            {k}
          </span>
        ))}
      </div>
    </div>
  );
}
