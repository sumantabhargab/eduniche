/**
 * Predicted Papers — Exam Player
 *
 * Full exam simulation: 3-hour timer, question palette, answer selection,
 * auto-save progress, and score calculation.
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, ChevronLeft, ChevronRight, Bookmark, CheckCircle,
  XCircle, Flag, Send, AlertTriangle, Share2, Download
} from "@/components/pyq/PYQIcons";
import { useAuth } from "@/lib/hooks/useAuth";
import { shareOnWhatsApp } from "@/lib/share/whatsapp";

interface PredictedQuestion {
  id: string;
  questionNumber: number;
  subject: string;
  topic: string;
  questionType: string;
  marks: number;
  negativeMarks: number;
  difficulty: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  source: string;
}

interface PredictedPaper {
  id: string;
  branch: string;
  title: string;
  description: string;
  totalQuestions: number;
  totalMarks: number;
  difficultyDistribution: { easy: number; moderate: number; difficult: number };
  subjectBreakdown: { subject: string; marks: number; questions: number }[];
  predictionRationale: string;
  questions: PredictedQuestion[];
}

type ExamState = "intro" | "active" | "review" | "submitted";

const EXAM_DURATION_SECONDS = 3 * 60 * 60; // 3 hours

export default function ExamPlayerPage() {
  const params = useParams();
  const branch = (params.branch as string)?.toUpperCase() || "";
  const paperId = params.paperId as string;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [paper, setPaper] = useState<PredictedPaper | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [examState, setExamState] = useState<ExamState>("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION_SECONDS);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<{ correct: number; wrong: number; unattempted: number; totalMarks: number; scoredMarks: number } | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load paper
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setError("Please sign in to access predicted papers.");
      setLoading(false);
      return;
    }

    fetch(`/api/predicted-papers/${branch.toLowerCase()}/${paperId}`)
      .then((r) => {
        if (r.status === 401) {
          throw new Error("Please sign in first.");
        }
        if (!r.ok) throw new Error("Failed to load paper");
        return r.json();
      })
      .then((data) => {
        if (data.paper) {
          setPaper(data.paper);
        } else if (data.error) {
          setError(data.error);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [branch, paperId, user, authLoading]);

  // Timer
  useEffect(() => {
    if (examState !== "active" || submitted) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [examState, submitted]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleStart = () => {
    setExamState("active");
    setTimeLeft(EXAM_DURATION_SECONDS);
  };

  const handleSelectAnswer = (qIndex: number, answer: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qIndex]: answer }));
  };

  const toggleFlag = (qIndex: number) => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(qIndex)) next.delete(qIndex);
      else next.add(qIndex);
      return next;
    });
  };

  const handleSubmit = useCallback(() => {
    if (submitted || !paper) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitted(true);
    setExamState("submitted");

    // Calculate score
    let correct = 0;
    let wrong = 0;
    let unattempted = 0;
    let scoredMarks = 0;

    for (let i = 0; i < paper.questions.length; i++) {
      const q = paper.questions[i];
      const userAns = answers[i];

      if (!userAns) {
        unattempted++;
      } else if (userAns === q.correctAnswer) {
        correct++;
        scoredMarks += q.marks;
      } else {
        wrong++;
        scoredMarks -= q.negativeMarks;
      }
    }

    setScore({ correct, wrong, unattempted, totalMarks: paper.totalMarks, scoredMarks: Math.max(0, scoredMarks) });
  }, [submitted, paper, answers]);

  const handleShare = () => {
    if (!score || !paper) return;
    const text =
      `🎯 GATE ${paper.branch} Predicted Paper\n` +
      `Paper: ${paper.title}\n` +
      `Score: ${score.scoredMarks}/${score.totalMarks}\n` +
      `Correct: ${score.correct} | Wrong: ${score.wrong} | Unattempted: ${score.unattempted}\n` +
      `\nCheck predicted papers on PadhaiShuru → padhaishuru.com/predicted-papers`;
    shareOnWhatsApp(text);
  };

  const getPdfUrl = () => {
    return `/api/predicted-papers/${branch.toLowerCase()}/${paperId}/pdf`;
  };

  if (loading || authLoading) {
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

  if (error) {
    return (
      <main className="min-h-screen bg-background">
        <Nav />
        <div className="pt-24 flex items-center justify-center min-h-[60vh] px-6">
          <div className="max-w-md text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="font-serif text-2xl mb-3">Access Denied</h1>
            <p className="text-sm text-muted mb-6">{error}</p>
            <div className="flex flex-col gap-3">
              <Link href="/login" className="px-6 py-3 bg-foreground text-background rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
                Sign In
              </Link>
              <Link href="/predicted-papers" className="px-6 py-3 border border-border text-muted rounded-xl text-sm font-medium hover:text-foreground transition-colors">
                Back to Papers
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (!paper) {
    return (
      <main className="min-h-screen bg-background">
        <Nav />
        <div className="pt-24 text-center">Paper not found.</div>
        <Footer />
      </main>
    );
  }

  // Intro screen
  if (examState === "intro") {
    return (
      <main className="min-h-screen bg-background">
        <Nav />
        <section className="pt-32 pb-20 px-6">
          <div className="max-w-2xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <span className="text-xs font-mono text-accent uppercase tracking-wider">
                {paper.branch} · Predicted Paper
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl mt-3 mb-2">{paper.title}</h1>
              <p className="text-sm text-muted">{paper.description}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card border border-border rounded-3xl p-8 text-left space-y-5"
            >
              <h3 className="font-medium text-sm uppercase tracking-wider text-muted">Exam Details</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-foreground/5 rounded-xl p-4">
                  <div className="text-xs text-muted mb-1">Questions</div>
                  <div className="text-xl font-mono font-medium">{paper.totalQuestions}</div>
                </div>
                <div className="bg-foreground/5 rounded-xl p-4">
                  <div className="text-xs text-muted mb-1">Total Marks</div>
                  <div className="text-xl font-mono font-medium">{paper.totalMarks}</div>
                </div>
                <div className="bg-foreground/5 rounded-xl p-4">
                  <div className="text-xs text-muted mb-1">Duration</div>
                  <div className="text-xl font-mono font-medium">3 Hours</div>
                </div>
                <div className="bg-foreground/5 rounded-xl p-4">
                  <div className="text-xs text-muted mb-1">Negative Marking</div>
                  <div className="text-xl font-mono font-medium">Yes</div>
                </div>
              </div>

              <div className="bg-purple-500/5 border border-purple-500/10 rounded-xl p-4">
                <h4 className="text-sm font-medium mb-2">Prediction Rationale</h4>
                <p className="text-xs text-muted leading-relaxed">{paper.predictionRationale}</p>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <button
                  onClick={handleStart}
                  className="w-full py-3.5 bg-foreground text-background rounded-xl text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  Start Exam
                  <ChevronRight className="w-4 h-4" />
                </button>
                <a
                  href={getPdfUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 border border-border text-muted rounded-xl text-sm font-medium hover:text-foreground transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </a>
                <Link
                  href={`/predicted-papers/${branch.toLowerCase()}`}
                  className="w-full py-3 border border-border text-muted rounded-xl text-sm font-medium hover:text-foreground transition-colors text-center"
                >
                  Back to Papers
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
        <Footer />
      </main>
    );
  }

  // Submitted / Review screen
  if (examState === "submitted" && score) {
    const percentage = Math.round((score.scoredMarks / score.totalMarks) * 100);
    return (
      <main className="min-h-screen bg-background">
        <Nav />
        <section className="pt-32 pb-20 px-6">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="bg-card border border-border rounded-3xl p-6 sm:p-8"
            >
              <div className="text-center mb-8">
                <div className="text-xs text-muted font-medium uppercase tracking-wider mb-2">
                  {paper.title} — Results
                </div>
                <div className="text-5xl sm:text-6xl font-bold font-mono text-accent">
                  {score.scoredMarks}
                </div>
                <div className="text-sm text-muted mt-1">
                  out of {score.totalMarks} marks ({percentage}%)
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-8">
                <div className="p-4 rounded-2xl text-center bg-green-500/10 border border-green-500/20">
                  <div className="text-2xl mb-1">✅</div>
                  <div className="text-lg font-mono font-medium text-green-600">{score.correct}</div>
                  <div className="text-xs text-muted">Correct</div>
                </div>
                <div className="p-4 rounded-2xl text-center bg-red-500/10 border border-red-500/20">
                  <div className="text-2xl mb-1">❌</div>
                  <div className="text-lg font-mono font-medium text-red-600">{score.wrong}</div>
                  <div className="text-xs text-muted">Wrong</div>
                </div>
                <div className="p-4 rounded-2xl text-center bg-foreground/5 border border-border">
                  <div className="text-2xl mb-1">—</div>
                  <div className="text-lg font-mono font-medium">{score.unattempted}</div>
                  <div className="text-xs text-muted">Unattempted</div>
                </div>
              </div>

              <button
                onClick={handleShare}
                className="w-full py-3 bg-[#25D366] text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 mb-4"
              >
                <Share2 className="w-4 h-4" />
                Share on WhatsApp
              </button>

              <div className="flex gap-3">
                <a
                  href={getPdfUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 border border-border text-muted rounded-xl text-sm font-medium hover:text-foreground transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  PDF
                </a>
                <Link
                  href={`/predicted-papers/${branch.toLowerCase()}`}
                  className="flex-1 py-3 border border-border text-muted rounded-xl text-sm font-medium hover:text-foreground transition-colors text-center"
                >
                  All Papers
                </Link>
                <Link
                  href="/predicted-papers"
                  className="flex-1 py-3 border border-border text-muted rounded-xl text-sm font-medium hover:text-foreground transition-colors text-center"
                >
                  All Branches
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
        <Footer />
      </main>
    );
  }

  // Active exam screen
  const q = paper.questions[currentQ];
  const userAnswer = answers[currentQ];
  const isNat = q.questionType.endsWith("NAT");
  const isMsq = q.questionType === "2MSQ";

  return (
    <main className="min-h-screen bg-background">
      <Nav />

      {/* Exam Header */}
      <div className="fixed top-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-b border-border z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/predicted-papers/${branch.toLowerCase()}`} className="text-xs text-muted hover:text-foreground">
              ← Exit
            </Link>
            <span className="text-sm font-medium">{paper.title}</span>
          </div>

          <div className={`flex items-center gap-2 font-mono text-sm ${timeLeft < 300 ? "text-red-500" : "text-foreground"}`}>
            <Clock className="w-4 h-4" />
            {formatTime(timeLeft)}
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitted}
            className="px-4 py-2 bg-foreground text-background rounded-lg text-xs font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
          >
            <Send className="w-3.5 h-3.5" />
            Submit
          </button>
        </div>
      </div>

      <div className="pt-20 pb-8 px-4">
        <div className="max-w-6xl mx-auto flex gap-6">
          {/* Question Area */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQ}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-card border border-border rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-mono text-accent">Q{q.questionNumber}/{paper.totalQuestions}</span>
                  <span className="text-xs text-muted bg-foreground/5 px-2.5 py-1 rounded-lg">{q.subject}</span>
                  <span className="text-xs text-muted">{q.marks} marks</span>
                  <span className="text-xs text-muted">−{q.negativeMarks} neg</span>
                </div>

                <p className="text-base leading-relaxed mb-6">{q.questionText}</p>

                {!isNat ? (
                  <div className="space-y-2.5">
                    {q.options.map((opt, i) => {
                      const letter = String.fromCharCode(65 + i);
                      const isSelected = userAnswer === letter;
                      const isCorrect = q.correctAnswer === letter;

                      return (
                        <button
                          key={i}
                          onClick={() => handleSelectAnswer(currentQ, letter)}
                          className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                            submitted
                              ? isCorrect
                                ? "border-green-500 bg-green-500/10"
                                : isSelected && !isCorrect
                                  ? "border-red-500 bg-red-500/10"
                                  : "border-border"
                              : isSelected
                                ? "border-accent bg-accent/5"
                                : "border-border hover:border-accent/50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-medium ${
                              submitted && isCorrect ? "border-green-500 text-green-600" :
                              isSelected && !submitted ? "border-accent text-accent" :
                              "border-border text-muted"
                            }`}>
                              {letter}
                            </span>
                            <span className="text-sm">{opt}</span>
                            {submitted && isCorrect && <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />}
                            {submitted && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-500 ml-auto" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={userAnswer || ""}
                      onChange={(e) => handleSelectAnswer(currentQ, e.target.value)}
                      disabled={submitted}
                      placeholder="Enter your answer..."
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-accent/50 disabled:opacity-50 font-mono"
                    />
                    {submitted && (
                      <div className="text-sm text-muted">
                        Correct answer: <span className="font-mono text-green-600">{q.correctAnswer}</span>
                      </div>
                    )}
                  </div>
                )}

                {submitted && q.explanation && (
                  <div className="mt-5 p-4 bg-accent/5 border border-accent/10 rounded-xl">
                    <h4 className="text-xs font-medium uppercase tracking-wider text-muted mb-2">Explanation</h4>
                    <p className="text-sm text-muted leading-relaxed">{q.explanation}</p>
                    <p className="text-xs text-muted mt-2 italic">Source: {q.source}</p>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between mt-6">
                  <button
                    onClick={() => setCurrentQ((p) => Math.max(0, p - 1))}
                    disabled={currentQ === 0}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm text-muted hover:text-foreground disabled:opacity-30 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>

                  <button
                    onClick={() => toggleFlag(currentQ)}
                    className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-xl transition-all ${
                      flagged.has(currentQ)
                        ? "text-red-500 bg-red-500/10"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    <Flag className="w-4 h-4" />
                    {flagged.has(currentQ) ? "Flagged" : "Flag"}
                  </button>

                  <button
                    onClick={() => setCurrentQ((p) => Math.min(paper.questions.length - 1, p + 1))}
                    disabled={currentQ === paper.questions.length - 1}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm text-muted hover:text-foreground disabled:opacity-30 transition-all"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Question Palette */}
          <div className="w-48 flex-shrink-0 hidden lg:block">
            <div className="bg-card border border-border rounded-2xl p-4 sticky top-24">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted mb-3">
                Question Palette ({paper.questions.length})
              </h3>

              <div className="grid grid-cols-5 gap-1.5 max-h-[60vh] overflow-y-auto pr-1">
                {paper.questions.map((_, idx) => {
                  const hasAnswer = !!answers[idx];
                  const isFlagged = flagged.has(idx);
                  const isCurrent = idx === currentQ;

                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentQ(idx)}
                      className={`w-8 h-8 rounded-lg text-xs font-mono flex items-center justify-center transition-all ${
                        isCurrent
                          ? "bg-accent text-background"
                          : hasAnswer
                            ? "bg-green-500/10 text-green-600 border border-green-500/20"
                            : "bg-foreground/5 text-muted border border-border hover:border-accent/50"
                      }`}
                      title={`Q${idx + 1}${isFlagged ? " (flagged)" : ""}${hasAnswer ? " (answered)" : ""}`}
                    >
                      {idx + 1}
                      {isFlagged && <span className="absolute -top-0.5 -right-0.5 text-red-500">⚑</span>}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-green-500/20 border border-green-500/30" />
                  <span className="text-muted">Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-foreground/10 border border-border" />
                  <span className="text-muted">Unanswered</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-500 text-xs">⚑</span>
                  <span className="text-muted">Flagged</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile palette toggle */}
      <div className="fixed bottom-4 right-4 lg:hidden">
        <div className="bg-card border border-border rounded-2xl p-3 shadow-lg">
          <div className="text-xs text-muted mb-2">
            {Object.keys(answers).length}/{paper.questions.length} answered
          </div>
          <div className="flex gap-1">
            {paper.questions.slice(0, 10).map((_, idx) => {
              const hasAnswer = !!answers[idx];
              return (
                <button
                  key={idx}
                  onClick={() => setCurrentQ(idx)}
                  className={`w-7 h-7 rounded-lg text-xs font-mono ${
                    idx === currentQ ? "bg-accent text-background" :
                    hasAnswer ? "bg-green-500/10 text-green-600" : "bg-foreground/5 text-muted"
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
            {paper.questions.length > 10 && <span className="text-xs text-muted px-1">+{paper.questions.length - 10}</span>}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
