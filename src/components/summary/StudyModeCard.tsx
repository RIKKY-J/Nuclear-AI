import { useState } from "react";
import { BookOpen, HelpCircle, Layers, Check, ChevronDown, ChevronUp } from "lucide-react";

interface Flashcard {
  front: string;
  back: string;
}

interface QaPair {
  question: string;
  answer: string;
}

interface StudyOutputData {
  notes?: string[];
  flashcards?: Flashcard[];
  qa?: QaPair[];
}

export default function StudyModeCard({
  data,
  submode,
}: {
  data: StudyOutputData;
  submode: "notes" | "flashcards" | "qa";
}) {
  const [activeCardIdx, setActiveCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [revealedQaIdxs, setRevealedQaIdxs] = useState<Record<number, boolean>>({});

  const toggleQa = (idx: number) => {
    setRevealedQaIdxs((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleNextCard = () => {
    if (!data.flashcards) return;
    setIsFlipped(false);
    setTimeout(() => {
      setActiveCardIdx((prev) => (prev + 1) % data.flashcards!.length);
    }, 150);
  };

  const handlePrevCard = () => {
    if (!data.flashcards) return;
    setIsFlipped(false);
    setTimeout(() => {
      setActiveCardIdx((prev) => (prev - 1 + data.flashcards!.length) % data.flashcards!.length);
    }, 150);
  };

  return (
    <div className="rounded-2xl border border-border bg-panel p-6 shadow-lg animate-in fade-in duration-200">
      {/* Submode Header */}
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-primary mb-4">
        {submode === "notes" && (
          <>
            <BookOpen className="h-3.5 w-3.5" />
            <span>Chapter Study Notes</span>
          </>
        )}
        {submode === "flashcards" && (
          <>
            <Layers className="h-3.5 w-3.5" />
            <span>Interactive Flashcards</span>
          </>
        )}
        {submode === "qa" && (
          <>
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Practice Exam Q&A</span>
          </>
        )}
      </div>

      {/* 1. Notes Submode */}
      {submode === "notes" && (
        <div className="space-y-4">
          {data.notes && data.notes.length > 0 ? (
            <ul className="space-y-3.5">
              {data.notes.map((note, idx) => (
                <li key={idx} className="flex items-start gap-3 text-[15px] leading-relaxed text-foreground/90">
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span className="whitespace-pre-line">{note}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No study notes generated. Switch submodes or try again.</p>
          )}
        </div>
      )}

      {/* 2. Flashcards Submode */}
      {submode === "flashcards" && (
        <div className="flex flex-col items-center py-4 space-y-6">
          {data.flashcards && data.flashcards.length > 0 ? (
            <>
              {/* Flashing Card container with 3D Flip */}
              <div
                className="w-full max-w-sm h-52 cursor-pointer perspective"
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <div
                  className={[
                    "relative w-full h-full duration-500 preserve-3d transition-transform shadow-xl rounded-2xl border border-border bg-background",
                    isFlipped && "rotate-y-180",
                  ].join(" ")}
                >
                  {/* Card Front */}
                  <div className="absolute inset-0 w-full h-full backface-hidden flex flex-col items-center justify-center p-6 text-center bg-panel/40 rounded-2xl">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-2">Question / Concept</div>
                    <p className="font-display text-base sm:text-lg font-semibold text-foreground leading-snug">
                      {data.flashcards[activeCardIdx]?.front}
                    </p>
                    <span className="absolute bottom-4 text-[10px] text-primary/70 font-semibold uppercase tracking-widest">Click to Flip</span>
                  </div>

                  {/* Card Back */}
                  <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 flex flex-col items-center justify-center p-6 text-center bg-primary/10 rounded-2xl border border-primary/20">
                    <div className="text-[10px] uppercase tracking-wider text-primary/75 mb-2">Answer / Explanation</div>
                    <p className="text-sm sm:text-base text-foreground leading-relaxed">
                      {data.flashcards[activeCardIdx]?.back}
                    </p>
                    <span className="absolute bottom-4 text-[10px] text-muted-foreground/60 font-semibold uppercase tracking-widest">Click to Flip</span>
                  </div>
                </div>
              </div>

              {/* Navigation controls */}
              <div className="flex items-center gap-6">
                <button
                  onClick={handlePrevCard}
                  className="rounded-lg border border-border bg-panel px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  Previous
                </button>
                <span className="text-xs text-muted-foreground font-medium">
                  {activeCardIdx + 1} / {data.flashcards.length}
                </span>
                <button
                  onClick={handleNextCard}
                  className="rounded-lg border border-border bg-panel px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  Next
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No flashcards generated. Switch submodes or try again.</p>
          )}
        </div>
      )}

      {/* 3. Practice Q&A Submode */}
      {submode === "qa" && (
        <div className="space-y-4">
          {data.qa && data.qa.length > 0 ? (
            <div className="divide-y divide-border/40 space-y-4">
              {data.qa.map((item, idx) => {
                const isRevealed = !!revealedQaIdxs[idx];
                return (
                  <div key={idx} className="pt-4 first:pt-0 space-y-2">
                    <button
                      onClick={() => toggleQa(idx)}
                      className="w-full flex items-start justify-between gap-3 text-left font-display font-semibold text-sm sm:text-base text-foreground hover:text-primary transition-colors"
                    >
                      <span>Q{idx + 1}: {item.question}</span>
                      {isRevealed ? (
                        <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                    </button>

                    {isRevealed && (
                      <div className="rounded-xl bg-primary/5 border border-primary/10 p-4 text-sm leading-relaxed text-foreground/90 animate-in slide-in-from-top-1 duration-150">
                        <div className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Answer</div>
                        <p>{item.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No practice questions generated. Switch submodes or try again.</p>
          )}
        </div>
      )}
    </div>
  );
}
