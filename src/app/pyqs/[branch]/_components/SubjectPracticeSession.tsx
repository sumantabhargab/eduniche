/**
 * SubjectPracticeSession — practice mode within a subject
 *
 * Supports browse mode (instant reveal) and quiz mode (hide until reveal).
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Bookmark, ArrowLeft, CheckCircle, XCircle, Search,
  Eye, RefreshCw, AlertCircle
} from "@/components/pyq/PYQIcons";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PadhaiShuruLoader from "@/components/loading/PadhaiShuruLoader";

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

type Mode = "browse" | "quiz";

interface SubjectPracticeSessionProps {
  branch: string;
  subject: string;
  topic?: string;
  year?: string;
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

export default function SubjectPracticeSession({ branch, subject, topic, year }: SubjectPracticeSessionProps) {
  const router = useRouter();
  const topicParam = topic || "";
  const yearParam = year || "";
  const { isPremium, user } = useAuth();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerRevealed, setAnswerRevealed] = useState(false);
  const [answerIsCorrect, setAnswerIsCorrect] = useState(false);
  const [mode, setMode] = useState<Mode>("browse");
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Question[]>([]);
  const [searching, setSearching] = useState(false);

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

  // Load ALL questions for the subject (browse mode shows everything)
  useEffect(() => {
    setLoading(true);
    setError(false);
    setSelectedAnswer(null);
    setAnswerRevealed(false);
    setAnswerIsCorrect(false);
    setCurrentIndex(0);

    const fetchAll = async () => {
      try {
        const allQs: Question[] = [];
        let page = 1;
        const pageSize = 100;
        let totalCount = 0;

        while (true) {
          const params = new URLSearchParams({
            branch,
            subject,
            pageSize: pageSize.toString(),
            sortBy: "year",
            sortDir: "desc",
            page: page.toString(),
          });
          if (topicParam) params.set("topic", topicParam);
          if (yearParam) params.set("year", yearParam);

          const r = await fetch(`/api/pyq/questions?${params.toString()}`);
          const data = await r.json();
          if (data.data && data.data.length > 0) {
            allQs.push(...data.data);
            totalCount = data.pagination?.totalCount || allQs.length;
            if (!data.pagination?.hasMore || allQs.length >= totalCount) break;
            page++;
            if (page > 50) break; // safety cap
          } else {
            break;
          }
        }

        setQuestions(allQs);
        setLoading(false);
      } catch {
        setError(true);
        setLoading(false);
      }
    };

    fetchAll();
  }, [branch, subject, topicParam, yearParam]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToQuestion(currentIndex - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goToQuestion(currentIndex + 1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, questions.length]);

  const current = questions[currentIndex];

  const checkIsAnswerCorrect = (letter: string): boolean => {
    if (!current) return false;
    const idx = letter.charCodeAt(0) - 65;
    const optionText = current.options[idx];
    return letter === current.correctAnswer || optionText === current.correctAnswer;
  };

  const handleSelectAnswer = (answer: string) => {
    if (answerRevealed || !current) return;
    setSelectedAnswer(answer);
  };

  const handleRevealAnswer = () => {
    if (!current || answerRevealed || !selectedAnswer) return;
    const correct = checkIsAnswerCorrect(selectedAnswer);
    setAnswerIsCorrect(correct);
    setAnswerIsCorrect(correct);
    setAnswerRevealed(true);

    // Record attempt
    if (user?.id) {
      fetch("/api/pyq/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: current.id,
          branch,
          subject,
          selectedAnswer,
          isCorrect: correct,
          timeSpent: 0,
          practiceMode: mode,
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

    setSearching(true);
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
      } else if (data.results) {
        setSearchResults(data.results);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const goToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentIndex(index);
      setSelectedAnswer(null);
      setAnswerRevealed(false);
      setAnswerIsCorrect(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const retryLoad = () => {
    setError(false);
    setLoading(true);
    setSelectedAnswer(null);
    setAnswerRevealed(false);
    setAnswerIsCorrect(false);
    setCurrentIndex(0);

    const fetchAll = async () => {
      try {
        const allQs: Question[] = [];
        let page = 1;
        const pageSize = 100;
        let totalCount = 0;

        while (true) {
          const params = new URLSearchParams({
            branch,
            subject,
            pageSize: pageSize.toString(),
            sortBy: "year",
            sortDir: "desc",
            page: page.toString(),
          });
          if (topicParam) params.set("topic", topicParam);
          if (yearParam) params.set("year", yearParam);

          const r = await fetch(`/api/pyq/questions?${params.toString()}`);
          const data = await r.json();
          if (data.data && data.data.length > 0) {
            allQs.push(...data.data);
            totalCount = data.pagination?.totalCount || allQs.length;
            if (!data.pagination?.hasMore || allQs.length >= totalCount) break;
            page++;
            if (page > 50) break;
          } else {
            break;
          }
        }

        setQuestions(allQs);
        setLoading(false);
      } catch {
        setError(true);
        setLoading(false);
      }
    };

    fetchAll();
  };

  const meta = BRANCH_META[branch] || { name: branch, icon: "📚" };

  // Loading state
  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <Nav />
        <div className="pt-24 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <PadhaiShuruLoader size="md" variant="page" label="Loading Questions" />
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  // Error state
  if (error) {
    return (
      <main className="min-h-screen bg-background">
        <Nav />
        <div className="pt-24 flex items-center justify-center min-h-[60vh] px-6">
          <div className="text-center max-w-md">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="font-serif text-2xl mb-2">Something Went Wrong</h2>
            <p className="text-sm text-muted mb-6">
              We couldn't load questions for {subject}. Please check your connection and try again.
            </p>
            <button
              onClick={retryLoad}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  // Empty state
  if (questions.length === 0) {
    return (
      <main className="min-h-screen bg-background">
        <Nav />
        <div className="pt-24 flex items-center justify-center min-h-[60vh] px-6">
          <div className="text-center max-w-md">
            <div className="text-5xl mb-4">📝</div>
            <h2 className="font-serif text-2xl mb-2">No Questions Found</h2>
            <p className="text-sm text-muted mb-6">
              No questions available for {subject} in {meta.name}. Try a different subject or check back later.
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

  const progress = ((currentIndex + 1) / questions.length) * 100;

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
            {/* Mode toggle */}
            <div className="flex items-center gap-1 bg-foreground/5 rounded-lg p-0.5">
              <button
                onClick={() => { setMode("browse"); setAnswerRevealed(false); setSelectedAnswer(null); }}
                className={`text-[11px] px-2.5 py-1 rounded-md transition-colors ${
                  mode === "browse" ? "bg-background text-foreground shadow-sm" : "text-muted hover:text-foreground"
                }`}
              >
                Browse
              </button>
              <button
                onClick={() => { setMode("quiz"); setAnswerRevealed(false); setSelectedAnswer(null); }}
                className={`text-[11px] px-2.5 py-1 rounded-md transition-colors ${
                  mode === "quiz" ? "bg-background text-foreground shadow-sm" : "text-muted hover:text-foreground"
                }`}
              >
                Quiz
              </button>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-border">
          <motion.div
            className="h-full bg-accent"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Search bar */}
        {showSearch && (
          <div className="border-t border-border px-6 py-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
                if (e.key === "Escape") {
                  setShowSearch(false);
                  setSearchQuery("");
                  setSearchResults([]);
                }
              }}
              placeholder="Search in this subject… (Enter to search, Esc to close)"
              className="w-full max-w-md px-3 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:border-accent"
              autoFocus
            />
            {searching && (
              <p className="text-xs text-muted mt-2">Searching…</p>
            )}
            {!searching && searchResults.length === 0 && searchQuery.trim().length >= 2 && (
              <p className="text-xs text-muted mt-2">No results found for &ldquo;{searchQuery}&rdquo;</p>
            )}
            {!searching && searchResults.length > 0 && (
              <div className="max-w-md mt-2 max-h-40 overflow-y-auto">
                <p className="text-xs text-muted mb-1">{searchResults.length} result{searchResults.length !== 1 ? "s" : ""}</p>
                {searchResults.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => {
                      const idx = questions.findIndex((x) => x.id === q.id);
                      if (idx >= 0) goToQuestion(idx);
                      setShowSearch(false);
                      setSearchQuery("");
                      setSearchResults([]);
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
                {mode === "quiz" && !answerRevealed && selectedAnswer && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded animate-pulse">Answer selected</span>
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
                    const matchesAnswer = option === current.correctAnswer || letter === current.correctAnswer;
                    let stateClass = "border-border hover:border-muted-foreground/30";
                    let iconEl = null;

                    if (answerRevealed) {
                      if (matchesAnswer) {
                        stateClass = "border-green-500 bg-green-50 dark:bg-green-950/30";
                        iconEl = <CheckCircle className="w-4 h-4 text-green-600 ml-2 flex-shrink-0" />;
                      } else if (letter === selectedAnswer && !matchesAnswer) {
                        stateClass = "border-red-500 bg-red-50 dark:bg-red-950/30";
                        iconEl = <XCircle className="w-4 h-4 text-red-600 ml-2 flex-shrink-0" />;
                      }
                    } else if (selectedAnswer === letter) {
                      stateClass = "border-accent bg-accent/5";
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectAnswer(letter)}
                        disabled={answerRevealed || (mode === "quiz" && answerRevealed)}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-2 ${
                          stateClass} ${
                          answerRevealed ? "cursor-default" : "cursor-pointer hover:shadow-sm"
                        }`}
                      >
                        <span className="font-medium flex-shrink-0">{letter}.</span>
                        <span className="flex-1">{option}</span>
                        {iconEl}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Reveal button (quiz mode only) */}
              {mode === "quiz" && selectedAnswer && !answerRevealed && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-center"
                >
                  <button
                    onClick={handleRevealAnswer}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-accent/20"
                  >
                    <Eye className="w-4 h-4" />
                    Reveal Answer
                  </button>
                </motion.div>
              )}

              {/* Answer feedback */}
              {answerRevealed && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-5 rounded-xl border ${
                    answerIsCorrect
                      ? "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800"
                      : "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    {answerIsCorrect ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span className="font-medium">
                      {answerIsCorrect ? "Correct!" : `Incorrect — Correct Answer: ${current.correctAnswer}`}
                    </span>
                  </div>

                  {current.answerExplanation && (
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
                    title={bookmarkedIds.has(current.id) ? "Remove bookmark" : "Bookmark this question"}
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
                Question {currentIndex + 1} of {questions.length} &nbsp;·&nbsp;
                {Math.round(progress)}% complete &nbsp;·&nbsp;
                Use ← → arrow keys to navigate
              </div>
            </motion.div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
