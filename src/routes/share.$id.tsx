import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, Globe } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SummaryCard from "@/components/summary/SummaryCard";
import KeyPoints from "@/components/summary/KeyPoints";
import Keywords from "@/components/summary/Keywords";
import Metadata from "@/components/summary/Metadata";
import EmptyState from "@/components/common/EmptyState";
import Loader from "@/components/common/Loader";
import StudyModeCard from "@/components/summary/StudyModeCard";
import { fetchSummaryDetailsFn } from "@/lib/history.functions";

export const Route = createFileRoute("/share/$id")({
  component: ShareResultPage,
});

function ShareResultPage() {
  const { id } = Route.useParams();
  const [item, setItem] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const details = await fetchSummaryDetailsFn({ id });
        setItem(details);
      } catch (err) {
        console.error(err);
      } finally {
        setLoaded(true);
      }
    };
    fetchItem();
  }, [id]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="relative mx-auto w-full max-w-4xl flex-1 px-4 sm:px-6 py-8">
        <div className="absolute inset-0 hero-grid opacity-30 pointer-events-none" />

        {!loaded ? (
          <div className="min-h-[400px] flex items-center justify-center">
            <Loader />
          </div>
        ) : !item ? (
          <div className="space-y-4 text-center py-16">
            <EmptyState />
            <h2 className="text-xl font-bold mt-4">Shared Summary Not Found</h2>
            <p className="text-sm text-muted-foreground">
              This summary may have been deleted by the owner or the link is invalid.
            </p>
            <Link to="/" className="inline-flex mt-4 text-primary hover:underline font-semibold">
              Go to Nuclear AI Home
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Share Badge Banner */}
            <div className="flex items-center gap-2 rounded-xl border border-border bg-panel/60 p-3.5 backdrop-blur">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Globe className="h-4 w-4 animate-pulse" />
              </div>
              <div>
                <div className="text-xs font-semibold text-foreground">Public Shared Link</div>
                <div className="text-[10px] text-muted-foreground">
                  This is a read-only shared view of this summary
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <SummaryCard title={item.response.title} summary={item.response.summary} />

              {/* Study Mode View if active */}
              {item.input.mode === "study" && item.response.studyOutput && (
                <StudyModeCard
                  data={item.response.studyOutput}
                  submode={item.input.studySubmode || "notes"}
                />
              )}

              {/* Code Mode analysis if active */}
              {item.input.mode === "code" && item.response.complexity && (
                <div className="rounded-2xl border border-border bg-panel p-6 space-y-4">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-primary">
                    Code Logic Analysis
                  </div>
                  <h3 className="font-semibold text-lg">
                    {item.response.complexity.purposeOverview}
                  </h3>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="rounded-md bg-primary/15 text-primary text-xs font-bold px-2 py-1">
                      {item.response.complexity.language}
                    </span>
                    <span className="rounded-md bg-amber-500/15 text-amber-500 text-xs font-bold px-2 py-1">
                      Time: {item.response.complexity.timeComplexity}
                    </span>
                    <span className="rounded-md bg-emerald-500/15 text-emerald-500 text-xs font-bold px-2 py-1">
                      Space: {item.response.complexity.spaceComplexity}
                    </span>
                  </div>

                  {item.response.complexity.algorithmBreakdown?.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <div className="text-xs font-bold text-muted-foreground uppercase">
                        Algorithm Highlights
                      </div>
                      <ul className="space-y-2">
                        {item.response.complexity.algorithmBreakdown.map(
                          (algo: string, i: number) => (
                            <li key={i} className="flex gap-2 items-start text-sm">
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                              <span>{algo}</span>
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* GitHub Repo Details if active */}
              {item.input.type === "github" && item.response.repoDetails && (
                <div className="rounded-2xl border border-border bg-panel p-6 space-y-4">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-primary">
                    GitHub Repository Overview
                  </div>
                  <h3 className="font-semibold text-lg">{item.response.repoDetails.repoName}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {item.response.repoDetails.architectureOverview}
                  </p>

                  {item.response.repoDetails.keyDependencies?.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-xs font-bold text-muted-foreground uppercase">
                        Dependencies
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {item.response.repoDetails.keyDependencies.map((dep: string, i: number) => (
                          <span
                            key={i}
                            className="bg-panel border border-border rounded-lg text-xs font-medium px-2 py-1"
                          >
                            {dep}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {item.response.repoDetails.setupInstructions && (
                    <div className="space-y-1.5 pt-2">
                      <div className="text-xs font-bold text-muted-foreground uppercase">
                        Setup & Run
                      </div>
                      <pre className="p-3 bg-background border border-border rounded-xl text-xs overflow-x-auto font-mono text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {item.response.repoDetails.setupInstructions}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {item.response.keyPoints?.length > 0 && (
                <KeyPoints points={item.response.keyPoints} />
              )}

              {/* Action Items */}
              {item.response.actionItems && item.response.actionItems.length > 0 && (
                <div className="rounded-2xl border border-border bg-panel p-6">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-primary mb-3">
                    Action Items
                  </div>
                  <ul className="space-y-2">
                    {item.response.actionItems.map((ai: string, i: number) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed">
                        <span className="mt-1 h-3.5 w-3.5 shrink-0 rounded border border-border bg-panel flex items-center justify-center text-primary" />
                        <span>{ai}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Open Questions */}
              {item.response.openQuestions && item.response.openQuestions.length > 0 && (
                <div className="rounded-2xl border border-border bg-panel p-6">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-amber-500 mb-3">
                    Open Questions & Gaps
                  </div>
                  <ul className="space-y-2">
                    {item.response.openQuestions.map((oq: string, i: number) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground"
                      >
                        <span className="text-amber-500 font-bold">?</span>
                        <span>{oq}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {item.response.keywords?.length > 0 && <Keywords keywords={item.response.keywords} />}

              <Metadata
                readingTime={item.response.readingTime}
                wordCount={item.response.wordCount}
                source={item.response.source}
              />
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
