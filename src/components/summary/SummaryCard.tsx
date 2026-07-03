export default function SummaryCard({ title, summary }: { title: string; summary: string }) {
  // Split the summary string by standard bullet characters at the start of lines and filter out empty strings
  const points = summary
    .split(/(?:\r?\n|^)\s*[-•]\s*/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="rounded-2xl border border-border bg-panel p-6">
      <div className="text-[10px] uppercase tracking-[0.2em] text-primary mb-2">Summary</div>
      <h2 className="font-display text-2xl font-semibold leading-tight mb-4">{title}</h2>
      
      {points.length > 0 ? (
        <ul className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
          {points.map((point, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-[15px] leading-relaxed text-foreground/90">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[15px] leading-relaxed text-foreground/90 max-h-[420px] overflow-y-auto pr-1 whitespace-pre-line">
          {summary}
        </p>
      )}
    </div>
  );
}
