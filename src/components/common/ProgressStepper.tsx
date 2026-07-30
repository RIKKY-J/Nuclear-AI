import { Check } from "lucide-react";

export default function ProgressStepper({
  currentStage,
}: {
  currentStage: 0 | 1 | 2; // 0 = Input, 1 = Processing, 2 = Result
}) {
  const steps = [
    { label: "Configure Input", description: "Select source & options" },
    { label: "AI Analysis", description: "Extracting & summarizing" },
    { label: "View Results", description: "Ready to read & export" },
  ];

  return (
    <div className="w-full py-4 border-b border-border/40 bg-panel/20 backdrop-blur-sm">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 flex items-center justify-between">
        {steps.map((step, idx) => {
          const isCompleted = currentStage > idx;
          const isActive = currentStage === idx;
          const isPending = currentStage < idx;

          return (
            <div key={idx} className="flex items-center flex-1 last:flex-initial">
              {/* Step indicator */}
              <div className="flex items-center gap-3">
                <div
                  className={[
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 border",
                    isCompleted
                      ? "bg-primary text-primary-foreground border-primary glow-primary"
                      : isActive
                        ? "bg-primary/20 text-primary border-primary animate-pulse"
                        : "bg-panel/40 text-muted-foreground border-border",
                  ].join(" ")}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : idx + 1}
                </div>

                <div className="hidden md:block leading-tight text-left">
                  <div
                    className={[
                      "text-xs font-semibold",
                      isActive
                        ? "text-foreground"
                        : isCompleted
                          ? "text-muted-foreground"
                          : "text-muted-foreground/60",
                    ].join(" ")}
                  >
                    {step.label}
                  </div>
                  <div className="text-[10px] text-muted-foreground/50">{step.description}</div>
                </div>
              </div>

              {/* Connecting line */}
              {idx < steps.length - 1 && (
                <div className="flex-1 mx-4 h-0.5 relative hidden sm:block bg-border/40">
                  <div
                    className="absolute top-0 left-0 h-full bg-primary transition-all duration-500"
                    style={{ width: isCompleted ? "100%" : "0%" }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
