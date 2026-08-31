"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import GateNav from "@/components/GateNav";
import { getPaperById } from "@/lib/gate/config";

export default function GatePlanPage({
  params,
}: {
  params: Promise<{ paperId: string }>;
}) {
  const resolvedParams = use(params);
  const paperId = resolvedParams.paperId;
  const paper = getPaperById(paperId);

  const [plan, setPlan] = useState<{
    id: string;
    title: string;
    status: string;
    totalItems: number;
    completedItems: number;
    progress: number;
    days: Record<number, any[]>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!paper || paper.processingStatus !== "available") return;

    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/gate/plans?status=active`);
        if (res.ok) {
          const data = await res.json();
          const activePlan = data.plans?.find((p: any) => p.paper_id === paperId);
          if (!cancelled) {
            setPlan(activePlan || null);
          }
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [paperId, paper]);

  const handleComplete = async (dayNumber: number, itemId?: string) => {
    try {
      const res = await fetch(`/api/gate/plans/${plan?.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dayNumber, itemId }),
      });

      if (res.ok) {
        // Refresh plan
        const data = await res.json();
        if (data.planCompleted) {
          setPlan(null);
          return;
        }
        // Reload
        const listRes = await fetch(`/api/gate/plans?status=active`);
        if (listRes.ok) {
          const listData = await listRes.json();
          const updated = listData.plans?.find((p: any) => p.paper_id === paperId);
          setPlan(updated || null);
        }
      }
    } catch {
      // ignore
    }
  };

  // No paper
  if (!paper || paper.processingStatus !== "available") {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <GateNav />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Branch Unavailable</h1>
          <p className="text-gray-400 mb-8">Study plans for this branch are not yet available.</p>
          <Link href="/gate" className="text-blue-400 hover:underline">← Back to GATE Branches</Link>
        </div>
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <GateNav />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading your study plan...</p>
        </div>
      </div>
    );
  }

  // No active plan
  if (!plan) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <GateNav />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">No Active Study Plan</h1>
          <p className="text-gray-400 mb-8">
            Complete the diagnostic to get a personalized 7-day study plan for {paper.shortName}.
          </p>
          <Link
            href={`/gate/${paperId}/diagnostic`}
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition"
          >
            Start Diagnostic
          </Link>
          <br />
          <Link href={`/gate/${paperId}`} className="text-gray-400 hover:text-white text-sm mt-4 inline-block">
            ← Back to {paper.shortName} Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const taskTypeLabel: Record<string, string> = {
    study: "📚 Study",
    practice: "✏️ Practice",
    review: "🔄 Review",
    test: "📝 Test",
  };

  const taskTypeColor: Record<string, string> = {
    study: "bg-blue-900/30 text-blue-400 border-blue-700",
    practice: "bg-green-900/30 text-green-400 border-green-700",
    review: "bg-yellow-900/30 text-yellow-400 border-yellow-700",
    test: "bg-purple-900/30 text-purple-400 border-purple-700",
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <GateNav />
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/gate/${paperId}`} className="text-gray-400 hover:text-white text-sm">
            ← {paper.shortName} Dashboard
          </Link>
          <h1 className="text-3xl font-bold mt-2">{plan.title}</h1>
          <div className="flex items-center gap-4 mt-2">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
              plan.status === "active" ? "bg-green-900/50 text-green-400" : "bg-gray-700 text-gray-400"
            }`}>
              {plan.status}
            </span>
            <span className="text-sm text-gray-400">{plan.totalItems} tasks · {plan.progress}% complete</span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-800 rounded-full h-2 mt-4">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${plan.progress}%` }}
            />
          </div>
        </div>

        {/* Days */}
        <div className="space-y-6">
          {Object.entries(plan.days)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([dayNum, tasks]: [string, any[]]) => (
              <div key={dayNum} className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Day {dayNum}</h3>
                  <span className="text-sm text-gray-400">
                    {tasks.filter((t) => t.completed).length}/{tasks.length} done
                  </span>
                </div>

                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`flex items-center gap-4 p-3 rounded-lg border ${
                        task.completed
                          ? "bg-gray-700/50 border-gray-700 opacity-60"
                          : "bg-gray-900 border-gray-700"
                      }`}
                    >
                      <button
                        onClick={() => handleComplete(Number(dayNum), task.id)}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          task.completed
                            ? "bg-green-500 border-green-500"
                            : "border-gray-500 hover:border-gray-400"
                        }`}
                      >
                        {task.completed && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm ${task.completed ? "line-through text-gray-500" : ""}`}>
                          {task.topic}
                        </p>
                        <p className="text-xs text-gray-500">{task.subject}</p>
                      </div>

                      <span className={`text-xs px-2 py-0.5 rounded border ${taskTypeColor[task.task_type] || "bg-gray-700 text-gray-400"}`}>
                        {taskTypeLabel[task.task_type] || task.task_type}
                      </span>

                      <span className="text-xs text-gray-500">{task.estimated_minutes}m</span>
                    </div>
                  ))}
                </div>

                {/* Complete day button */}
                {!tasks.every((t) => t.completed) && (
                  <button
                    onClick={() => handleComplete(Number(dayNum))}
                    className="mt-4 w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition"
                  >
                    Mark all Day {dayNum} tasks as complete
                  </button>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}