"use client";

import { useState, use, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import GateNav from "@/components/GateNav";
import { getPaperById, type GATEPaper } from "@/lib/gate/config";

type AnswerMap = Record<string, string>;

const DIAGNOSTIC_API = "/api/gate/diagnostic/start";
const SUBMIT_API = "/api/gate/diagnostic/submit";

export default function GateDiagnosticPage({
  params,
}: {
  params: Promise<{ paperId: string }>;
}) {
  const resolvedParams = use(params);
  const paperId = resolvedParams.paperId;
  const searchParams = useSearchParams();

  const paper = getPaperById(paperId);

  // Phase 1: Loading questions
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Array<{
    id: string;
    subject: string;
    topic: string;
    weightage: number;
    question: string;
    options: string[];
    answer: string;
    explanation: string;
    difficulty: "easy" | "medium" | "hard";
  }>>([]);
  const [diagnosticId, setDiagnosticId] = useState<string | null>(null);

  // Phase 2: Answering questions
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Phase 3: Results
  const [results, setResults] = useState<{
    totalScore: number;
    correctAnswers: number;
    totalQuestions: number;
    topicScores: Record<string, { correct: number; total: number; accuracy: number }>;
    planId: string | null;
    error?: string;
  } | null>(null);

  // Load questions on mount
  useEffect(() => {
    if (!paper || paper.processingStatus !== "available") return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(DIAGNOSTIC_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paperId }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setQuestions([]);
          setResults({
            totalScore: 0,
            correctAnswers: 0,
            totalQuestions: 0,
            topicScores: {},
            planId: null,
            error: err.error || "Failed to load diagnostic.",
          });
          return;
        }

        const data = await res.json();
        if (!cancelled) {
          setQuestions(data.questions || []);
          setDiagnosticId(data.diagnosticId);
        }
      } catch {
        if (!cancelled) {
          setQuestions([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [paperId, paper]);

  const handleSelect = (questionId: string, optionIndex: number) => {
    const optionLabels = ["A", "B", "C", "D"];
    setAnswers((prev) => ({ ...prev, [questionId]: optionLabels[optionIndex] }));
  };

  const handleSubmit = async () => {
    if (!diagnosticId) return;

    setSubmitting(true);
    try {
      const res = await fetch(SUBMIT_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diagnosticId,
          paperId,
          answers,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setResults(data);
      } else {
        setResults({
          totalScore: 0,
          correctAnswers: 0,
          totalQuestions: data.totalQuestions || questions.length,
          topicScores: data.topicScores || {},
          planId: data.plan?.id || null,
          error: data.error || "Failed to submit diagnostic.",
        });
      }
    } catch {
      setResults({
        totalScore: 0,
        correctAnswers: 0,
        totalQuestions: questions.length,
        topicScores: {},
        planId: null,
        error: "Network error.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questions.length;
  const progress = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  // --- Error / No paper ---
  if (!paper || paper.processingStatus !== "available") {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <GateNav />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Branch Unavailable</h1>
          <p className="text-gray-400 mb-8">This branch is not yet available for diagnostic.</p>
          <Link href="/gate" className="text-blue-400 hover:underline">← Back to GATE Branches</Link>
        </div>
      </div>
    );
  }

  if (results) {
    // --- Results view ---
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <GateNav />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Diagnostic Results</h1>
            <p className="text-gray-400">{paper.shortName} — {paper.name}</p>
          </div>

          {results.error && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 rounded-lg p-4 mb-6">
              {results.error}
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-400">{results.totalScore}%</div>
              <div className="text-sm text-gray-400 mt-1">Overall Score</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-green-400">{results.correctAnswers}/{results.totalQuestions}</div>
              <div className="text-sm text-gray-400 mt-1">Correct</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-purple-400">{Object.keys(results.topicScores).length}</div>
              <div className="text-sm text-gray-400 mt-1">Topics Assessed</div>
            </div>
          </div>

          {/* Topic breakdown */}
          {Object.keys(results.topicScores).length > 0 && (
            <div className="bg-gray-800 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Topic Performance</h2>
              <div className="space-y-3">
                {Object.entries(results.topicScores)
                  .sort((a, b) => a[1].accuracy - b[1].accuracy)
                  .map(([subject, scores]) => (
                    <div key={subject}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">{subject}</span>
                        <span className="text-sm text-gray-400">{scores.accuracy}% ({scores.correct}/{scores.total})</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${scores.accuracy >= 70 ? 'bg-green-500' : scores.accuracy >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${scores.accuracy}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Next actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            {results.planId && (
              <Link
                href={`/gate/${paperId}/plan`}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-3 px-6 rounded-lg font-semibold transition"
              >
                View Your 7-Day Study Plan
              </Link>
            )}
            <Link
              href={`/gate/${paperId}`}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-center py-3 px-6 rounded-lg font-semibold transition"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --- Loading ---
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <GateNav />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading diagnostic questions...</p>
        </div>
      </div>
    );
  }

  // --- Empty questions ---
  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <GateNav />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">No Questions Available</h1>
          <p className="text-gray-400 mb-8">Diagnostic questions for this branch are being prepared.</p>
          <Link href={`/gate/${paperId}`} className="text-blue-400 hover:underline">← Back</Link>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const optionLabels = ["A", "B", "C", "D"];
  const selectedAnswer = answers[currentQ.id];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <GateNav />
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href={`/gate/${paperId}`} className="text-gray-400 hover:text-white text-sm">
            ← {paper.shortName} Diagnostic
          </Link>
          <h1 className="text-2xl font-bold mt-2">GATE {paper.shortName} Diagnostic</h1>
          <p className="text-gray-400 text-sm mt-1">
            Question {currentIndex + 1} of {totalQuestions}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-800 rounded-full h-2 mb-8">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Question */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
              currentQ.difficulty === 'easy' ? 'bg-green-900/50 text-green-400' :
              currentQ.difficulty === 'medium' ? 'bg-yellow-900/50 text-yellow-400' :
              'bg-red-900/50 text-red-400'
            }`}>
              {currentQ.difficulty}
            </span>
            <span className="text-xs text-gray-400">{currentQ.subject}</span>
          </div>

          <h2 className="text-lg font-medium mb-6">{currentQ.question}</h2>

          <div className="space-y-3">
            {currentQ.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(currentQ.id, idx)}
                className={`w-full text-left p-4 rounded-lg border-2 transition ${
                  selectedAnswer === optionLabels[idx]
                    ? "border-blue-500 bg-blue-900/30"
                    : "border-gray-700 hover:border-gray-600 bg-gray-800"
                }`}
              >
                <span className="font-medium mr-3">{optionLabels[idx]}.</span>
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="px-4 py-2 bg-gray-800 rounded-lg disabled:opacity-50 hover:bg-gray-700 transition"
          >
            ← Previous
          </button>

          <span className="text-sm text-gray-400">
            {answeredCount}/{totalQuestions} answered
          </span>

          {currentIndex < totalQuestions - 1 ? (
            <button
              onClick={() => setCurrentIndex(currentIndex + 1)}
              disabled={!selectedAnswer}
              className="px-4 py-2 bg-blue-600 rounded-lg disabled:opacity-50 hover:bg-blue-700 transition"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || answeredCount < totalQuestions}
              className="px-4 py-2 bg-green-600 rounded-lg disabled:opacity-50 hover:bg-green-700 transition"
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}