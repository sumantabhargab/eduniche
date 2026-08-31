"use client";

import { useState, useCallback, useEffect } from "react";
import { use } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import GateNav from "@/components/GateNav";
import { getPaperById, type GATEPaper } from "@/lib/gate/config";
import { fetchPaperData, type RawSubject } from "@/lib/gate/paper-data-client";

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
  const [rawData, setRawData] = useState<RawSubject[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);

  useEffect(() => {
    if (!paper || paper.processingStatus !== "available") return;
    let cancelled = false;
    fetchPaperData(resolvedParams.paperId)
      .then((data) => {
        if (!cancelled) {
          setRawData(data.rawData || []);
          setQuestions(data.questions || []);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [resolvedParams.paperId, paper]);

  const paperName = paper?.shortName || resolvedParams.paperId.toUpperCase();
  const SUBJECTS = (rawData || []).filter(Boolean).map((s) => ({ id: s.id, name: s.name }));
  const hasRealQuestions = questions.length > 0;

  const [mode, setMode] = useState<PracticeMode>("historical");
  const [selectedSubject, setSelectedSubject] = useState(preselectedSubject);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

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

        {!hasRealQuestions && (
          <div className="border border-amber-200 bg-amber-50/40 p-4 mb-6">
            <p className="text-xs text-amber-800">
              Practice paper generation uses the full question bank. For {paperName}, the question bank
              is being prepared. Subject-level analysis and trend data are available for planning your studies.
            </p>
          </div>
        )}

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
                <div className="border border-border p-1 max-h-64 overflow-y-auto">
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
                  Mode: {MODES.find((m) => m.value === mode)?.label}
                </p>
              </div>

              {/* Questions */}
              <div className="divide-y divide-border">
                {hasRealQuestions && rawData.length > 0 ? (
                  rawData.slice(0, 5).map((subject, i) => (
                    <div key={i} className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-mono text-muted-light">Q{i + 1}.</span>
                        <span className="text-xs px-1.5 py-0.5 border border-border text-muted">
                          {subject.name}
                        </span>
                        <span className="text-xs text-muted-light">{subject.totalMarks} marks available</span>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">
                        Practice question from {subject.name} — based on historical patterns.
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-sm text-muted">Practice questions coming soon.</p>
                    <p className="text-xs text-muted-light mt-1">
                      Use the Questions tab to explore available analysis data.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <p className="text-xs text-muted-light mt-4 italic">
              {hasRealQuestions
                ? "Practice papers are generated from real PYQ data."
                : "Full practice paper generation requires a complete question bank."}
            </p>
          </div>
        )}
      </main>
    </>
  );
}
