"use client";

import { useState, use, useEffect, useCallback } from "react";
import Link from "next/link";
import GateNav from "@/components/GateNav";
import { getPaperById, type GATEPaper } from "@/lib/gate/config";

type Question = {
  id: string;
  subject: string;
  topic: string;
  weightage: number;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
};

type DiagnosticState = "loading" | "active" | "submitting" | "complete";

export default function DiagnosticPage({
  params,
}: {
  params: Promise<{ paperId: string }>;
}) {
  const resolvedParams = use(params);
  const paperId = resolvedParams.paperId;
  const paper = getPaperById(paperId);
  const paperName = paper?.shortName || paperId.toUpperCase();

  const [state, setState] = useState<DiagnosticState>("loading");
  const [diagnosticId, setDiagnosticId] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<{
    totalScore: number;
    correctAnswers: number;
    totalQuestions: number;
    topicScores: Record<string, { correct: number; total: number; accuracy: number }>;
    planId: string | null;
  } | null>(null);

  // Start diagnostic
  useEffect(() => {
    if (!paper || paper.processingStatus !== "available") return;
    let cancelled = false;

    async function start() {
      try {
        const res = await fetch("/api/gate/diagnostic/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paperId }),
        });

        if (!res.ok) {
          console.error("Failed to start diagnostic:", res.status);
          setState("complete");
          return;
        }

        const data = await res.json();
        if (!cancelled) {
          setDiagnosticId(data.diagnosticId);
          setQuestions(data.questions || []);
          setState("active");
        }
      } catch {
        if (!cancelled) setState("complete");
      }
    }

    start();
    return () => { cancelled = true; };
  }, [paperId, paper]);

  const handleSelectAnswer = useCallback((optionLabel: string) => {
    if (state !== "active") return;
    const q = questions[currentIndex];
    setAnswers((prev) => ({ ...prev, [q.id]: optionLabel }));
  }, [state, questions, currentIndex]);

  const handleSubmit = useCallback(async () => {
    if (state !== "active") return;
    setState("submitting");

    try {
      const res = await fetch("/api/gate/diagnostic/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ diagnosticId, paperId, answers }),
      });

      if (!res.ok) {
        console.error("Submit failed:", res.status);
        setState("active");
        return;
      }

      const data = await res.json();
      setResults(data);
      setState("complete");
    } catch {
      setState("active");
    }
  }, [state, diagnosticId, paperId, answers]);

  const handleRetry = () => {
    setState("loading");
    setDiagnosticId("");
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers({});
    setResults(null);
  };

  if (!paper || paper.processingStatus !== "available") {
    return (
      <>
        <GateNav />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-medium text-foreground mb-2">Paper Not Available</h1>
            <p className="text-sm text-muted mb-6">
              Diagnostic tests are not yet available for this branch.
            </p>
            <Link href={`/gate`} className="text-sm text-accent hover:text-accent-hover transition-colors">
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
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-medium tracking-tight text-foreground mb-1">
          Diagnostic Test
        </h1>
        <p className="text-sm text-muted mb-6">
          GATE {paperName} — 10 questions across subjects to identify your strengths and weaknesses.
        </p>

        {/* Loading */}
        {state === "loading" && (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-foreground border-t-transparent mb-4" />
            <p className="text-sm text-muted">Preparing your diagnostic test...</p>
          </div>
        )}

        {/* Active diagnostic */}
        {state === "active" && questions.length > 0 && (
          <div>
            {/* Progress */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-muted uppercase tracking-wider">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded ${
                questions[currentIndex].difficulty === 'easy' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                questions[currentIndex].difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {questions[currentIndex].difficulty}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-muted/20 rounded-full h-1.5 mb-8">
              <div
                className="bg-accent h-1.5 rounded-full transition-all"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>

            {/* Question card */}
            <div className="border border-border rounded-2xl overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-border bg-muted/5">
                <span className="text-xs text-muted">
                  {questions[currentIndex].subject} · {questions[currentIndex].topic}
                </span>
              </div>
              <div className="p-6">
                <h3 className="text-base font-medium leading-relaxed mb-6">
                  {questions[currentIndex].question}
                </h3>

                <div className="space-y-2.5">
                  {questions[currentIndex].options.map((option, idx) => {
                    const label = String.fromCharCode(65 + idx);
                    const selected = answers[questions[currentIndex].id];
                    const isSelected = selected === label;

                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectAnswer(label)}
                        className={`w-full text-left p-4 rounded-xl border transition-all text-sm ${
                          isSelected
                            ? "border-accent bg-accent/5"
                            : "border-border hover:border-muted-light"
                        }`}
                      >
                        <span className="font-medium mr-3 text-muted">{label}.</span>
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
                className="px-5 py-2.5 text-sm border border-border rounded-xl hover:bg-muted/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>

              <span className="text-xs text-muted">
                {Object.keys(answers).length} of {questions.length} answered
              </span>

              {currentIndex < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentIndex((i) => i + 1)}
                  className="px-5 py-2.5 text-sm bg-foreground text-background rounded-xl hover:bg-foreground/90 transition-colors"
                >
                  Next →
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={Object.keys(answers).length < questions.length}
                  className="px-5 py-2.5 text-sm bg-accent text-background rounded-xl hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Submit Diagnostic
                </button>
              )}
            </div>
          </div>
        )}

        {/* Submitting */}
        {state === "submitting" && (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-foreground border-t-transparent mb-4" />
            <p className="text-sm text-muted">Analyzing your performance...</p>
          </div>
        )}

        {/* Results */}
        {state === "complete" && results && (
          <div>
            {/* Score card */}
            <div className="bg-card border border-border rounded-2xl p-8 text-center mb-8">
              <div className="text-5xl mb-4">📊</div>
              <h2 className="text-2xl font-bold mb-2">Diagnostic Complete</h2>
              <p className="text-muted text-sm mb-4">
                GATE {paperName} — {results.totalQuestions} questions
              </p>
              <div className="text-4xl font-mono font-bold mb-1">
                {results.correctAnswers}/{results.totalQuestions}
              </div>
              <p className="text-muted text-sm mb-2">
                {results.totalScore}% overall
              </p>

              {/* Topic breakdown */}
              {Object.keys(results.topicScores).length > 0 && (
                <div className="mt-6 text-left">
                  <h3 className="text-xs font-mono tracking-widest text-muted uppercase mb-3">
                    Performance by Subject
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(results.topicScores)
                      .sort(([, a], [, b]) => a.accuracy - b.accuracy)
                      .map(([subject, scores]) => (
                        <div
                          key={subject}
                          className="flex items-center gap-3 p-3 border border-border rounded-xl"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{subject}</p>
                            <p className="text-xs text-muted">
                              {scores.correct}/{scores.total} correct
                            </p>
                          </div>
                          <div className="w-24">
                            <div className="w-full h-1.5 bg-muted/20 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  scores.accuracy >= 70 ? "bg-green-500" :
                                  scores.accuracy >= 40 ? "bg-yellow-500" : "bg-red-500"
                                }`}
                                style={{ width: `${scores.accuracy}%` }}
                              />
                            </div>
                          </div>
                          <span className={`text-xs font-mono w-10 text-right ${
                            scores.accuracy >= 70 ? "text-green-600" :
                            scores.accuracy >= 40 ? "text-yellow-600" : "text-red-600"
                          }`}>
                            {scores.accuracy}%
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Plan created */}
            {results.planId && (
              <div className="bg-accent/5 border border-accent/20 rounded-2xl p-6 text-center mb-8">
                <div className="text-3xl mb-2">📋</div>
                <h3 className="text-lg font-medium mb-1">Your 7-Day Study Plan is Ready</h3>
                <p className="text-sm text-muted mb-4">
                  We've created a personalized plan based on your diagnostic results.
                </p>
                <Link
                  href={`/gate/${paperId}/plan?id=${results.planId}`}
                  className="inline-flex items-center px-6 py-3 bg-foreground text-background text-sm font-medium rounded-xl hover:opacity-90 transition-all"
                >
                  View Study Plan →
                </Link>
              </div>
            )}

            {!results.planId && (
              <div className="text-center mb-8">
                <Link
                  href={`/gate/${paperId}/plan`}
                  className="inline-flex items-center px-6 py-3 bg-foreground text-background text-sm font-medium rounded-xl hover:opacity-90 transition-all"
                >
                  View Study Plan →
                </Link>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleRetry}
                className="px-6 py-2.5 text-sm border border-border rounded-xl hover:bg-muted/5 transition-colors"
              >
                Retake Diagnostic
              </button>
              <Link
                href={`/gate/${paperId}/practice`}
                className="px-6 py-2.5 text-sm bg-foreground text-background rounded-xl hover:opacity-90 transition-colors text-center"
              >
                Start Practice
              </Link>
              <Link
                href={`/gate/${paperId}`}
                className="px-6 py-2.5 text-sm border border-border rounded-xl hover:bg-muted/5 transition-colors text-center"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        )}

        {/* Fallback for no results (no data) */}
        {state === "complete" && !results && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">😔</div>
            <h2 className="text-xl font-medium mb-2">Not Enough Data</h2>
            <p className="text-sm text-muted mb-6">
              We couldn&apos;t generate enough questions for this branch yet. Try another branch or check back later.
            </p>
            <Link
              href={`/gate`}
              className="inline-flex items-center px-6 py-3 bg-foreground text-background text-sm font-medium rounded-xl hover:opacity-90 transition-all"
            >
              Browse Branches
            </Link>
          </div>
        )}
      </main>
    </>
  );
}
