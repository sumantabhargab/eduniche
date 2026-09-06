/**
 * SubjectPracticeSession — practice mode within a subject
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Bookmark, ArrowLeft, CheckCircle, XCircle, Lock, Search } from "@/components/pyq/PYQIcons";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter, useSearchParams } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

interface Question {
  id: string;
  questionId: string;
  questionNumber: number;
  subjectName: string;
  topicName: string;
  subtopicName?: string;
  questionType: string;
  marks: number;
  difficulty: string;
  year: number;
  session?: string;
  questionText: string;
  questionHtml?: string;
  options: string[];
  correctAnswer: string;
  answerExplanation: string;
  source?: { primary: string; url?: string };
  answerVerified: boolean;
}

interface SubjectPracticeSessionProps {
  branch: string;
  subject: string;
}

const BRANCH_META: Record<string, { name: string; icon: string }> = {
  CS: { name: "Computer Science & IT", icon: "💻" },
  EC: { name: "Electronics & Communication", icon: "📡" },
  EE: { name: "Electrical Engineering", icon: "⚡" },
  ME: { name: "Mechanical Engineering", icon: "⚙️" },
  CE: { name: "Civil Engineering", icon: "🏗️" },
  IN: { name: "Instrumentation", icon: "🔬" },
  PI: { name: "Production & Industrial", icon: "🏭" },
  CH: { name: "Chemical Engineering", icon: "🧪" },
  BT: { name: "Biotechnology", icon: "🧬" },
  MT: { name: "Metallurgy", icon: "🔥" },
  XE: { name: "Engineering Sciences", icon: "🔭" },
  XL: { name: "Life Sciences", icon: "🧫" },
  TF: { name: "Textile Engineering", icon: "🧵" },
  PE: { name: "Petroleum Engineering", icon: "🛢️" },
  EY: { name: "Ecology & Evolution", icon: "🌿" },
  MA: { name: "Mathematics (MA)", icon: "📐" },
  AR: { name: "Architecture & Planning", icon: "🏛️" },
  AG: { name: "Agricultural Engineering", icon: "🌾" },
  GG: { name: "Geology & Geophysics", icon: "🌍" },
  PH: { name: "Engineering Physics", icon: "⚛️" },
};

export default function SubjectPracticeSession({ branch, subject }: SubjectPracticeSessionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const topicParam = searchParams.get("topic") || "";
  const yearParam = searchParams.get("year") || "";
  const { isPremium, user } = useAuth();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<"unanswered" | "correct" | "incorrect">("unanswered");
  const [showExplanation, setShowExplanation] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Question[]>([]);
  const [pagination, setPagination] = useState({ totalCount: 0, totalPages: 0, hasMore: false });

  // Load bookmarks
  useEffect(() => {
    if (!user?.id) return;
    fetch("/api/pyq/bookmarks")
      .then((r) => r.json())
      .then((data) => {
        if (data.bookmarks) {
          setBookmarkedIds(new Set(data.bookmarks.map((b: { questionId: string }) => b.questionId)));
        }
      })
      .catch(() => {});
  }, [user?.id]);

  // Load questions
  useEffect(() => {
    setLoading(true);
    setSelectedAnswer(null);
    setAnswerState("unanswered");
    setShowExplanation(false);
    setCurrentIndex(0);

    const params = new URLSearchParams({ branch, subject, pageSize: "50", sortBy: "year", sortDir: "desc" });
    if (topicParam) params.set("topic", topicParam);
    if (yearParam) params.set("year", yearParam);

    fetch(`/api/pyq/questions?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.data) {
          setQuestions(data.data);
          setPagination({
            totalCount: data.pagination?.totalCount || 0,
            totalPages: data.pagination?.totalPages || 0,
            hasMore: data.pagination?.hasMore || false,
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [branch, subject, topicParam, yearParam]);

  const current = questions[currentIndex];

  const handleSelectAnswer = (answer: string) => {
    if (answerState !== "unanswered" || !current) return;
    setSelectedAnswer(answer);
    const isCorrect = answer === current.correctAnswer;
    setAnswerState(isCorrect ? "correct" : "incorrect");
    setShowExplanation(true);

    // Record attempt
    if (user?.id) {
      fetch("/api/pyq/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: current.id,
          branch,
          subject,
          selectedAnswer: answer,
          isCorrect,
          timeSpent: 0,
        }),
      }).catch(() => {});
    }
  };

  const handleBookmark = async () => {
    if (!current || !user?.id) return;
    const isBookmarked = bookmarkedIds.has(current.id);

    try {
      await fetch("/api/pyq/bookmarks", {
        method: isBookmarked ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: current.id }),
      });

      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        if (isBookmarked) next.delete(current.id);
        else next.add(current.id);
        return next;
      });
    } catch {
      // Silently fail
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const params = new URLSearchParams({
        branch,
        subject,
        search: searchQuery.trim(),
        pageSize: "20",
      });

      const res = await fetch(`/api/pyq/search?${params.toString()}`);
      const data = await res.json();
      if (data.questions) {
        setSearchResults(data.questions);
      }
    } catch {
      // Silently fail
    }
  };

  const goToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentIndex(index);
      setSelectedAnswer(null);
      setAnswerState("unanswered");
      setShowExplanation(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const meta = BRANCH_META[branch] || { name: branch, icon: "📚" };

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <Nav />
        <div className="pt-24 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-muted">Loading questions…</p>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (questions.length === 0) {
    return (
      <main className="min-h-screen bg-background">
        <Nav />
        <div className="pt-24 flex items-center justify-center min-h-[60vh] px-6">
          <div className="text-center max-w-md">
            <div className="text-5xl mb-4">📝</div>
            <h2 className="font-serif text-2xl mb-2">No Questions Found</h2>
            <p className="text-sm text-muted mb-6">
              No questions available for {subject} in {branch}. Try a different subject or check back later.
            </p>
            <button
              onClick={() => router.push(`/pyqs/${branch}`)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Subjects
            </button>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Nav />

      {/* Header */}
      <div className="sticky top-16 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <button
            onClick={() => router.push(`/pyqs/${branch}`)}
            className="text-xs text-muted hover:text-foreground transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {meta.name}
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 text-muted hover:text-foreground transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>
            <span className="text-xs text-muted">
              {currentIndex + 1} / {questions.length}
            </span>
          </div>
        </div>

        {/* Search bar */}
        {showSearch && (
          <div className="border-t border-border px-6 py-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search in this subject…"
              className="w-full max-w-md px-3 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:border-accent"
              autoFocus
            />
            {searchResults.length > 0 && (
              <div className="max-w-md mt-2 max-h-40 overflow-y-auto">
                {searchResults.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => {
                      const idx = questions.findIndex((x) => x.id === q.id);
                      if (idx >= 0) goToQuestion(idx);
                      setSearchResults([]);
                      setSearchQuery("");
                    }}
                    className="block w-full text-left px-3 py-2 text-xs hover:bg-secondary rounded mb-1"
                  >
                    {q.year} — Q{q.questionNumber}: {q.questionText.substring(0, 60)}…
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Question */}
      <section className="pt-8 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          {current && (
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Question meta */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                <span className="px-2 py-1 bg-secondary rounded">{current.year}</span>
                <span className="px-2 py-1 bg-secondary rounded">{branch}</span>
                <span className="px-2 py-1 bg-secondary rounded">Q{current.questionNumber}</span>
                <span className="px-2 py-1 bg-secondary rounded">{current.marks} Marks</span>
                <span className="px-2 py-1 bg-secondary rounded">{current.questionType}</span>
                {current.session && (
                  <span className="px-2 py-1 bg-secondary rounded">Set {current.session}</span>
                )}
                {!current.answerVerified && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">Unverified</span>
                )}
              </div>

              {/* Topic info */}
              <div className="text-xs text-muted">
                <span>{current.subjectName}</span>
                {current.topicName && (
                  <>
                    <span className="mx-2">›</span>
                    <span>{current.topicName}</span>
                  </>
                )}
              </div>

              {/* Question text */}
              <div className="font-serif text-lg md:text-xl leading-relaxed">
                {current.questionHtml ? (
                  <div dangerouslySetInnerHTML={{ __html: current.questionHtml }} />
                ) : (
                  <p>{current.questionText}</p>
                )}
              </div>

              {/* Options */}
              {current.options && current.options.length > 0 && (
                <div className="space-y-3">
                  {current.options.map((option, idx) => {
                    const letter = String.fromCharCode(65 + idx);
                    let stateClass = "border-border hover:border-muted-foreground/30";
                    if (answerState !== "unanswered") {
                      if (option === current.correctAnswer) {
                        stateClass = "border-green-500 bg-green-50 dark:bg-green-950/30";
                      } else if (option === selectedAnswer && option !== current.correctAnswer) {
                        stateClass = "border-red-500 bg-red-50 dark:bg-red-950/30";
                      }
                    } else if (selectedAnswer === option) {
                      stateClass = "border-accent bg-accent/5";
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectAnswer(option)}
                        disabled={answerState !== "unanswered"}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${stateClass} ${
                          answerState !== "unanswered" ? "cursor-default" : "cursor-pointer"
                        }`}
                      >
                        <span className="font-medium mr-3">{letter}.</span>
                        <span>{option}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Answer feedback */}
              {answerState !== "unanswered" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-5 rounded-xl border ${
                    answerState === "correct"
                      ? "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800"
                      : "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    {answerState === "correct" ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span className="font-medium">
                      {answerState === "correct" ? "Correct!" : `Incorrect — Answer: ${current.correctAnswer}`}
                    </span>
                  </div>

                  {showExplanation && current.answerExplanation && (
                    <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/10">
                      <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2">Explanation</p>
                      <p className="text-sm leading-relaxed">{current.answerExplanation}</p>
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/10 flex items-center justify-between">
                    <div className="text-xs text-muted">
                      Source: {current.source?.primary || "GATE Official"}
                    </div>
                    {current.source?.url && (
                      <a
                        href={current.source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-accent hover:underline"
                      >
                        View source
                      </a>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-6 border-t border-border">
                <button
                  onClick={() => goToQuestion(currentIndex - 1)}
                  disabled={currentIndex === 0}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm text-muted hover:text-foreground disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleBookmark}
                    className={`p-2 transition-colors ${
                      bookmarkedIds.has(current.id)
                        ? "text-accent"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    <Bookmark className={`w-5 h-5 ${bookmarkedIds.has(current.id) ? "fill-current" : ""}`} />
                  </button>
                </div>

                <button
                  onClick={() => goToQuestion(currentIndex + 1)}
                  disabled={currentIndex === questions.length - 1}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm text-muted hover:text-foreground disabled:opacity-30 transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Question counter */}
              <div className="text-center text-xs text-muted pt-4">
                Showing {currentIndex + 1} of {questions.length} questions
              </div>
            </motion.div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
