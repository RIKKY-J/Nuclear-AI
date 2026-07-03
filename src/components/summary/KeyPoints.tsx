import { Check } from "lucide-react";

export default function KeyPoints({ points }: { points: string[] }) {
  return (
    <div className="rounded-2xl border border-border bg-panel p-6">
      <div className="text-[10px] uppercase tracking-[0.2em] text-primary mb-3">Key Points</div>
      <ul className="space-y-2.5">
        {points.map((p, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
              <Check className="h-3 w-3" strokeWidth={3} />
            </span>
            <span className="leading-relaxed">{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
