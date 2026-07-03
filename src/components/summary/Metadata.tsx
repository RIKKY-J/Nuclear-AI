import { Clock, FileType2, Hash } from "lucide-react";

export default function Metadata({
  readingTime,
  wordCount,
  source,
}: {
  readingTime: string;
  wordCount: number;
  source: string;
}) {
  const items = [
    { icon: Clock, label: "Reading Time", value: readingTime },
    { icon: Hash, label: "Word Count", value: wordCount.toLocaleString("en-US") },
    { icon: FileType2, label: "Source", value: source },
  ];
  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map(({ icon: Icon, label, value }) => (
        <div key={label} className="rounded-xl border border-border bg-panel p-4">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
            <Icon className="h-3 w-3" />
            {label}
          </div>
          <div className="mt-1.5 font-display text-lg font-semibold">{value}</div>
        </div>
      ))}
    </div>
  );
}
