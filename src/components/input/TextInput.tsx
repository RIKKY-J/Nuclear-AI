import { TEXT_MAX, TEXT_MIN } from "@/utils/constants";

export default function TextInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const len = value.length;
  const isOver = len > TEXT_MAX;
  const isCritical = len >= TEXT_MAX * 0.95 && len <= TEXT_MAX;
  const isWarning = len >= TEXT_MAX * 0.8 && len < TEXT_MAX * 0.95;

  const color = isOver || isCritical
    ? "text-destructive font-semibold"
    : isWarning
      ? "text-amber-500 font-semibold"
      : "text-muted-foreground";

  return (
    <div className="space-y-2">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste your text here…"
        rows={10}
        className="w-full resize-y rounded-xl border border-border bg-panel/60 px-4 py-3 text-sm leading-relaxed placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
      />
      <div className="flex justify-between items-center text-xs">
        <span className="text-muted-foreground flex items-center gap-1.5">
          <span>Min {TEXT_MIN} · Max {TEXT_MAX.toLocaleString("en-US")} characters</span>
          {isOver && <span className="text-destructive font-medium">· Character limit exceeded!</span>}
          {isCritical && <span className="text-destructive font-medium">· Approaching limit (95%+)</span>}
          {isWarning && <span className="text-amber-500 font-medium">· Nearing limit (80%+)</span>}
        </span>
        <span className={color}>
          {len.toLocaleString("en-US")} / {TEXT_MAX.toLocaleString("en-US")}
        </span>
      </div>
    </div>
  );
}
