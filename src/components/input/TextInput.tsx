import { TEXT_MAX, TEXT_MIN } from "@/utils/constants";

export default function TextInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const len = value.length;
  const over = len > TEXT_MAX;
  const near = len > TEXT_MAX * 0.9;
  const color = over ? "text-destructive" : near ? "text-amber-500" : "text-muted-foreground";

  return (
    <div className="space-y-2">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste your text here…"
        rows={10}
        className="w-full resize-y rounded-xl border border-border bg-panel/60 px-4 py-3 text-sm leading-relaxed placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
      />
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">
          Min {TEXT_MIN} · Max {TEXT_MAX.toLocaleString("en-US")} characters
        </span>
        <span className={color}>{len.toLocaleString("en-US")}</span>
      </div>
    </div>
  );
}
