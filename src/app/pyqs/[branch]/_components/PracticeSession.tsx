/**
 * Practice Session — /pyqs/[branch]?subject=X
 *
 * The main question practice interface.
 * Shows questions with filters, answer interaction, and progress tracking.
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  Lock,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  Bookmark,
  ArrowLeft,
  ArrowRight,
  Flag,
  Sparkles,
  Eye,
  EyeOff,
  RefreshCw,
  Zap,
  Settings2,
} from "@/components/pyq/PYQIcons";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter, useSearchParams } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

type Mode = "practice" | "exam";
type AnswerState = "unanswered" | "correct" | "incorrect";

interface PYQQuestion {
  id: string;
  questionNumber: number;
  subjectName: string;
  topicName: string;
  questionType: string;
  marks: number;
  questionText: string;
  questionHtml?: string;
  options: string[];
  correctAnswer: string;
  answerExplanation: string;
  difficulty: string;
  year: number;
  session?: string;
  source?: { primary: string };
  answerVerified: boolean;
}

export default function PracticeSession() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const branch = searchParams.get("branch") || "CS";
  const subjectParam = searchParams.get("subject") || "";
  const { isPremium, user } = useAuth();

  const [questions, setQuestions] = useState<PYQQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>("unanswered");
  const [showExplanation, setShowExplanation] = useState(false);
  const [mode, setMode] = useState<Mode>("practice");
  const [showFilters, setShowFilters] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const [yearFilter, setYearFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [totalTime, setTotalTime] = useState(0);
  const [submittedExams, setSubmittedExams] = useState<Set<number>>(new Set());

  // Fetch questions
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ branch, pageSize: "20", sortBy: "year", sortDir: "desc" });
    if (subjectParam) params.set("subject", subjectParam);
    if (yearFilter) params.set("year", yearFilter);
    if (typeFilter) params.set("type", typeFilter);

    fetch(`/api/pyq/questions?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.data) setQuestions(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [branch, subjectParam, yearFilter, typeFilter]);

  const current = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  const handleSelectAnswer = useCallback((answer: string) => {
    if (mode === "exam" && !submittedExams.has(currentIndex)) return;
    if (answerState !== "unanswered" && mode === "practice") return;

    setSelectedAnswer(answer);
    const isCorrect = answer === current?.correctAnswer;
    setAnswerState(isCorrect ? "correct" : "incorrect");

    if (mode === "practice") {
      setShowExplanation(true);
    }

    // Record attempt
    if (current && user) {
      fetch("/api/pyq/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: current.id,
          selectedAnswer: answer,
          practiceMode: mode,
          sessionId,
        }),
      }).catch(console.error);
    }
  }, [current, mode, user, sessionId, answerState, submittedExams, currentIndex]);

  const submitExam = useCallback(() => {
    if (!selectedAnswer) return;
    setSubmittedExams((prev) => new Set([...prev, currentIndex]));
    const isCorrect = selectedAnswer === current?.correctAnswer;
    setAnswerState(isCorrect ? "correct" : "incorrect");
    setShowExplanation(true);

    if (current && user) {
      fetch("/api/pyq/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: current.id,
          selectedAnswer,
          practiceMode: "exam",
          sessionId,
        }),
      }).catch(console.error);
    }
  }, [selectedAnswer, current, user, sessionId, currentIndex]);

  const toggleBookmark = useCallback(async () => {
    if (!current || !user) return;
    const isBookmarked = bookmarkedIds.has(current.id);

    if (isBookmarked) {
      await fetch(`/api/pyq/bookmarks?questionId=${current.id}`, { method: "DELETE" });
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        next.delete(current.id);
        return next;
      });
    } else {
      await fetch("/api/pyq/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: current.id }),
      });
      setBookmarkedIds((prev) => new Set([...prev, current.id]));
    }
  }, [current, user, bookmarkedIds]);

  const goNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      resetAnswerState();
    }
  }, [currentIndex, questions.length]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      resetAnswerState();
    }
  }, [currentIndex]);

  const resetAnswerState = () => {
    setSelectedAnswer(null);
    setAnswerState("unanswered");
    setShowExplanation(false);
  };

  // Timer
  useEffect(() => {
    const timer = setInterval(() => setTotalTime((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Branch meta
  const branchMeta: Record<string, string> = {
    CS: "Computer Science", EC: "Electronics & Comm", EE: "Electrical Engineering",
    ME: "Mechanical Engineering", CE: "Civil Engineering", IN: "Instrumentation",
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <Nav />
        <div className="pt-32 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-foreground/5 rounded w-1/3" />
              <div className="h-64 bg-foreground/5 rounded-2xl" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!current) {
    return (
      <main className="min-h-screen bg-background">
        <Nav />
        <div className="pt-32 px-6 text-center">
          <div className="text-6xl mb-4">📭</div>
          <h2 className="font-serif text-2xl mb-2">No Questions Found</h2>
          <p className="text-muted text-sm">
            {subjectParam
              ? `No PYQs found for ${subjectParam} in ${branchMeta[branch] || branch}.`
              : "No PYQs available for the selected filters."}
          </p>
          <button
            onClick={() => router.push("/pyqs")}
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-xl text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Library
          </button>
        </div>
      </main>
    );
  }

  const isExamSubmitted = mode === "exam" && submittedExams.has(currentIndex);

  return (
    <main className="min-h-screen bg-background">
      <Nav />

      {/* ─── Top Bar ─────────────────────────────────────────────────────── */}
      <div className="sticky top-16 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Left: branch + subject */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/pyqs/${branch}`)}
              className="text-xs text-muted hover:text-foreground transition-colors"
            >
              ← {branch}
            </button>
            {subjectParam && (
              <>
                <span className="text-muted/30">/</span>
                <span className="text-xs font-medium truncate max-w-[200px]">{subjectParam}</span>
              </>
            )}
          </div>

          {/* Center: progress */}
          <div className="hidden md:flex items-center gap-3">
            <span className="text-xs text-muted font-mono">
              {currentIndex + 1}/{questions.length}
            </span>
            <div className="w-32 h-1.5 bg-foreground/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-accent rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Right: mode + timer */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-xs text-muted">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-mono">{formatTime(totalTime)}</span>
            </div>
            <button
              onClick={() => setMode(mode === "practice" ? "exam" : "practice")}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                mode === "exam"
                  ? "bg-red-500/10 text-red-600 dark:text-red-400"
                  : "bg-foreground/5 text-muted"
              }`}
            >
              {mode === "exam" ? "📝 Exam Mode" : "📖 Practice Mode"}
            </button>
          </div>
        </div>
      </div>

      {/* ─── Question Card ───────────────────────────────────────────────── */}
      <section className="pt-8 pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Question metadata */}
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-xs font-mono text-muted">
                GATE {current.year}
              </span>
              <span className="text-muted/30">·</span>
              <span className="text-xs font-mono text-muted">{branch}</span>
              {current.session && (
                <>
                  <span className="text-muted/30">·</span>
                  <span className="text-xs font-mono text-muted">Set {current.session}</span>
                </>
              )}
              <span className="text-muted/30">·</span>
              <span className="text-xs font-mono text-muted">Q{current.questionNumber}</span>
              <span className="text-muted/30">·</span>
              <span className="text-xs font-mono text-muted">{current.marks}M</span>
              <span className="text-muted/30">·</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                current.questionType === "MCQ" ? "bg-blue-500/10 text-blue-600" :
                current.questionType === "MSQ" ? "bg-purple-500/10 text-purple-600" :
                "bg-emerald-500/10 text-emerald-600"
              }`}>
                {current.questionType}
              </span>
              {current.answerVerified && (
                <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-full">
                  ✓ Verified
                </span>
              )}
            </div>

            {/* Subject + Topic */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-xs text-muted">
                Subject: <span className="text-foreground font-medium">{current.subjectName}</span>
              </span>
              <span className="text-muted/30">·</span>
              <span className="text-xs text-muted">
                Topic:{" "}
                {isPremium ? (
                  <span className="text-foreground font-medium">{current.topicName}</span>
                ) : (
                  <button
                    onClick={() => router.push("/pricing")}
                    className="text-accent hover:text-accent-hover inline-flex items-center gap-1"
                  >
                    <Lock className="w-3 h-3" />
                    Premium
                  </button>
                )}
              </span>
            </div>
          </motion.div>

          {/* Question text */}
          <motion.div
            key={`q-${currentIndex}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl p-6 md:p-8 mb-6"
          >
            <div
              className="text-sm md:text-base leading-relaxed whitespace-pre-wrap [&_math]:text-base [&_table]:w-full [&_table]:overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: current.questionHtml || current.questionText }}
            />

            {/* Options */}
            {current.options && current.options.length > 0 && (
              <div className="mt-8 space-y-3">
                {current.options.map((option, idx) => {
                  const optionLabel = String.fromCharCode(65 + idx);
                  let optionStyle =
                    "border-border hover:border-foreground/20 bg-background/50";
                  let icon: React.ReactNode = null;

                  if (answerState !== "unanswered" || isExamSubmitted) {
                    const isSelected = selectedAnswer === optionLabel;
                    const isCorrectAnswer = current.correctAnswer === optionLabel;

                    if (isCorrectAnswer) {
                      optionStyle = "border-emerald-500 bg-emerald-500/10";
                      icon = <CheckCircle className="w-5 h-5 text-emerald-600" />;
                    } else if (isSelected && !isCorrectAnswer) {
                      optionStyle = "border-red-500 bg-red-500/10";
                      icon = <XCircle className="w-5 h-5 text-red-600" />;
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectAnswer(optionLabel)}
                      disabled={answerState !== "unanswered" && !isExamSubmitted}
                      className={`w-full text-left px-5 py-4 border rounded-xl transition-all duration-200 flex items-start gap-3
                        ${optionStyle}
                        ${answerState === "unanswered" || isExamSubmitted
                          ? "cursor-pointer"
                          : "cursor-default opacity-80"
                        }`}
                    >
                      <span className={`font-mono text-sm font-bold mt-0.5 w-6 shrink-0 ${
                        answerState !== "unanswered" || isExamSubmitted
                          ? current.correctAnswer === optionLabel
                            ? "text-emerald-600"
                            : selectedAnswer === optionLabel
                              ? "text-red-600"
                              : "text-muted"
                          : "text-muted"
                      }`}>
                        {optionLabel}.
                      </span>
                      <span className="flex-1 text-sm leading-relaxed">{option}</span>
                      {icon}
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Exam mode submit button */}
          {mode === "exam" && !isExamSubmitted && selectedAnswer && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={submitExam}
              className="w-full py-4 bg-foreground text-background rounded-xl font-medium text-sm mb-6 hover:opacity-90 transition-opacity"
            >
              Submit Answer
            </motion.button>
          )}

          {/* Explanation */}
          <AnimatePresence>
            {showExplanation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6"
              >
                <div className="bg-card border border-border rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    {answerState === "correct" ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                        <span className="text-emerald-600 font-semibold text-sm">Correct!</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-red-600" />
                        <span className="text-red-600 font-semibold text-sm">Incorrect</span>
                      </>
                    )}
                    <span className="text-muted text-sm ml-2">
                      Correct answer: <span className="font-mono font-bold">{current.correctAnswer}</span>
                    </span>
                  </div>

                  {current.answerExplanation && (
                    <div className="text-sm text-muted leading-relaxed mb-4">
                      {current.answerExplanation}
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted pt-4 border-t border-border">
                    {current.source && (
                      <span>Source: {current.source.primary}</span>
                    )}
                    {current.answerVerified && (
                      <span className="text-emerald-600">✓ Official answer</span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={goPrev}
              disabled={currentIndex === 0}
              className="inline-flex items-center gap-2 px-5 py-3 border border-border rounded-xl text-sm font-medium
                hover:border-foreground/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>

            <button
              onClick={toggleBookmark}
              className={`p-3 rounded-xl border transition-colors ${
                bookmarkedIds.has(current.id)
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border hover:border-foreground/40"
              }`}
            >
              <Bookmark className={`w-5 h-5 ${bookmarkedIds.has(current.id) ? "fill-current" : ""}`} />
            </button>

            <button
              onClick={goNext}
              disabled={currentIndex === questions.length - 1}
              className="inline-flex items-center gap-2 px-5 py-3 bg-foreground text-background rounded-xl text-sm font-medium
                hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Subject filter pills */}
          {!subjectParam && (
            <div className="mt-12 pt-8 border-t border-border">
              <h3 className="text-xs text-muted uppercase tracking-wider mb-4">
                Filter by Subject
              </h3>
              <div className="flex flex-wrap gap-2">
                {["General Aptitude", "Engineering Mathematics", "Algorithms", "Data Structures", "OS", "DBMS", "Networks", "TOC", "Compiler Design", "Digital Logic", "COA", "Analog", "Digital Electronics"].map((subj) => (
                  <button
                    key={subj}
                    onClick={() => router.push(`/pyqs/${branch}?subject=${encodeURIComponent(subj)}`)}
                    className="text-xs px-3 py-1.5 border border-border rounded-lg hover:border-foreground/40 transition-colors"
                  >
                    {subj}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
