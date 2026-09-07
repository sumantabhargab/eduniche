/**
 * Mock Tests Page — /mock-tests
 *
 * Premium mock test library for GATE preparation.
 * Students can browse, start, and review mock tests.
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Clock,
  Trophy,
  Lock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Award,
  BarChart3,
  ChevronRight,
  Sparkles,
} from "@/components/pyq/PYQIcons";

type MockTest = {
  id: string;
  branch: string;
  branchCode: string;
  branchName: string;
  mockNumber: number;
  title: string;
  questionCount: number;
  maximumMarks: number;
  durationMinutes: number;
  subjectDistribution: Array<{ subject: string; count: number }>;
  difficultyDistribution: { easy: number; moderate: number; hard: number };
  generationBasis: string;
  accessTier: "free" | "premium";
  visibility: string;
  createdAt: string;
};

type AttemptResult = {
  mockTestId: string;
  score: number;
  totalMarks: number;
  correctCount: number;
  wrongCount: number;
  unattemptedCount: number;
  rank?: number;
  percentile?: number;
  completedAt: string;
};

export default function MockTestsPage() {
  const router = useRouter();
  const { isPremium, user, loading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [tests, setTests] = useState<MockTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [attempts, setAttempts] = useState<AttemptResult[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    fetch("/api/mock-tests")
      .then((r) => r.json())
      .then((data) => {
        if (data.tests) setTests(data.tests);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    if (user?.id) {
      fetch("/api/mock-tests/attempts")
        .then((r) => r.json())
        .then((data) => {
          if (data.attempts) setAttempts(data.attempts);
        })
        .catch(() => {});
    }
  }, [mounted, user?.id]);

  if (!mounted || authLoading) {
    return (
      <main className="min-h-screen bg-background">
        <Nav />
        <div className="pt-24 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-muted">Loading Mock Tests…</p>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  const branches = Array.from(new Set(tests.map((t) => t.branchCode))).sort();
  const filteredTests = selectedBranch === "all"
    ? tests
    : tests.filter((t) => t.branchCode === selectedBranch);

  const getAttempt = (testId: string) => attempts.find((a) => a.mockTestId === testId);

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
              <FileText className="w-4 h-4" />
              Mock Test Series
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-serif text-4xl sm:text-5xl md:text-6xl leading-[1.08] tracking-tight mb-6"
          >
            Test Yourself.<br />
            <span className="text-accent">Beat the Exam.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base md:text-lg text-muted leading-relaxed max-w-2xl mx-auto mb-10"
          >
            Full-length GATE mock tests across all branches. Simulate real exam conditions,
            track your performance, and identify weak areas before the actual exam.
          </motion.p>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-8 md:gap-12 mb-12"
          >
            {[
              { label: "Mock Tests", value: tests.length.toString() + "+" },
              { label: "Branches", value: branches.length.toString() },
              { label: "Questions Each", value: "65" },
              { label: "Exam Duration", value: "3 Hours" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl md:text-3xl font-bold font-mono tracking-tight">
                  {stat.value}
                </div>
                <div className="text-xs text-muted mt-1 uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Branch Filter */}
      <section className="px-6 pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedBranch("all")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedBranch === "all"
                  ? "bg-foreground text-background"
                  : "bg-card border border-border text-muted hover:text-foreground hover:border-foreground/20"
              }`}
            >
              All Branches
            </button>
            {branches.map((branch) => (
              <button
                key={branch}
                onClick={() => setSelectedBranch(branch)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedBranch === branch
                    ? "bg-foreground text-background"
                    : "bg-card border border-border text-muted hover:text-foreground hover:border-foreground/20"
                }`}
              >
                {branch}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Mock Tests Grid */}
      <section className="px-6 pb-16">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-2xl p-6 animate-pulse">
                  <div className="h-6 bg-foreground/5 rounded w-3/4 mb-4" />
                  <div className="h-4 bg-foreground/5 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredTests.length === 0 ? (
            <div className="text-center py-20">
              <FileText className="w-12 h-12 text-muted mx-auto mb-4" />
              <p className="text-muted">No mock tests available yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTests.map((test, index) => {
                const attempt = getAttempt(test.id);
                const isLocked = test.accessTier === "premium" && !isPremium;

                return (
                  <motion.div
                    key={test.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`group relative bg-card border rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-black/5 ${
                      isLocked ? "border-border opacity-75" : "border-border hover:border-foreground/20"
                    }`}
                  >
                    {/* Premium badge */}
                    {isLocked && (
                      <div className="absolute top-4 right-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium rounded-full border border-amber-500/20">
                          <Lock className="w-3 h-3" />
                          Premium
                        </span>
                      </div>
                    )}

                    {/* Attempt result badge */}
                    {attempt && !isLocked && (
                      <div className="absolute top-4 right-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${
                          (attempt.score / attempt.totalMarks) >= 0.6
                            ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20"
                            : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                        }`}>
                          {(attempt.score / attempt.totalMarks * 100).toFixed(0)}%
                        </span>
                      </div>
                    )}

                    <div className="mb-4">
                      <div className="text-xs text-muted font-mono mb-2">
                        {test.branchCode} · Mock #{test.mockNumber}
                      </div>
                      <h3 className="font-semibold text-sm mb-1">{test.title}</h3>
                      <p className="text-xs text-muted">{test.generationBasis}</p>
                    </div>

                    {/* Meta */}
                    <div className="flex flex-wrap gap-3 text-xs text-muted mb-4">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        {test.questionCount} Questions
                      </span>
                      <span className="flex items-center gap-1">
                        <Trophy className="w-3.5 h-3.5" />
                        {test.maximumMarks} Marks
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {test.durationMinutes} min
                      </span>
                    </div>

                    {/* Difficulty */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xs text-muted">Difficulty:</span>
                      <div className="flex-1 h-2 bg-foreground/5 rounded-full overflow-hidden flex">
                        <div
                          className="h-full bg-green-500"
                          style={{ width: `${test.difficultyDistribution.easy}%` }}
                          title={`Easy: ${test.difficultyDistribution.easy}%`}
                        />
                        <div
                          className="h-full bg-amber-500"
                          style={{ width: `${test.difficultyDistribution.moderate}%` }}
                          title={`Moderate: ${test.difficultyDistribution.moderate}%`}
                        />
                        <div
                          className="h-full bg-red-500"
                          style={{ width: `${test.difficultyDistribution.hard}%` }}
                          title={`Hard: ${test.difficultyDistribution.hard}%`}
                        />
                      </div>
                    </div>

                    {/* Subjects */}
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {test.subjectDistribution.slice(0, 5).map((s, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-1 bg-foreground/5 rounded-md text-muted"
                        >
                          {s.subject} ({s.count})
                        </span>
                      ))}
                      {test.subjectDistribution.length > 5 && (
                        <span className="text-[10px] px-2 py-1 text-muted">
                          +{test.subjectDistribution.length - 5} more
                        </span>
                      )}
                    </div>

                    {/* Action */}
                    {isLocked ? (
                      <button
                        onClick={() => router.push("/pricing")}
                        className="w-full py-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-xl text-sm font-medium hover:bg-amber-500/20 transition-colors flex items-center justify-center gap-2"
                      >
                        <Lock className="w-4 h-4" />
                        Upgrade to Access
                      </button>
                    ) : attempt ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => router.push(`/mock-tests/${test.id}/review`)}
                          className="flex-1 py-3 bg-foreground/5 text-foreground border border-border rounded-xl text-sm font-medium hover:bg-foreground/10 transition-colors flex items-center justify-center gap-2"
                        >
                          <BarChart3 className="w-4 h-4" />
                          Review
                        </button>
                        <button
                          onClick={() => router.push(`/mock-tests/${test.id}/start`)}
                          className="flex-1 py-3 bg-foreground text-background rounded-xl text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                        >
                          <Trophy className="w-4 h-4" />
                          Retake
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => router.push(`/mock-tests/${test.id}/start`)}
                        className="w-full py-3 bg-foreground text-background rounded-xl text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                      >
                        Start Test
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
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
                Unlock All Mock Tests
              </h3>
              <p className="text-muted max-w-lg mx-auto mb-8 text-sm md:text-base">
                Get unlimited access to all mock tests, detailed analytics, performance comparisons,
                and personalized insights with EduNeuro Premium.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <Lock className="w-4 h-4" />
                  Upgrade to Premium
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 px-6 py-3 border border-border rounded-xl text-sm font-medium hover:border-foreground/40 transition-colors"
                >
                  View Plans
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      <Footer />
    </main>
  );
}
