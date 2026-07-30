export default function SummaryCard({ title, summary }: { title: string; summary: string }) {
  return (
    <div className="rounded-2xl border border-border bg-panel p-6">
      <div className="text-[10px] uppercase tracking-[0.2em] text-primary mb-2">Executive Summary</div>
      <h2 className="font-display text-2xl font-semibold leading-tight mb-4">{title}</h2>
      <p className="text-[15px] leading-relaxed text-foreground/90 whitespace-pre-line">
        {summary}
      </p>
    </div>
  );
}
