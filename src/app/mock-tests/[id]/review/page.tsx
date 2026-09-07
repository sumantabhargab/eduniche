/**
 * Mock Test Review — /mock-tests/[id]/review
 *
 * Review a completed mock test with detailed answer analysis.
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  BookOpen,
  Filter,
} from "@/components/pyq/PYQIcons";

type ReviewItem = {
  questionNumber: number;
  questionText: string;
  questionHtml?: string;
  options: Array<{ label: string; text: string }>;
  correctAnswer: string;
  userAnswer: string | null;
  isCorrect: boolean;
  isUnattempted: boolean;
  subjectName: string;
  topicName: string;
  marks: number;
  explanation?: string;
};

export default function MockTestReviewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [testTitle, setTestTitle] = useState("");
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filter, setFilter] = useState<"all" | "correct" | "wrong" | "unattempted">("all");
  const [loading, setLoading] = useState(true);

  const urlQIndex = searchParams.get("q");
  const initialIndex = urlQIndex ? parseInt(urlQIndex) : 0;

  useEffect(() => {
    setMounted(true);
    Promise.all([
      fetch(`/api/mock-tests/${params.id}`).then((r) => r.json()),
      fetch(`/api/mock-tests/${params.id}/review`).then((r) => r.json()),
    ]).then(([testData, reviewData]) => {
      if (testData.test) setTestTitle(testData.test.title);
      if (reviewData.reviews) {
        setReviews(reviewData.reviews);
        if (!isNaN(initialIndex) && initialIndex < reviewData.reviews.length) {
          setCurrentIndex(initialIndex);
        }
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [params.id, initialIndex]);

  const filtered = filter === "all"
    ? reviews
    : reviews.filter((r) => {
        if (filter === "correct") return r.isCorrect;
        if (filter === "wrong") return !r.isCorrect && !r.isUnattempted;
        if (filter === "unattempted") return r.isUnattempted;
        return true;
      });

  const current = filtered[currentIndex];

  const goNext = () => {
    if (currentIndex < filtered.length - 1) setCurrentIndex((i) => i + 1);
  };

  const goPrev = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
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

  if (!current) {
    return (
      <main className="min-h-screen bg-background">
        <Nav />
        <div className="pt-24 text-center min-h-[60vh] flex items-center justify-center">
          <div>
            <p className="text-muted mb-4">No review available. Take the test first!</p>
            <button onClick={() => router.push("/mock-tests")} className="text-accent hover:underline">
              Back to Mock Tests
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

      <section className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <button
                onClick={() => router.push("/mock-tests")}
                className="text-xs text-muted hover:text-foreground transition-colors mb-2"
              >
                ← Back to Mock Tests
              </button>
              <h1 className="font-serif text-2xl">{testTitle || "Mock Test Review"}</h1>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted" />
              {(["all", "correct", "wrong", "unattempted"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => { setFilter(f); setCurrentIndex(0); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filter === f
                      ? "bg-foreground text-background"
                      : "bg-foreground/5 text-muted hover:text-foreground"
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Question */}
            <div className="lg:col-span-3">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-card border border-border rounded-2xl p-6 md:p-8"
              >
                {/* Status badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted font-mono">
                      Q{current.questionNumber} · {current.subjectName}
                    </span>
                    <span className="text-xs px-2 py-1 bg-accent/10 text-accent rounded-md">
                      {current.marks} marks
                    </span>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                    current.isCorrect
                      ? "bg-green-500/10 text-green-600"
                      : current.isUnattempted
                      ? "bg-muted/10 text-muted"
                      : "bg-red-500/10 text-red-600"
                  }`}>
                    {current.isCorrect ? (
                      <><CheckCircle className="w-3.5 h-3.5" /> Correct</>
                    ) : current.isUnattempted ? (
                      <><AlertCircle className="w-3.5 h-3.5" /> Unattempted</>
                    ) : (
                      <><XCircle className="w-3.5 h-3.5" /> Wrong</>
                    )}
                  </span>
                </div>

                {/* Question */}
                <div className="prose prose-sm max-w-none mb-6">
                  {current.questionHtml ? (
                    <div dangerouslySetInnerHTML={{ __html: current.questionHtml }} />
                  ) : (
                    <p>{current.questionText}</p>
                  )}
                </div>

                {/* Options with correct/incorrect highlighting */}
                <div className="space-y-3 mb-6">
                  {current.options.map((option) => {
                    const isCorrect = option.label === current.correctAnswer;
                    const isSelected = option.label === current.userAnswer;
                    let stateClass = "border-border";
                    if (isCorrect) stateClass = "border-green-500 bg-green-50 dark:bg-green-950/30";
                    else if (isSelected && !isCorrect) stateClass = "border-red-500 bg-red-50 dark:bg-red-950/30";

                    return (
                      <div key={option.label} className={`p-4 rounded-xl border-2 ${stateClass}`}>
                        <span className="font-medium mr-3">{option.label}.</span>
                        <span>{option.text}</span>
                        {isCorrect && <CheckCircle className="w-4 h-4 text-green-600 inline ml-2" />}
                        {isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-600 inline ml-2" />}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                {current.explanation && (
                  <div className="p-4 bg-foreground/5 rounded-xl">
                    <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2">Explanation</p>
                    <p className="text-sm leading-relaxed">{current.explanation}</p>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-card border border-border rounded-2xl p-4 sticky top-20">
                <h3 className="font-medium text-sm mb-3">Progress</h3>
                <div className="text-xs text-muted mb-3">
                  {currentIndex + 1} of {filtered.length}
                </div>
                <div className="w-full h-2 bg-foreground/5 rounded-full overflow-hidden mb-4">
                  <div
                    className="h-full bg-accent transition-all"
                    style={{ width: `${((currentIndex + 1) / filtered.length) * 100}%` }}
                  />
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted">Correct</span>
                    <span className="text-green-600 font-medium">{reviews.filter((r) => r.isCorrect).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Wrong</span>
                    <span className="text-red-600 font-medium">{reviews.filter((r) => !r.isCorrect && !r.isUnattempted).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Unattempted</span>
                    <span className="text-muted font-medium">{reviews.filter((r) => r.isUnattempted).length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={goPrev}
              disabled={currentIndex === 0}
              className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl text-sm disabled:opacity-30 hover:border-foreground/20 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <span className="text-xs text-muted">
              {currentIndex + 1} / {filtered.length}
            </span>
            <button
              onClick={goNext}
              disabled={currentIndex === filtered.length - 1}
              className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl text-sm disabled:opacity-30 hover:border-foreground/20 transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
