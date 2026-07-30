import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
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
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Group sources
  const primaryIds: SourceType[] = ["text", "website", "youtube", "pdf"];
  const primarySources = SOURCES.filter((s) => primaryIds.includes(s.id));
  const overflowSources = SOURCES.filter((s) => !primaryIds.includes(s.id));

  const isOverflowActive = overflowSources.some((s) => s.id === value);
  const activeOverflowSource = overflowSources.find((s) => s.id === value);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative flex flex-col gap-2">
      <div
        role="tablist"
        aria-label="Source type"
        className="flex items-center gap-1.5 rounded-xl bg-panel/60 border border-border p-1.5 overflow-x-auto scrollbar-none"
      >
        {/* Primary Tabs */}
        {primarySources.map((s) => {
          const Icon = s.icon;
          const active = value === s.id;
          return (
            <button
              key={s.id}
              role="tab"
              aria-selected={active}
              disabled={disabled}
              onClick={() => {
                onChange(s.id);
                setIsOpen(false);
              }}
              className={[
                "flex-1 flex items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2.5 text-xs sm:text-sm font-semibold transition-all min-h-[44px]",
                active
                  ? "bg-primary text-primary-foreground shadow-sm glow-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/40",
                disabled && "opacity-50 cursor-not-allowed",
              ].join(" ")}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{s.label}</span>
            </button>
          );
        })}

        {/* Overflow / More Sources Dropdown Trigger */}
        <div ref={dropdownRef} className="relative flex-1 min-w-[120px]">
          <button
            type="button"
            disabled={disabled}
            onClick={() => setIsOpen(!isOpen)}
            className={[
              "w-full flex items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2.5 text-xs sm:text-sm font-semibold transition-all min-h-[44px]",
              isOverflowActive
                ? "bg-primary/20 text-primary border border-primary/30"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/40 border border-transparent",
              disabled && "opacity-50 cursor-not-allowed",
            ].join(" ")}
          >
            {isOverflowActive && activeOverflowSource ? (
              <>
                <activeOverflowSource.icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{activeOverflowSource.label}</span>
              </>
            ) : (
              <span>More</span>
            )}
            <ChevronDown
              className={["h-4 w-4 shrink-0 transition-transform", isOpen && "rotate-180"].join(
                " ",
              )}
            />
          </button>

          {/* Dropdown Menu */}
          {isOpen && (
            <div className="absolute right-0 top-full mt-2 z-50 w-48 rounded-xl border border-border bg-panel p-1.5 shadow-xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-155">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-3 py-1.5 border-b border-border/40 mb-1">
                Other Sources
              </div>
              <div className="max-h-60 overflow-y-auto">
                {overflowSources.map((s) => {
                  const Icon = s.icon;
                  const active = value === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        onChange(s.id);
                        setIsOpen(false);
                      }}
                      className={[
                        "w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs sm:text-sm font-medium transition-colors min-h-[40px]",
                        active
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                      ].join(" ")}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
