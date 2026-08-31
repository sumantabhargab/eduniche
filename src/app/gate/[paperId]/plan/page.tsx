"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import GateNav from "@/components/GateNav";
import { getPaperById, type GATEPaper } from "@/lib/gate/config";

type PlanItem = {
  id: string;
  day_number: number;
  subject: string;
  topic: string;
  task_type: string;
  estimated_minutes: number;
  completed: boolean;
  completed_at: string | null;
};

type Plan = {
  id: string;
  title: string;
  status: string;
  paper_id: string;
  progress: number;
  completedItems: number;
  totalItems: number;
  items: PlanItem[];
};

export default function PlanPage({
  params,
}: {
  params: Promise<{ paperId: string }>;
}) {
  const resolvedParams = use(params);
  const paperId = resolvedParams.paperId;
  const paper = getPaperById(paperId);
  const paperName = paper?.shortName || paperId.toUpperCase();

  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);

  // Check for planId in URL search params
  const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const planIdFromUrl = urlParams?.get("id");

  useEffect(() => {
    let cancelled = false;

    async function loadPlan() {
      try {
        // If a planId was passed from diagnostic, fetch that specific plan
        let planId = planIdFromUrl;

        // Otherwise fetch active plan for this paper
        if (!planId) {
          const res = await fetch(`/api/gate/plans?status=active`);
          if (res.ok) {
            const data = await res.json();
            const activePlan = data.plans?.find((p: any) => p.paper_id === paperId);
            planId = activePlan?.id;
          }
        }

        if (!planId || cancelled) {
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/gate/plans?status=all`);
        if (res.ok) {
          const data = await res.json();
          const found = data.plans?.find((p: any) => p.id === planId);
          if (found) {
            setPlan(found);
          }
        }
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPlan();
    return () => { cancelled = true; };
  }, [paperId, planIdFromUrl]);

  const markComplete = async (itemId: string, dayNumber: number) => {
    setCompleting(itemId);
    try {
      const res = await fetch(`/api/gate/plans/${plan?.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, dayNumber }),
      });

      if (res.ok) {
        const data = await res.json();
        // Update local state
        setPlan((prev) => {
          if (!prev) return prev;
          const updatedItems = prev.items.map((item) =>
            item.id === itemId ? { ...item, completed: true, completed_at: new Date().toISOString() } : item
          );
          const completedCount = updatedItems.filter((i) => i.completed).length;
          return {
            ...prev,
            items: updatedItems,
            completedItems: data.completedItems ?? completedCount,
            totalItems: data.totalItems ?? updatedItems.length,
            progress: data.totalItems > 0 ? Math.round(((data.completedItems ?? completedCount) / data.totalItems) * 100) : 0,
            status: data.planCompleted ? "completed" : prev.status,
          };
        });
      }
    } catch {
      // silently fail
    } finally {
      setCompleting(null);
    }
  };

  const taskTypeEmoji = (type: string) => {
    switch (type) {
      case "study": return "📖";
      case "practice": return "✏️";
      case "test": return "📝";
      case "review": return "🔄";
      default: return "📌";
    }
  };

  const taskTypeLabel = (type: string) => {
    switch (type) {
      case "study": return "Study";
      case "practice": return "Practice";
      case "test": return "Mock Test";
      case "review": return "Review";
      default: return type;
    }
  };

  if (!paper) {
    return (
      <>
        <GateNav />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-medium text-foreground mb-2">Paper Not Found</h1>
            <p className="text-sm text-muted mb-6">The paper you&apos;re looking for doesn&apos;t exist.</p>
            <Link href="/gate" className="text-sm text-accent hover:text-accent-hover transition-colors">
              Back to Paper Selection
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <GateNav />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-medium tracking-tight text-foreground mb-1">
          Study Plan
        </h1>
        <p className="text-sm text-muted mb-6">
          GATE {paperName} — {plan?.title || "Your personalized 7-day plan"}
        </p>

        {loading && (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-foreground border-t-transparent mb-4" />
            <p className="text-sm text-muted">Loading your study plan...</p>
          </div>
        )}

        {!loading && !plan && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📋</div>
            <h2 className="text-xl font-medium mb-2">No Active Study Plan</h2>
            <p className="text-sm text-muted mb-6 max-w-md mx-auto">
              Take the diagnostic test to get a personalized 7-day study plan based on your performance.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={`/gate/${paperId}/diagnostic`}
                className="inline-flex items-center justify-center px-6 py-3 bg-foreground text-background text-sm font-medium rounded-xl hover:opacity-90 transition-all"
              >
                Take Diagnostic Test →
              </Link>
              <Link
                href={`/gate/${paperId}`}
                className="inline-flex items-center justify-center px-6 py-2.5 text-sm border border-border rounded-xl hover:bg-muted/5 transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        )}

        {plan && (
          <div>
            {/* Progress overview */}
            <div className="bg-card border border-border rounded-2xl p-6 mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-medium">Overall Progress</h2>
                <span className="text-sm text-muted">
                  {plan.completedItems}/{plan.totalItems} tasks
                </span>
              </div>
              <div className="w-full h-2 bg-muted/20 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-500"
                  style={{ width: `${plan.progress}%` }}
                />
              </div>
              <p className="text-xs text-muted">
                {plan.status === "completed"
                  ? "🎉 Plan completed! Great work."
                  : `${plan.progress}% complete — keep going!`}
              </p>
            </div>

            {/* Plan items grouped by day */}
            <div className="space-y-6">
              {(() => {
                const days: Record<number, PlanItem[]> = {};
                plan.items.forEach((item) => {
                  if (!days[item.day_number]) days[item.day_number] = [];
                  days[item.day_number].push(item);
                });

                return Object.keys(days).map((dayNum) => {
                  const dayItems = days[Number(dayNum)];
                  const dayComplete = dayItems.every((i) => i.completed);

                  return (
                    <div key={dayNum} className="border border-border rounded-2xl overflow-hidden">
                      {/* Day header */}
                      <div className={`px-6 py-3 border-b border-border flex items-center justify-between ${
                        dayComplete ? "bg-green-50/50 dark:bg-green-900/10" : "bg-muted/5"
                      }`}>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            Day {dayNum}
                          </span>
                          {dayComplete && (
                            <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                              Complete ✓
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted">
                          {dayItems.filter((i) => i.completed).length}/{dayItems.length} done
                        </span>
                      </div>

                      {/* Day items */}
                      <div className="divide-y divide-border/50">
                        {dayItems.map((item) => {
                          const isCompleting = completing === item.id;
                          return (
                            <div
                              key={item.id}
                              className={`px-6 py-4 flex items-start gap-4 ${
                                item.completed ? "bg-green-50/30 dark:bg-green-900/5" : ""
                              }`}
                            >
                              <span className="text-lg mt-0.5">{taskTypeEmoji(item.task_type)}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-medium">{item.topic}</span>
                                  <span className="text-xs text-muted">·</span>
                                  <span className="text-xs text-muted">{item.subject}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-xs text-muted">
                                    {taskTypeLabel(item.task_type)}
                                  </span>
                                  <span className="text-xs text-muted">
                                    {item.estimated_minutes} min
                                  </span>
                                </div>
                              </div>
                              {!item.completed && (
                                <button
                                  onClick={() => markComplete(item.id, item.day_number)}
                                  disabled={isCompleting}
                                  className="shrink-0 px-4 py-1.5 text-xs border border-border rounded-lg hover:border-accent hover:text-accent transition-colors disabled:opacity-50"
                                >
                                  {isCompleting ? "..." : "Mark Done"}
                                </button>
                              )}
                              {item.completed && (
                                <span className="shrink-0 text-xs text-green-600 bg-green-100 px-3 py-1.5 rounded-lg">
                                  ✓ Done
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={`/gate/${paperId}/practice`}
                className="inline-flex items-center justify-center px-6 py-3 bg-foreground text-background text-sm font-medium rounded-xl hover:opacity-90 transition-all"
              >
                Start Practice →
              </Link>
              <Link
                href={`/gate/${paperId}`}
                className="inline-flex items-center justify-center px-6 py-2.5 text-sm border border-border rounded-xl hover:bg-muted/5 transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
