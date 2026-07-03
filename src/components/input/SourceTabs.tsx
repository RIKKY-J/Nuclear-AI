import { SOURCES, type SourceType } from "@/utils/constants";

export default function SourceTabs({
  value,
  onChange,
  disabled,
}: {
  value: SourceType;
  onChange: (v: SourceType) => void;
  disabled?: boolean;
}) {
  return (
    <div
      role="tablist"
      aria-label="Source type"
      className="grid grid-cols-4 gap-1.5 rounded-xl bg-panel/60 border border-border p-1.5 sm:grid-cols-8"
    >
      {SOURCES.map((s) => {
        const Icon = s.icon;
        const active = value === s.id;
        return (
          <button
            key={s.id}
            role="tab"
            aria-selected={active}
            disabled={disabled}
            onClick={() => onChange(s.id)}
            className={[
              "flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-2 text-xs sm:text-sm font-medium transition-all",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/60",
              disabled && "opacity-50 cursor-not-allowed",
            ].join(" ")}
          >
            <Icon className="h-4 w-4" />
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
