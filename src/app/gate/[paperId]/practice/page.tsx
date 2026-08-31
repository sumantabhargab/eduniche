"use client";

import { useState, useCallback, useEffect } from "react";
import { use } from "react";
import Link from "next/link";
import GateNav from "@/components/GateNav";
import { getPaperById, type GATEPaper } from "@/lib/gate/config";
import { fetchPaperData, type RawSubject } from "@/lib/gate/paper-data-client";
import { generateQuestionsFromSubjects, type GeneratedQuestion, type SubjectInfo } from "@/lib/gate/question-generator";
import { useAuth } from "@/lib/hooks/useAuth";

type PracticeMode = "historical" | "priority" | "full-syllabus" | "subject-specific";

const MODES: { value: PracticeMode; label: string; description: string }[] = [
  { value: "historical", label: "Historical Distribution", description: "Match the marks distribution across years." },
  { value: "priority", label: "High Priority", description: "Focus on historically high-attention areas." },
  { value: "full-syllabus", label: "Full Syllabus", description: "Cover all subjects proportionally." },
  { value: "subject-specific", label: "Subject Specific", description: "Focus on a single subject." },
];

const FREE_QUESTION_LIMIT = 5;

export default function PracticePage({ params }: { params: Promise<{ paperId: string }> }) {
  const resolvedParams = use(params);
  const paperId = resolvedParams.paperId;
  const paper = getPaperById(paperId);
  const { user } = useAuth();

  const [rawData, setRawData] = useState<RawSubject[]>([]);
  const [serverQuestions, setServerQuestions] = useState<any[]>([]);

  useEffect(() => {
    if (!paper || paper.processingStatus !== "available") return;
    let cancelled = false;
    fetchPaperData(paperId)
      .then((data) => {
        if (!cancelled) {
          setRawData(data.rawData || []);
          setServerQuestions(data.questions || []);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [paperId, paper]);

  const paperName = paper?.shortName || paperId.toUpperCase();
  const SUBJECTS = (rawData || []).filter(Boolean).map((s) => ({ id: s.id, name: s.name }));
  const hasRealQuestions = serverQuestions.length > 0;

  const [mode, setMode] = useState<PracticeMode>("historical");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [submitted, setSubmitted] = useState(false);

  // Check premium status from auth
  const isPremium = user?.isPremium ?? false;
  const questionsToShow = isPremium ? generatedQuestions : generatedQuestions.slice(0, FREE_QUESTION_LIMIT);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setGenerated(false);
    setSubmitted(false);

    // Simulate brief generation delay for UX
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Convert rawData to subjects array for the generator
    const subjects: SubjectInfo[] = SUBJECTS.map((s) => ({
      name: s.name,
      weightage: 10, // default — actual weightage available from API
      topic: s.name,
    }));

    const questions = generateQuestionsFromSubjects(paperId, subjects, 10, mode);
    setGeneratedQuestions(questions);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore({ correct: 0, total: questions.length });

    setGenerating(false);
    setGenerated(true);
  }, [paperId, mode, SUBJECTS]);

  const handleSelectAnswer = (index: number) => {
    if (showExplanation) return;
    setSelectedAnswer(index);
  };

  const handleCheckAnswer = () => {
    if (selectedAnswer === null) return;
    const q = generatedQuestions[currentQuestion];
    const isCorrect = selectedAnswer === q.answer;
    setScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total,
    }));
    setShowExplanation(true);
  };

  const handleNext = () => {
    if (currentQuestion < generatedQuestions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setSubmitted(true);
    }
  };

  // If no real questions and no markdown, show empty state
  const hasAnyData = hasRealQuestions || SUBJECTS.length > 0;

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

        {/* Show subjects overview when not generating */}
        {!generated && !generating && (
          <div className="mb-6">
            <h2 className="text-sm font-mono tracking-widest text-muted uppercase mb-3">Subjects</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {SUBJECTS.slice(0, 12).map((subj) => (
                <div key={subj.id} className="border border-border px-3 py-2 text-xs text-muted truncate">
                  {subj.name}
                </div>
              ))}
            </div>
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
                  onClick={() => { setMode(m.value); setGenerated(false); }}
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
              disabled={generating || (mode === "subject-specific" && SUBJECTS.length > 0 && !selectedSubject)}
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
                "Start Practice"
              )}
            </button>
          </div>
        ) : submitted ? (
          /* Submitted - show score */
          <div className="max-w-2xl">
            <div className="bg-card border border-border rounded-2xl p-8 text-center">
              <div className="text-5xl mb-4">📊</div>
              <h2 className="text-2xl font-bold mb-2">Practice Complete</h2>
              <p className="text-muted mb-4">GATE {paperName} — {mode === "priority" ? "High Priority" : mode === "subject-specific" ? "Subject Specific" : mode === "full-syllabus" ? "Full Syllabus" : "Historical Distribution"}</p>
              <div className="text-4xl font-mono font-bold mb-1">
                {score.correct}/{score.total}
              </div>
              <p className="text-muted text-sm mb-6">
                {Math.round((score.correct / score.total) * 100)}% correct
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleGenerate}
                  className="px-6 py-2.5 bg-foreground text-background text-sm font-medium rounded-xl hover:opacity-90 transition"
                >
                  Practice Again
                </button>
                <Link
                  href={`/gate/${paperId}`}
                  className="px-6 py-2.5 border border-border text-sm font-medium rounded-xl hover:bg-muted/5 transition"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* Interactive practice mode */
          <div className="max-w-3xl">
            {/* Header with progress */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-sm font-mono tracking-widest text-muted uppercase">
                  {hasRealQuestions ? "Real PYQ Practice" : "Practice Session"}
                </h2>
                <p className="text-xs text-muted-light mt-1">
                  {paperName} · {questionsToShow.length} questions
                  {!isPremium && ` · ${FREE_QUESTION_LIMIT} free limit`}
                </p>
              </div>
              <div className="text-sm text-muted">
                {currentQuestion + 1} / {questionsToShow.length}
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-muted/20 rounded-full h-1.5 mb-8">
              <div
                className="bg-accent h-1.5 rounded-full transition-all"
                style={{ width: `${((currentQuestion + 1) / questionsToShow.length) * 100}%` }}
              />
            </div>

            {/* Question card */}
            {currentQuestion < questionsToShow.length && (
              <div className="border border-border rounded-2xl overflow-hidden">
                {/* Question header */}
                <div className="px-6 py-4 border-b border-border bg-muted/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      questionsToShow[currentQuestion].difficulty === 'easy' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      questionsToShow[currentQuestion].difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {questionsToShow[currentQuestion].difficulty}
                    </span>
                    <span className="text-xs text-muted">
                      {questionsToShow[currentQuestion].subject}
                    </span>
                  </div>
                  <span className="text-xs text-muted">
                    +{questionsToShow[currentQuestion].weightage} marks
                  </span>
                </div>

                {/* Question body */}
                <div className="p-6">
                  <h3 className="text-base font-medium leading-relaxed mb-6">
                    {questionsToShow[currentQuestion].question}
                  </h3>

                  <div className="space-y-2.5">
                    {questionsToShow[currentQuestion].options.map((option, idx) => {
                      const optionLabel = String.fromCharCode(65 + idx);
                      let className = "w-full text-left p-4 rounded-xl border transition-all text-sm";

                      if (showExplanation) {
                        if (idx === questionsToShow[currentQuestion].answer) {
                          className += " border-green-500 bg-green-50 dark:bg-green-900/20";
                        } else if (idx === selectedAnswer && idx !== questionsToShow[currentQuestion].answer) {
                          className += " border-red-500 bg-red-50 dark:bg-red-900/20";
                        } else {
                          className += " border-border opacity-50";
                        }
                      } else {
                        className += selectedAnswer === idx
                          ? " border-accent bg-accent/5"
                          : " border-border hover:border-muted-light";
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => handleSelectAnswer(idx)}
                          disabled={showExplanation}
                          className={className}
                        >
                          <span className="font-medium mr-3 text-muted">{optionLabel}.</span>
                          {option}
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  {showExplanation && (
                    <div className="mt-4 p-4 bg-accent/5 border border-accent/20 rounded-xl">
                      <p className="text-xs font-medium text-accent mb-1">Explanation</p>
                      <p className="text-sm text-muted leading-relaxed">
                        {questionsToShow[currentQuestion].explanation}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="px-6 py-4 border-t border-border bg-muted/5 flex items-center justify-between">
                  <div className="text-sm text-muted">
                    Score: <span className="font-medium text-foreground">{score.correct}/{currentQuestion + (showExplanation ? 1 : 0)}</span>
                  </div>
                  <div className="flex gap-2">
                    {!showExplanation ? (
                      <button
                        onClick={handleCheckAnswer}
                        disabled={selectedAnswer === null}
                        className="px-5 py-2 bg-foreground text-background text-sm font-medium rounded-xl disabled:opacity-50 hover:opacity-90 transition"
                      >
                        Check Answer
                      </button>
                    ) : (
                      <button
                        onClick={handleNext}
                        className="px-5 py-2 bg-foreground text-background text-sm font-medium rounded-xl hover:opacity-90 transition"
                      >
                        {currentQuestion < questionsToShow.length - 1 ? "Next Question →" : "Finish"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Free tier notice */}
            {!isPremium && generatedQuestions.length > FREE_QUESTION_LIMIT && (
              <div className="mt-6 p-4 border border-amber-200 bg-amber-50/40 dark:bg-amber-900/10 rounded-xl">
                <p className="text-xs text-amber-800 dark:text-amber-400">
                  Showing {FREE_QUESTION_LIMIT} of {generatedQuestions.length} questions on the free tier.
                  <Link href="/pricing" className="underline ml-1 font-medium">Upgrade to Premium</Link> for unlimited practice.
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
