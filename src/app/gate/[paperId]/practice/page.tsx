"use client";

import { useState, useCallback } from "react";
import { use } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import GateNav from "@/components/GateNav";
import { getPaperById, type GATEPaper } from "@/lib/gate/config";
import { getPaperQuestions, getPaperRawData } from "@/lib/gate/paper-data";
import { useGateEvent } from "@/lib/tracking/useGateEvent";

type PracticeMode = "historical" | "priority" | "full-syllabus" | "subject-specific";

const MODES: { value: PracticeMode; label: string; description: string }[] = [
  { value: "historical", label: "Historical Distribution", description: "Match the marks distribution across years." },
  { value: "priority", label: "High Priority", description: "Focus on historically high-attention areas." },
  { value: "full-syllabus", label: "Full Syllabus", description: "Cover all subjects proportionally." },
  { value: "subject-specific", label: "Subject Specific", description: "Focus on a single subject." },
];

export default function PracticePage({ params }: { params: Promise<{ paperId: string }> }) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const preselectedSubject = searchParams.get("subject") || "";

  const paper = getPaperById(resolvedParams.paperId);
  const paperName = paper?.shortName || resolvedParams.paperId.toUpperCase();
  const rawData = getPaperRawData(resolvedParams.paperId);
  const SUBJECTS = rawData.map((s) => ({ id: s.id, name: s.name }));

  const [mode, setMode] = useState<PracticeMode>("historical");
  const [selectedSubject, setSelectedSubject] = useState(preselectedSubject);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  useGateEvent("practice_page_opened", { paper_id: resolvedParams.paperId });

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setGenerated(false);

    // Simulate practice paper generation
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setGenerating(false);
    setGenerated(true);
  }, [resolvedParams.paperId, mode]);

  return (
    <>
      <GateNav />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-medium tracking-tight text-foreground mb-1">
          Practice Papers
        </h1>
        <p className="text-sm text-muted mb-6">
          Generate intelligent practice papers based on historical patterns for GATE {paperName}.
        </p>

        {!generated ? (
          <div className="max-w-2xl">
            {/* Mode selection */}
            <h2 className="text-sm font-mono tracking-widest text-muted uppercase mb-3">
              Practice Mode
            </h2>
            <div className="space-y-2 mb-6">
              {MODES.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMode(m.value)}
                  className={`w-full text-left p-4 border transition-all duration-200 ${
                    mode === m.value
                      ? "border-accent bg-accent/5"
                      : "border-border hover:border-muted-light"
                  }`}
                >
                  <p className="text-sm font-medium text-foreground">{m.label}</p>
                  <p className="text-xs text-muted mt-0.5">{m.description}</p>
                </button>
              ))}
            </div>

            {/* Subject selection for subject-specific mode */}
            {mode === "subject-specific" && (
              <div className="mb-6">
                <h2 className="text-sm font-mono tracking-widest text-muted uppercase mb-3">
                  Select Subject
                </h2>
                <div className="border border-border p-1">
                  {SUBJECTS.map((subj) => (
                    <button
                      key={subj.id}
                      onClick={() => setSelectedSubject(subj.id)}
                      className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                        selectedSubject === subj.id
                          ? "bg-accent/10 text-accent"
                          : "text-foreground hover:bg-muted/5"
                      }`}
                    >
                      {subj.name}
                    </button>
                  ))}
                </div>
                {!selectedSubject && (
                  <p className="text-xs text-amber-600 mt-2">
                    Please select a subject to continue.
                  </p>
                )}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={generating || (mode === "subject-specific" && !selectedSubject)}
              className="inline-flex items-center justify-center px-6 py-3 bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating...
                </>
              ) : (
                "Generate Practice Paper"
              )}
            </button>
          </div>
        ) : (
          /* Generated paper */
          <div className="max-w-3xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-mono tracking-widest text-muted uppercase">
                Practice Paper Generated
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={handleGenerate}
                  className="px-3 py-1.5 text-xs border border-border hover:border-accent transition-colors"
                >
                  Regenerate
                </button>
              </div>
            </div>

            <div className="border border-border">
              {/* Paper header */}
              <div className="p-4 border-b border-border bg-muted/5">
                <h3 className="text-sm font-medium text-foreground">
                  GATE {paperName} Practice Paper
                </h3>
                <p className="text-xs text-muted-light mt-0.5">
                  Mode: {MODES.find((m) => m.value === mode)?.label} · 3 questions ·
                  6 marks
                </p>
              </div>

              {/* Questions */}
              <div className="divide-y divide-border">
                {[
                  { q: `Consider a circuit with resistors in series-parallel combination. Find the equivalent resistance.`, marks: 1, type: "NAT" },
                  { q: "In a network, which of the following theorems can be applied to find the current through a branch? (Select all that apply)", marks: 1, type: "MSQ" },
                  { q: "The Laplace transform of e^(-at) sin(ωt) u(t) is:", marks: 1, type: "MCQ" },
                ].map((question, i) => (
                  <div key={i} className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-mono text-muted-light">
                        Q{i + 1}.
                      </span>
                      <span className="text-xs px-1.5 py-0.5 border border-border text-muted">
                        {question.type}
                      </span>
                      <span className="text-xs text-muted-light">
                        {question.marks} mark{question.marks > 1 ? "s" : ""}
                      </span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">
                      {question.q}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-muted-light mt-4 italic">
              This is a demonstration. In production, practice papers are built
              from real PYQ data with validated answers.
            </p>
          </div>
        )}
      </main>
    </>
  );
}
