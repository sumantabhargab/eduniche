"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getPaperById, type GATEPaper } from "@/lib/gate/config";
import { getPaperRawData, getPaperQuestions, getPaperYears, type Question } from "@/lib/gate/paper-data";
import { computeTrend } from "@/lib/analytics/trends";
import { computePriority } from "@/lib/analytics/priority";
import GateNav from "@/components/GateNav";
import { useGateEvent } from "@/lib/tracking/useGateEvent";

export default function SubjectIntelligencePage({
  params,
}: {
  params: Promise<{ paperId: string; subjectId: string }>;
}) {
  const resolvedParams = use(params);
  const paperId = resolvedParams.paperId;
  const subjectId = resolvedParams.subjectId;
  const router = useRouter();

  const paper: GATEPaper | undefined = getPaperById(paperId);
  const rawDataList = getPaperRawData(paperId);
  const rawData = rawDataList.find((s) => s.id === subjectId);
  const paperQuestions = getPaperQuestions(paperId);
  const allYears = getPaperYears(paperId);

  useGateEvent("subject_selected", { paper_id: paperId, subject_id: subjectId });

  if (!paper || !rawData) {
    return (
      <>
        <GateNav />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <h1 className="text-2xl font-medium text-foreground mb-2">Subject Not Found</h1>
          <p className="text-sm text-muted mb-6">
            The subject you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link href={`/gate/${paperId}`} className="text-sm text-accent hover:text-accent-hover transition-colors">
            Back to Dashboard
          </Link>
        </main>
      </>
    );
  }

  const name: string = rawData.name;
  const totalQuestions: number = rawData.totalQuestions || 0;
  const totalMarks: number = rawData.totalMarks || 0;
  const yearlyData = rawData.yearlyData || [];
  const qt = rawData.questionTypes || {};

  // Compute analytics
  let trend: { trendSlope: number; trendDirection: string } | null = null;
  let priority: { score: number } | null = null;
  if (yearlyData.length > 0) {
    trend = computeTrend(yearlyData, allYears);
    priority = computePriority({
      yearlyOccurrences: yearlyData,
      allAvailableYears: allYears,
    });
  }

  // Peer subtopics (subjects in the same topic group)
  const peers: { id: string; name: string; totalQuestions: number; totalMarks: number }[] = rawDataList
    .filter((s) => !!s && typeof s.topic === "string" && s.topic === rawData.topic && s.id !== subjectId)
    .map((s) => ({ id: s.id, name: s.name, totalQuestions: s.totalQuestions || 0, totalMarks: s.totalMarks || 0 }))
    .sort((a, b) => b.totalMarks - a.totalMarks);

  // Questions for this subject
  const subjectQuestions = paperQuestions.filter((q: Question) => q.subjectId === subjectId);

  // Compute max marks for bar chart
  const maxYearlyMarks = yearlyData.length > 0 ? Math.max(...yearlyData.map((d) => d.marks)) : 20;

  const direction = trend?.trendDirection ?? "flat";
  const directionLabel = direction === "increasing" ? "Increasing"
    : direction === "decreasing" ? "Decreasing"
    : "Stable";

  const paperName = paper.shortName;

  return (
    <>
      <GateNav />
      <main>
        {/* Subject header */}
        <section className="pt-8 pb-6 px-4 sm:px-6 border-b border-border">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <Link
                href={`/gate/${paperId}`}
                className="text-xs text-muted hover:text-foreground transition-colors"
              >
                GATE {paperName}
              </Link>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-foreground">
                  {name}
                </h1>
                {rawData.topic && (
                  <p className="text-sm text-muted mt-1">Part of: {rawData.topic}</p>
                )}
              </div>
              <Link
                href={`/gate/${paperId}/practice?subject=${subjectId}`}
                className="inline-flex items-center justify-center px-4 py-2 bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors shrink-0"
              >
                Practice This Subject
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <div className="p-3 border border-border">
                <p className="text-xs text-muted-light mb-1">Total Questions</p>
                <p className="text-lg font-medium text-foreground">{totalQuestions}</p>
              </div>
              <div className="p-3 border border-border">
                <p className="text-xs text-muted-light mb-1">Total Marks</p>
                <p className="text-lg font-medium text-foreground">{totalMarks}</p>
              </div>
              <div className="p-3 border border-border">
                <p className="text-xs text-muted-light mb-1">Avg Marks/Year</p>
                <p className="text-lg font-medium text-foreground">
                  {allYears.length > 0 ? Math.round(totalMarks / allYears.length) : 0}
                </p>
              </div>
              <div className="p-3 border border-border">
                <p className="text-xs text-muted-light mb-1">Presence Rate</p>
                <p className="text-lg font-medium text-foreground">
                  {yearlyData.filter((d) => d.marks > 0).length}/{allYears.length}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Trend */}
        {trend && yearlyData.length > 0 && (
          <section className="py-8 px-4 sm:px-6 border-b border-border">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-sm font-mono tracking-widest text-muted uppercase mb-4">
                Marks Trend
              </h2>
              <div className="border border-border p-4">
                <div className="flex items-center gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-light">Direction</p>
                    <p className={`text-sm font-medium ${direction === "increasing" ? "text-green-600" : direction === "decreasing" ? "text-red-600" : "text-muted"}`}>
                      {directionLabel}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-light">Avg marks/year</p>
                    <p className="text-sm font-medium text-foreground">
                      {(totalMarks / Math.max(allYears.length, 1)).toFixed(1)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-light">Peak</p>
                    <p className="text-sm font-medium text-foreground">
                      {yearlyData.length > 0
                        ? `${yearlyData.reduce((a, b) => a.marks > b.marks ? a : b).year} (${Math.max(...yearlyData.map(d => d.marks))} marks)`
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-light">Slope</p>
                    <p className="text-sm font-medium text-foreground">
                      {trend.trendSlope.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Bar chart */}
                <div className="flex items-end gap-1 h-16">
                  {yearlyData.map((d) => {
                    const h = maxYearlyMarks > 0 ? Math.max(4, (d.marks / maxYearlyMarks) * 100) : 4;
                    return (
                      <div
                        key={d.year}
                        className="flex-1 bg-accent/30 hover:bg-accent/60 transition-colors min-w-[4px]"
                        style={{ height: `${h}%` }}
                        title={`${d.year}: ${d.marks} marks`}
                      />
                    );
                  })}
                </div>
                <div className="flex gap-1 mt-1">
                  {yearlyData.map((d) => (
                    <div key={d.year} className="flex-1 text-center text-[9px] text-muted-light font-mono min-w-[4px]">
                      {d.year.toString().slice(2)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Priority */}
        {priority && (
          <section className="py-8 px-4 sm:px-6 border-b border-border">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-sm font-mono tracking-widest text-muted uppercase mb-4">
                Priority Estimate
              </h2>
              <div className="border border-border p-5">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 flex items-center justify-center text-lg font-medium shrink-0 ${
                      priority.score >= 70
                        ? "bg-green-50 text-green-600 border border-green-200"
                        : priority.score >= 40
                        ? "bg-amber-50 text-amber-600 border border-amber-200"
                        : "bg-gray-50 text-gray-500 border border-gray-200"
                    }`}
                  >
                    {priority.score}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground mb-1">
                      {priority.score >= 70
                        ? "High attention area"
                        : priority.score >= 40
                        ? "Moderate attention area"
                        : "Lower attention area"}
                    </p>
                    <p className="text-xs text-muted">
                      Appeared in{" "}
                      {yearlyData.filter((d) => d.marks > 0).length} of{" "}
                      {allYears.length} years.{" "}
                      {direction === "increasing"
                        ? "Mark allocation has increased recently."
                        : direction === "decreasing"
                        ? "Mark allocation has decreased recently."
                        : "Mark allocation has remained relatively stable."}
                    </p>
                    <p className="text-xs text-muted-light mt-1 italic">
                      This is a statistical estimate based on historical data,
                      not a prediction. Limited data increases uncertainty.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Subtopic breakdown (peers) */}
        {peers.length > 0 && (
          <section className="py-8 px-4 sm:px-6 border-b border-border">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-sm font-mono tracking-widest text-muted uppercase mb-4">
                Subtopic Breakdown
              </h2>
              <div className="border border-border">
                {peers.map((sub, i) => (
                  <Link
                    key={sub.id}
                    href={`/gate/${paperId}/${sub.id}`}
                    className={`flex items-center justify-between p-3.5 hover:bg-muted/5 transition-colors ${
                      i !== peers.length - 1 ? "border-b border-border" : ""
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{sub.name}</p>
                      <p className="text-xs text-muted-light">
                        {sub.totalQuestions} questions
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono text-foreground">{sub.totalMarks}</p>
                      <p className="text-xs text-muted-light">marks</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Question types */}
        <section className="py-8 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-sm font-mono tracking-widest text-muted uppercase mb-4">
              Question Types
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { key: "mcq", label: "MCQ", desc: "Multiple Choice — single correct", count: qt.mcq || 0, marks: 0 },
                { key: "msq", label: "MSQ", desc: "Multiple Select — one or more correct", count: qt.msq || 0, marks: 0 },
                { key: "nat", label: "NAT", desc: "Numerical Answer Type", count: qt.nat || 0, marks: 0 },
              ].map((qtItem) => (
                <div key={qtItem.key} className="border border-border p-4">
                  <h3 className="text-sm font-medium text-foreground mb-1">
                    {qtItem.label}
                  </h3>
                  <p className="text-xs text-muted-light mb-2">{qtItem.desc}</p>
                  <div className="flex items-center gap-4 text-xs text-muted">
                    <span>{qtItem.count} questions</span>
                    <span>{qtItem.marks} marks</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Predicted Papers (Recent High-Frequency Years) ─── */}
        {priority && yearlyData.length > 0 && (() => {
          const predictedYears = yearlyData
            .filter((d) => d.marks >= 3)
            .sort((a, b) => b.year - a.year)
            .slice(0, 5);
          if (predictedYears.length === 0) return null;
          return (
            <section className="py-8 px-4 sm:px-6 border-t border-border">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-sm font-mono tracking-widest text-muted uppercase mb-1">
                  Predicted Papers
                </h2>
                <p className="text-xs text-muted-light mb-4">
                  Recent years where this topic carried significant marks — strong indicator for upcoming papers.
                </p>
                <div className="border border-border divide-y divide-border">
                  {predictedYears.map((py) => {
                    const yearQuestions = subjectQuestions.filter((q: Question) => q.year === py.year);
                    return (
                      <div
                        key={py.year}
                        className="flex items-center justify-between p-3.5 hover:bg-muted/5 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-mono font-medium text-foreground w-12">
                            {py.year}
                          </span>
                          <span className="text-xs text-muted">
                            {py.count} question{py.count !== 1 ? "s" : ""} · {py.marks} marks
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {yearQuestions.slice(0, 3).map((q: Question) => (
                            <Link
                              key={q.id}
                              href={`/gate/${paperId}/questions/${q.id}`}
                              className="text-xs text-accent hover:text-accent-hover transition-colors"
                            >
                              {q.type} ({q.marks}m)
                            </Link>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          );
        })()}

        {/* ─── Syllabus: Important Topics ─── */}
        {(() => {
          const subtopics = peers.length > 0
            ? peers
            : rawData
              ? [{ id: rawData.id, name: rawData.name, totalQuestions: rawData.totalQuestions, totalMarks: rawData.totalMarks }]
              : [];
          if (subtopics.length === 0) return null;
          return (
            <section className="py-8 px-4 sm:px-6 border-t border-border">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-sm font-mono tracking-widest text-muted uppercase mb-1">
                  Syllabus: Important Topics
                </h2>
                <p className="text-xs text-muted-light mb-4">
                  {peers.length > 0
                    ? "Subtopics under this subject, ranked by total marks contribution."
                    : "This subject's marks contribution across all years."}
                </p>
                <div className="border border-border divide-y divide-border">
                  {subtopics.map((sub, i) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between p-3.5 hover:bg-muted/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-muted-light w-8">
                          #{i + 1}
                        </span>
                        <span className="text-sm text-foreground">
                          {sub.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted">
                          {sub.totalQuestions} Qs
                        </span>
                        <span className="text-sm font-mono text-accent">
                          {sub.totalMarks}m
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          );
        })()}

        {/* ─── Previous Year Questions (PYQs) ─── */}
        {(() => {
          const pyqs = subjectQuestions
            .sort((a: Question, b: Question) => b.year - a.year || a.id.localeCompare(b.id))
            .slice(0, 15);
          if (pyqs.length === 0) return null;
          return (
            <section className="py-8 px-4 sm:px-6 border-t border-border">
              <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-mono tracking-widest text-muted uppercase mb-1">
                      Previous Year Questions (PYQs)
                    </h2>
                    <p className="text-xs text-muted-light">
                      Showing {pyqs.length} of {subjectQuestions.length} questions.
                    </p>
                  </div>
                  <Link
                    href={`/gate/${paperId}/questions?subject=${subjectId}`}
                    className="text-xs text-accent hover:text-accent-hover transition-colors"
                  >
                    View all →
                  </Link>
                </div>
                <div className="space-y-3">
                  {pyqs.map((q: Question) => (
                    <div
                      key={q.id}
                      className="border border-border p-4 hover:border-accent/30 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-mono text-muted-light">
                          {q.year} · {q.type} · {q.marks}m
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 border ${
                          q.difficulty === "easy"
                            ? "border-green-200 text-green-700 bg-green-50"
                            : q.difficulty === "hard"
                            ? "border-red-200 text-red-700 bg-red-50"
                            : "border-amber-200 text-amber-700 bg-amber-50"
                        }`}>
                          {q.difficulty}
                        </span>
                        {q.set && (
                          <span className="text-xs text-muted-light">
                            {q.set}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-foreground leading-relaxed line-clamp-3">
                        {q.question}
                      </p>
                      {q.options && q.options.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {q.options.map((opt, idx) => (
                            <span
                              key={idx}
                              className={`text-xs px-2 py-0.5 border ${
                                q.answer.includes(opt)
                                  ? "border-green-300 bg-green-50 text-green-700"
                                  : "border-border text-muted"
                              }`}
                            >
                              {opt}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-muted-light">
                          Answer: <span className="text-foreground font-medium">{q.answer}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        )()}
      </main>
    </>
  );
}
