/**
 * Revision Tracker — /revision
 *
 * Smart spaced repetition revision system for PYQ bookmarks.
 * Uses SM-2 algorithm for optimal review scheduling.
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  Calendar,
  TrendingUp,
  Flame,
  Lock,
  Sparkles,
  ChevronRight,
} from "@/components/pyq/PYQIcons";

type BookmarkedQuestion = {
  id: string;
  questionId: string;
  note?: string;
  createdAt: string;
  question: {
    id: string;
    questionId: string;
    branchCode: string;
    year: number;
    questionNumber: number;
    subjectName: string;
    topicName: string;
    questionText: string;
    options: string[];
    correctAnswer: string;
    marks: number;
    questionType: string;
  };
};

type RevisionCard = {
  question: BookmarkedQuestion["question"];
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: string;
  lastReview?: string;
};

export default function RevisionTrackerPage() {
  const router = useRouter();
  const { isPremium, user, loading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [bookmarks, setBookmarks] = useState<BookmarkedQuestion[]>([]);
  const [revisionQueue, setRevisionQueue] = useState<RevisionCard[]>([]);
  const [dueToday, setDueToday] = useState<RevisionCard[]>([]);
  const [stats, setStats] = useState({ total: 0, due: 0, mastered: 0, streak: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"due" | "all" | "mastered">("due");
  const [currentCard, setCurrentCard] = useState<RevisionCard | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [quality, setQuality] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !user?.id) { setLoading(false); return; }

    fetch("/api/pyq/bookmarks")
      .then((r) => r.json())
      .then((data) => {
        if (data.bookmarks) {
          const valid = data.bookmarks.filter((b: any) => b.question);
          setBookmarks(valid);

          // Convert bookmarks to revision cards with SM-2 algorithm
          const cards: RevisionCard[] = valid.map((b: any) => ({
            question: b.question,
            easeFactor: 2.5,
            interval: 1,
            repetitions: 0,
            nextReview: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          }));
          setRevisionQueue(cards);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [mounted, user?.id]);

  // Calculate stats
  useEffect(() => {
    const now = new Date();
    const due = revisionQueue.filter((c) => new Date(c.nextReview) <= now);
    const mastered = revisionQueue.filter((c) => c.repetitions >= 5);
    setDueToday(due);
    setStats({
      total: revisionQueue.length,
      due: due.length,
      mastered: mastered.length,
      streak: 0, // Would calculate from revision history
    });
  }, [revisionQueue]);

  // SM-2 Algorithm: calculate next review based on quality (0-5)
  const calculateNextReview = (card: RevisionCard, quality: number): RevisionCard => {
    let { easeFactor, interval, repetitions } = card;

    if (quality >= 3) {
      // Correct response
      if (repetitions === 0) interval = 1;
      else if (repetitions === 1) interval = 6;
      else interval = Math.round(interval * easeFactor);

      repetitions += 1;
    } else {
      // Incorrect response — reset
      repetitions = 0;
      interval = 1;
    }

    // Adjust ease factor
    easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);

    return {
      ...card,
      easeFactor: Math.round(easeFactor * 100) / 100,
      interval,
      repetitions,
      nextReview: nextReview.toISOString(),
      lastReview: new Date().toISOString(),
    };
  };

  const handleReview = (card: RevisionCard, q: number) => {
    if (q === null) return;
    const updated = calculateNextReview(card, q);
    setRevisionQueue((prev) =>
      prev.map((c) => (c.question.id === card.question.id ? updated : c))
    );
    setQuality(null);
    setShowAnswer(false);
    setCurrentCard(null);
  };

  const startReview = (card: RevisionCard) => {
    setCurrentCard(card);
    setShowAnswer(false);
    setQuality(null);
  };

  if (!mounted || authLoading) {
    return (
      <main className="min-h-screen bg-background">
        <Nav />
        <div className="pt-24 flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted">Loading…</p>
        </div>
        <Footer />
      </main>
    );
  }

  // Card view
  if (currentCard) {
    const q = currentCard.question;
    return (
      <main className="min-h-screen bg-background">
        <Nav />

        <section className="pt-24 pb-16 px-4">
          <div className="max-w-2xl mx-auto">
            {/* Progress */}
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => setCurrentCard(null)} className="text-xs text-muted hover:text-foreground">
                ← Exit Review
              </button>
              <div className="text-xs text-muted">
                Card {revisionQueue.findIndex((c) => c.question.id === currentCard.question.id) + 1} of {revisionQueue.length}
              </div>
            </div>

            {/* Card */}
            <motion.div
              key={currentCard.question.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card border border-border rounded-2xl p-6 md:p-10"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs text-muted font-mono">
                  {q.branchCode} · {q.year} · Q{q.questionNumber}
                </span>
                <span className="text-xs px-2 py-1 bg-foreground/5 rounded-md text-muted">
                  {q.subjectName}
                </span>
              </div>

              <div className="mb-6">
                <p className="text-base leading-relaxed">{q.questionText}</p>
              </div>

              {showAnswer && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl"
                >
                  <p className="text-xs font-medium text-green-600 mb-1">Correct Answer</p>
                  <p className="text-sm font-mono font-medium">
                    {q.correctAnswer}. {q.options[0]}
                  </p>
                </motion.div>
              )}

              {/* Actions */}
              {!showAnswer ? (
                <button
                  onClick={() => setShowAnswer(true)}
                  className="mt-6 px-6 py-3 bg-foreground text-background rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Show Answer
                </button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6"
                >
                  <p className="text-sm text-muted mb-3">How well did you know this?</p>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {[
                      { value: 1, label: "Forgot", color: "bg-red-500 hover:bg-red-600" },
                      { value: 2, label: "Hard", color: "bg-orange-500 hover:bg-orange-600" },
                      { value: 3, label: "Okay", color: "bg-amber-500 hover:bg-amber-600" },
                      { value: 4, label: "Good", color: "bg-green-500 hover:bg-green-600" },
                      { value: 5, label: "Easy", color: "bg-emerald-500 hover:bg-emerald-600" },
                    ].map((q) => (
                      <button
                        key={q.value}
                        onClick={() => handleReview(currentCard, q.value)}
                        className={`py-2.5 ${q.color} text-white rounded-xl text-xs font-medium transition-colors`}
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        </section>

        <Footer />
      </main>
    );
  }

  // Main revision dashboard
  return (
    <main className="min-h-screen bg-background">
      <Nav />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-xs font-medium tracking-wider uppercase">
              <RotateCcw className="w-4 h-4" />
              Smart Revision
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-serif text-4xl sm:text-5xl leading-[1.08] tracking-tight mb-6"
          >
            Never Forget.<br />
            <span className="text-accent">Revise Smarter.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted max-w-xl mx-auto mb-10 text-sm md:text-base"
          >
            Spaced repetition powered by the SM-2 algorithm. Your bookmarked PYQs,
            scheduled for optimal memory retention.
          </motion.p>
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Bookmarked", value: stats.total.toString(), icon: BookOpen },
              { label: "Due Today", value: stats.due.toString(), icon: Clock, highlight: stats.due > 0 },
              { label: "Mastered", value: stats.mastered.toString(), icon: CheckCircle },
              { label: "Streak", value: stats.streak.toString(), icon: Flame },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-2xl border text-center ${
                  stat.highlight
                    ? "bg-amber-500/10 border-amber-500/20"
                    : "bg-card border-border"
                }`}
              >
                <stat.icon className={`w-5 h-5 mx-auto mb-2 ${stat.highlight ? "text-amber-600" : "text-muted"}`} />
                <div className={`text-xl font-bold font-mono ${stat.highlight ? "text-amber-600" : ""}`}>
                  {stat.value}
                </div>
                <div className="text-xs text-muted mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Due Today — CTA */}
      {stats.due > 0 && (
        <section className="px-6 pb-12">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-accent/10 to-amber-500/5 border border-accent/20 rounded-2xl p-6 md:p-8"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-500/10 rounded-xl">
                    <Clock className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-1">{stats.due} cards due for review</h3>
                    <p className="text-xs text-muted">Review them now to keep your memory fresh.</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (dueToday.length > 0) startReview(dueToday[0]);
                  }}
                  className="px-6 py-3 bg-foreground text-background rounded-xl text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  Start Reviewing
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Tab Navigation */}
      <section className="px-6 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            {(["due", "all", "mastered"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-foreground text-background"
                    : "bg-card border border-border text-muted hover:text-foreground"
                }`}
              >
                {tab === "due" ? `Due (${dueToday.length})` : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Cards list */}
      <section className="px-6 pb-16">
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
                  <div className="h-4 bg-foreground/5 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-foreground/5 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : revisionQueue.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen className="w-12 h-12 text-muted mx-auto mb-4" />
              <p className="text-muted mb-2">No bookmarked questions yet.</p>
              <button
                onClick={() => router.push("/pyqs")}
                className="text-accent hover:underline text-sm"
              >
                Browse PYQs to start bookmarking
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {(activeTab === "due" ? dueToday : activeTab === "mastered"
                ? revisionQueue.filter((c) => c.repetitions >= 5)
                : revisionQueue
              ).map((card, index) => {
                const isDue = new Date(card.nextReview) <= new Date();
                return (
                  <motion.div
                    key={card.question.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`bg-card border rounded-xl p-4 ${
                      isDue
                        ? "border-amber-500/30"
                        : "border-border"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-muted font-mono">
                            {card.question.branchCode} · {card.question.year} · Q{card.question.questionNumber}
                          </span>
                          {isDue && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/10 text-amber-600 rounded-full">
                              Due
                            </span>
                          )}
                        </div>
                        <p className="text-sm truncate">{card.question.questionText}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted">
                          <span>{card.question.subjectName}</span>
                          <span>·</span>
                          <span>Repetitions: {card.repetitions}</span>
                          <span>·</span>
                          <span>Ease: {card.easeFactor.toFixed(2)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => startReview(card)}
                        className="px-4 py-2 bg-foreground text-background rounded-lg text-xs font-medium hover:opacity-90 transition-opacity flex-shrink-0"
                      >
                        Review
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Premium CTA */}
      {!isPremium && (
        <section className="px-6 pb-16">
          <div className="max-w-4xl mx-auto">
            <div className="relative bg-gradient-to-br from-accent/10 via-amber-500/5 to-transparent border border-accent/20 rounded-3xl p-8 md:p-12 text-center overflow-hidden">
              <Sparkles className="w-8 h-8 text-accent mx-auto mb-4" />
              <h3 className="font-serif text-2xl md:text-3xl mb-4">
                Unlock Unlimited Revision
              </h3>
              <p className="text-muted max-w-lg mx-auto mb-8 text-sm md:text-base">
                Get unlimited revision cards, advanced spaced repetition, and performance analytics
                with EduNeuro Premium.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <a
                  href="/pricing"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <Lock className="w-4 h-4" />
                  Upgrade to Premium
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      <Footer />
    </main>
  );
}
