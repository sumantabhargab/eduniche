"use client";

import { use } from "react";
import Link from "next/link";
import GateNav from "@/components/GateNav";
import { getPaperById, PAPERS, type GATEPaper } from "@/lib/gate/config";
import { getPaperRawData, type Question } from "@/lib/gate/paper-data";
import { useGateEvent } from "@/lib/tracking/useGateEvent";

const STATUS_LABEL: Record<string, string> = {
  available: "Available",
  processing: "Processing",
  unavailable: "Coming Soon",
};

export default function GateDashboardClient({
  params,
}: {
  params: Promise<{ paperId: string }>;
}) {
  const resolvedParams = use(params);
  const paperId = resolvedParams.paperId;
  const paper = getPaperById(paperId);

  useGateEvent("dashboard_viewed", { paper_id: paperId });

  // Unavailable / not found state
  if (!paper) {
    return (
      <>
        <GateNav />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-medium text-foreground mb-2">Paper Not Found</h1>
            <p className="text-sm text-muted mb-6">
              The paper you&apos;re looking for doesn&apos;t exist.
            </p>
            <Link href="/gate" className="inline-block text-sm text-accent hover:text-accent-hover transition-colors">
              Back to Paper Selection
            </Link>
          </div>
        </main>
      </>
    );
  }

  if (paper.processingStatus !== "available") {
    return (
      <>
        <GateNav />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="text-center">
            <span className="inline-block text-xs font-mono px-2 py-1 border border-amber-200 text-amber-700 bg-amber-50 mb-4">
              {STATUS_LABEL[paper.processingStatus]}
            </span>
            <h1 className="text-2xl font-medium text-foreground mb-2">{paper.name}</h1>
            <p className="text-sm text-muted max-w-md mx-auto mb-6">
              We&apos;re currently processing historical papers for this branch.
              This takes time — we need to ensure every question is properly sourced and classified.
            </p>
            <p className="text-xs text-muted-light">Check back soon, or let us know you&apos;re interested.</p>
          </div>
        </main>
      </>
    );
  }

  // Get paper-specific raw data
  const rawData = getPaperRawData(paperId);
  const allSubjects = (rawData || []).filter(Boolean);
  const subjects = [...allSubjects].sort((a, b) => (b?.totalMarks || 0) - (a?.totalMarks || 0));
  const totalMarksAll = subjects.reduce((sum, s) => sum + (s?.totalMarks || 0), 0);

  // Total questions per type (handle both CSE and ECE key formats)
  const totals = (rawData || []).reduce(
    (acc, s) => {
      const qt = s.questionTypes || {};
      const mcq = qt.mcq ?? qt.MCQ ?? 0;
      const msq = qt.msq ?? qt.MSQ ?? 0;
      const nat = qt.nat ?? qt.NAT ?? 0;
      acc.mcq += mcq;
      acc.msq += msq;
      acc.nat += nat;
      return acc;
    },
    { mcq: 0, msq: 0, nat: 0 }
  );

  // Paper-specific metadata
  const paperCode = paper.code;
  const paperShortName = paper.shortName;
  const availableYears = paper.availableYears || [];
  const yearStart = availableYears.length > 0 ? Math.min(...availableYears) : 2000;
  const yearEnd = availableYears.length > 0 ? Math.max(...availableYears) : 2026;

  return (
    <>
      <GateNav />
      <main>
        {/* Paper header */}
        <section className="pt-8 pb-6 px-4 sm:px-6 border-b border-border">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-muted-light">{paperCode}</span>
                  <span className="text-xs text-muted-light">/</span>
                  <span className="text-xs text-muted">{STATUS_LABEL[paper.processingStatus]}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-foreground">
                  {paper.name}
                </h1>
                {paper.description && (
                  <p className="text-sm text-muted mt-1 max-w-xl">{paper.description}</p>
                )}
              </div>
              <Link
                href={`/gate/${paperId}/practice`}
                className="inline-flex items-center justify-center px-4 py-2 bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors"
              >
                Generate Practice
              </Link>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <div className="p-3 border border-border">
                <p className="text-xs text-muted-light mb-1">Papers Analyzed</p>
                <p className="text-lg font-medium text-foreground">{availableYears.length}</p>
              </div>
              <div className="p-3 border border-border">
                <p className="text-xs text-muted-light mb-1">Total Questions</p>
                <p className="text-lg font-medium text-foreground">
                  {subjects.reduce((s, x) => s + (x?.totalQuestions || 0), 0)}
                </p>
              </div>
              <div className="p-3 border border-border">
                <p className="text-xs text-muted-light mb-1">Subjects</p>
                <p className="text-lg font-medium text-foreground">{subjects.filter(Boolean).length}</p>
              </div>
              <div className="p-3 border border-border">
                <p className="text-xs text-muted-light mb-1">Years Covered</p>
                <p className="text-lg font-medium text-foreground">{yearStart}–{yearEnd}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Subjects grid */}
        <section className="py-10 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-sm font-mono tracking-widest text-muted uppercase mb-4">Subjects</h2>
            <p className="text-xs text-muted-light mb-6">
              Explore historical questions, topic trends, and priority estimates for each subject.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {subjects.map((subject) => {
                if (!subject) return null;
                const marksPercent = totalMarksAll > 0 ? Math.round((subject.totalMarks / totalMarksAll) * 100) : 0;
                return (
                  <Link
                    key={subject.id}
                    href={`/gate/${paperId}/${subject.id}`}
                    className="block p-4 border border-border hover:border-accent transition-all duration-200 group"
                  >
                    <h3 className="text-sm font-medium text-foreground mb-2 group-hover:text-accent transition-colors">
                      {subject.name || subject.id}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-muted-light mb-2">
                      <span>
                        {subject.totalMarks || 0} marks ({marksPercent}%)
                      </span>
                      <span>{subject.totalQuestions || 0} questions</span>
                    </div>
                    {/* Marks bar */}
                    <div className="h-1 bg-muted/10">
                      <div
                        className="h-full bg-accent/40 transition-all duration-500"
                        style={{ width: `${marksPercent}%` }}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Notable patterns */}
        <section className="pb-16 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-sm font-mono tracking-widest text-muted uppercase mb-4">
              Historically Notable Patterns
            </h2>
            <div className="border border-border p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-1">Consistent high-mark subjects</h3>
                  <p className="text-xs text-muted">
                    <strong className="text-foreground">{subjects[0]?.name}</strong> and{" "}
                    <strong className="text-foreground">{subjects[1]?.name}</strong>{" "}
                    have consistently received significant weight across most years.
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-1">Year-to-year variation</h3>
                  <p className="text-xs text-muted">
                    The relative distribution of marks across subjects shifts moderately between sessions. No single year is representative of all years.
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-1">Question type mix</h3>
                  <p className="text-xs text-muted">
                    {totals.mcq} MCQs, {totals.msq} MSQs, {totals.nat} NAT — all three types appear every year.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Data coverage note */}
        <section className="pb-16 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-sm font-mono tracking-widest text-muted uppercase mb-4">Data Coverage</h2>
            <div className="border border-border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 text-xs font-mono text-muted-light font-medium">Year</th>
                    <th className="text-left px-4 py-3 text-xs font-mono text-muted-light font-medium">Session</th>
                    <th className="text-right px-4 py-3 text-xs font-mono text-muted-light font-medium">Questions</th>
                    <th className="text-right px-4 py-3 text-xs font-mono text-muted-light font-medium">Marks</th>
                    <th className="text-center px-4 py-3 text-xs font-mono text-muted-light font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/50">
                    <td className="px-4 py-2.5 text-xs font-mono text-foreground">{yearStart}–{yearEnd}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{paperShortName}</td>
                    <td className="px-4 py-2.5 text-xs text-muted text-right">{totals.mcq + totals.msq + totals.nat}</td>
                    <td className="px-4 py-2.5 text-xs text-muted text-right">{subjects.reduce((s, x) => s + (x?.totalMarks || 0), 0)}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 border border-green-200">
                        {paper.processingStatus === "available" ? "Complete" : "Partial"}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-light mt-3">
              {availableYears.length} years of GATE {paperShortName} data analyzed. More sessions are being added progressively.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
