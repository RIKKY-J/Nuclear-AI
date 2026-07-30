import { Link2, Youtube, Github } from "lucide-react";

export default function UrlInput({
  value,
  onChange,
  variant,
}: {
  value: string;
  onChange: (v: string) => void;
  variant: "website" | "youtube" | "github";
}) {
  const isYt = variant === "youtube";
  const isGit = variant === "github";
  const Icon = isYt ? Youtube : isGit ? Github : Link2;

  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={isYt ? "https://youtu.be/…" : isGit ? "https://github.com/owner/repo" : "https://example.com"}
        inputMode="url"
        autoComplete="off"
        className="w-full rounded-xl border border-border bg-panel/60 pl-10 pr-4 py-3 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
      />
    </div>
  );
}
