/**
 * Mock Test Taking — /mock-tests/[id]/take
 *
 * Full mock test experience: questions, timer, navigation, submit.
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Send,
  Flag,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Bookmark,
  Menu,
  X,
} from "@/components/pyq/PYQIcons";

type Question = {
  id: string;
  questionNumber: number;
  questionText: string;
  questionHtml?: string;
  options: Array<{ label: string; text: string }>;
  correctAnswer: string;
  subjectName: string;
  topicName: string;
  marks: number;
  negativeMarks: number;
  questionType: string;
};

type TestMeta = {
  id: string;
  title: string;
  branchCode: string;
  questionCount: number;
  maximumMarks: number;
  durationMinutes: number;
};

type AnswerMap = Record<string, string>;

export default function MockTestTakePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [test, setTest] = useState<TestMeta | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionId] = useState(() => `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  const timerRef = useRef<any>(undefined);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    Promise.all([
      fetch(`/api/mock-tests/${params.id}`).then((r) => r.json()),
      fetch(`/api/mock-tests/${params.id}/questions`).then((r) => r.json()),
    ]).then(([testData, qData]) => {
      if (testData.test) setTest(testData.test);
      if (qData.questions) {
        setQuestions(qData.questions);
        setTimeLeft((testData.test?.durationMinutes || 180) * 60);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [mounted, params.id]);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0 || submitted) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [timeLeft, submitted]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleSelectAnswer = useCallback((questionIndex: number, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: answer }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (submitted) return;
    setSubmitted(true);
    clearInterval(timerRef.current);

    // Calculate score
    let score = 0;
    let correctCount = 0;
    let wrongCount = 0;

    const detailedResults = questions.map((q, i) => {
      const userAnswer = answers[i];
      const isCorrect = userAnswer === q.correctAnswer;
      const isUnattempted = !userAnswer;
      if (isCorrect) {
        score += q.marks;
        correctCount++;
      } else if (!isUnattempted) {
        score -= q.negativeMarks;
        wrongCount++;
      }
      return {
        questionIndex: i,
        question: q,
        userAnswer: userAnswer || null,
        isCorrect,
        isUnattempted,
        marksObtained: isCorrect ? q.marks : isUnattempted ? 0 : -q.negativeMarks,
      };
    });

    // Save to backend
    try {
      const res = await fetch(`/api/mock-tests/${params.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          timeSpent: (test?.durationMinutes || 180) * 60 - timeLeft,
          sessionId,
        }),
      });
      const data = await res.json();
      setResult({
        score: Math.max(0, score),
        totalMarks: test?.maximumMarks || 0,
        correctCount,
        wrongCount,
        unattemptedCount: questions.length - correctCount - wrongCount,
        details: detailedResults,
        rank: data.rank,
        percentile: data.percentile,
      });
    } catch {
      setResult({
        score: Math.max(0, score),
        totalMarks: test?.maximumMarks || 0,
        correctCount,
        wrongCount,
        unattemptedCount: questions.length - correctCount - wrongCount,
        details: detailedResults,
      });
    }
  }, [submitted, answers, questions, params.id, sessionId, test, timeLeft]);

  const toggleFlag = (index: number) => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  if (!mounted || loading) {
    return (
      <main className="min-h-screen bg-background">
        <Nav />
        <div className="pt-24 flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
        <Footer />
      </main>
    );
  }

  // Result screen
  if (submitted && result) {
    const percentage = result.totalMarks > 0 ? (result.score / result.totalMarks * 100) : 0;

    return (
      <main className="min-h-screen bg-background">
        <Nav />

        <section className="pt-32 pb-16 px-6">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center mb-12"
            >
              <div className="text-6xl mb-4">{percentage >= 60 ? "🎉" : percentage >= 40 ? "👍" : "💪"}</div>
              <h1 className="font-serif text-3xl md:text-4xl mb-2">Test Complete!</h1>
              <p className="text-muted">{test?.title}</p>
            </motion.div>

            {/* Score card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card border border-border rounded-2xl p-8 mb-8 text-center"
            >
              <div className={`text-5xl font-bold font-mono mb-2 ${percentage >= 60 ? "text-green-600" : percentage >= 40 ? "text-amber-600" : "text-red-600"}`}>
                {result.score}/{result.totalMarks}
              </div>
              <div className="text-sm text-muted mb-6">{percentage.toFixed(1)}% Score</div>

              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-green-500/10 rounded-xl">
                  <div className="text-lg font-bold text-green-600">{result.correctCount}</div>
                  <div className="text-xs text-muted">Correct</div>
                </div>
                <div className="p-4 bg-red-500/10 rounded-xl">
                  <div className="text-lg font-bold text-red-600">{result.wrongCount}</div>
                  <div className="text-xs text-muted">Wrong</div>
                </div>
                <div className="p-4 bg-muted/10 rounded-xl">
                  <div className="text-lg font-bold text-muted">{result.unattemptedCount}</div>
                  <div className="text-xs text-muted">Unattempted</div>
                </div>
                <div className="p-4 bg-accent/10 rounded-xl">
                  <div className="text-lg font-bold text-accent">{questions.length}</div>
                  <div className="text-xs text-muted">Total</div>
                </div>
              </div>

              {result.percentile && (
                <div className="p-4 bg-accent/5 border border-accent/10 rounded-xl mb-6">
                  <div className="text-sm text-muted mb-1">Your Percentile</div>
                  <div className="text-2xl font-bold text-accent">{result.percentile.toFixed(1)}th</div>
                  {result.rank && <div className="text-xs text-muted mt-1">Rank: #{result.rank}</div>}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => router.push(`/mock-tests/${params.id}/review`)}
                  className="flex-1 py-3 bg-foreground text-background rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Review Answers
                </button>
                <button
                  onClick={() => router.push("/mock-tests")}
                  className="flex-1 py-3 border border-border rounded-xl text-sm font-medium hover:border-foreground/40 transition-colors"
                >
                  All Mock Tests
                </button>
              </div>
            </motion.div>

            {/* Question-wise breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card border border-border rounded-2xl p-6"
            >
              <h3 className="font-semibold text-sm mb-4">Question-wise Breakdown</h3>
              <div className="grid grid-cols-10 sm:grid-cols-13 md:grid-cols-15 gap-1.5">
                {result.details.map((r: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => router.push(`/mock-tests/${params.id}/review?q=${i}`)}
                    className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-colors ${
                      r.isCorrect
                        ? "bg-green-500/20 text-green-600"
                        : r.isUnattempted
                        ? "bg-muted/10 text-muted"
                        : "bg-red-500/20 text-red-600"
                    }`}
                    title={`Q${r.question.questionNumber}: ${r.isCorrect ? "Correct" : r.isUnattempted ? "Unattempted" : "Wrong"}`}
                  >
                    {r.question.questionNumber}
                  </button>
                ))}
              </div>
              <div className="flex gap-4 mt-4 text-xs text-muted">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-500/20" /> Correct</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500/20" /> Wrong</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-muted/10" /> Unattempted</span>
              </div>
            </motion.div>
          </div>
        </section>

        <Footer />
      </main>
    );
  }

  // Test taking interface
  const current = questions[currentIndex];
  if (!current) return null;

  const answeredCount = Object.keys(answers).filter((k) => answers[k]).length;

  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (confirm("Are you sure you want to quit? Your progress will be lost.")) {
                  router.push("/mock-tests");
                }
              }}
              className="text-xs text-muted hover:text-foreground transition-colors"
            >
              ← Exit
            </button>
            <span className="text-sm font-medium truncate max-w-[200px]">{test?.title}</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted hidden sm:inline">Answered:</span>
              <span className="text-sm font-mono font-medium">{answeredCount}/{questions.length}</span>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${timeLeft < 300 ? "bg-red-500/10 text-red-600 animate-pulse" : "bg-foreground/5"}`}>
              <Clock className="w-4 h-4" />
              <span className="text-sm font-mono font-medium">{formatTime(timeLeft)}</span>
            </div>
            <button
              onClick={handleSubmit}
              className="hidden sm:flex items-center gap-2 px-5 py-2 bg-foreground text-background rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Send className="w-4 h-4" />
              Submit
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 pt-14">
        {/* Question area */}
        <div className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-6">
          {/* Question header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted font-mono">
                Q{current.questionNumber} of {questions.length}
              </span>
              <span className="text-xs px-2 py-1 bg-foreground/5 rounded-md text-muted">
                {current.subjectName}
              </span>
              <span className="text-xs px-2 py-1 bg-accent/10 text-accent rounded-md">
                {current.marks} marks
              </span>
            </div>
            <button
              onClick={() => toggleFlag(currentIndex)}
              className={`p-2 rounded-lg transition-colors ${
                flagged.has(currentIndex)
                  ? "text-amber-600 bg-amber-500/10"
                  : "text-muted hover:text-foreground"
              }`}
              title={flagged.has(currentIndex) ? "Unflag" : "Flag for review"}
            >
              <Flag className="w-4 h-4" />
            </button>
          </div>

          {/* Question text */}
          <div className="mb-8">
            <div className="prose prose-sm max-w-none text-foreground leading-relaxed">
              {current.questionHtml ? (
                <div dangerouslySetInnerHTML={{ __html: current.questionHtml }} />
              ) : (
                <p>{current.questionText}</p>
              )}
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3 mb-8">
            {current.options.map((option) => {
              const selected = answers[currentIndex] === option.label;
              let stateClass = "border-border hover:border-muted-foreground/30";
              if (selected) stateClass = "border-accent bg-accent/5";

              return (
                <button
                  key={option.label}
                  onClick={() => handleSelectAnswer(currentIndex, option.label)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${stateClass}`}
                >
                  <span className="font-medium mr-3">{option.label}.</span>
                  <span>{option.text}</span>
                </button>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl text-sm disabled:opacity-30 hover:border-foreground/20 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            {currentIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIndex((i) => i + 1)}
                className="flex items-center gap-2 px-4 py-2.5 bg-foreground text-background rounded-xl text-sm hover:opacity-90 transition-opacity"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="sm:hidden flex items-center gap-2 px-4 py-2.5 bg-foreground text-background rounded-xl text-sm hover:opacity-90 transition-opacity"
              >
                <Send className="w-4 h-4" />
                Submit
              </button>
            )}
          </div>
        </div>

        {/* Sidebar — question palette */}
        <div className={`fixed inset-y-0 right-0 z-40 bg-background border-l border-border transform transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "translate-x-full"} md:relative md:translate-x-0 md:w-72 md:border-l md:border-t-0`}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-4 md:hidden">
              <span className="text-sm font-medium">Question Palette</span>
              <button onClick={() => setSidebarOpen(false)} className="p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-muted mb-3">
              {questions.length} Questions
            </div>

            <div className="grid grid-cols-5 md:grid-cols-4 gap-1.5 mb-6">
              {questions.map((q, i) => {
                const isAnswered = !!answers[i];
                const isFlagged = flagged.has(i);
                const isCurrent = i === currentIndex;

                return (
                  <button
                    key={i}
                    onClick={() => {
                      setCurrentIndex(i);
                      setSidebarOpen(false);
                    }}
                    className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium relative transition-colors ${
                      isCurrent
                        ? "ring-2 ring-accent"
                        : isAnswered
                        ? "bg-accent/20 text-accent"
                        : "bg-foreground/5 text-muted hover:text-foreground"
                    }`}
                  >
                    {q.questionNumber}
                    {isFlagged && (
                      <span className="absolute -top-0.5 -right-0.5 text-[8px]">🚩</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="space-y-2 text-xs text-muted">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-accent/20" /> Answered
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-foreground/5" /> Not answered
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded relative">🚩</span> Flagged
              </div>
            </div>

            <button
              onClick={handleSubmit}
              className="w-full mt-6 py-3 bg-foreground text-background rounded-xl text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Submit Test
            </button>
          </div>
        </div>

        {/* Mobile palette toggle */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden fixed bottom-6 right-6 z-40 w-12 h-12 bg-foreground text-background rounded-full shadow-lg flex items-center justify-center"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>
    </main>
  );
}
