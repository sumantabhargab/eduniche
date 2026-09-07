/**
 * Mock Test Start — /mock-tests/[id]/start
 *
 * Pre-test screen: instructions, timer, branch/subject breakdown.
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import {
  FileText,
  Clock,
  Trophy,
  AlertCircle,
  ChevronRight,
  Play,
  BookOpen,
  Target,
} from "@/components/pyq/PYQIcons";

type MockTestMeta = {
  id: string;
  title: string;
  branch: string;
  branchCode: string;
  branchName: string;
  mockNumber: number;
  questionCount: number;
  maximumMarks: number;
  durationMinutes: number;
  subjectDistribution: Array<{ subject: string; count: number; marks: number }>;
  difficultyDistribution: { easy: number; moderate: number; hard: number };
  accessTier: string;
};

export default function MockTestStartPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [test, setTest] = useState<MockTestMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch(`/api/mock-tests/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.test) setTest(data.test);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  if (!mounted) {
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

  if (loading) {
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

  if (!test) {
    return (
      <main className="min-h-screen bg-background">
        <Nav />
        <div className="pt-24 text-center min-h-[60vh] flex items-center justify-center">
          <div>
            <p className="text-muted mb-4">Mock test not found.</p>
            <button onClick={() => router.push("/mock-tests")} className="text-accent hover:underline">
              Back to Mock Tests
            </button>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  const handleStart = () => {
    setStarting(true);
    router.push(`/mock-tests/${params.id}/take`);
  };

  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <main className="min-h-screen bg-background">
      <Nav />

      <section className="pt-32 pb-16 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="text-xs text-muted font-mono mb-3">
              {test.branchCode} · Mock #{test.mockNumber}
            </div>
            <h1 className="font-serif text-3xl md:text-4xl mb-4">{test.title}</h1>
            <p className="text-muted text-sm">
              {test.branchName} · {test.questionCount} Questions · {test.maximumMarks} Marks
            </p>
          </motion.div>

          {/* Instructions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-2xl p-6 md:p-8 mb-8"
          >
            <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-accent" />
              Before You Begin
            </h2>
            <ul className="space-y-3 text-sm text-muted">
              <li className="flex items-start gap-3">
                <Clock className="w-4 h-4 mt-0.5 text-muted flex-shrink-0" />
                <span>Duration: <strong className="text-foreground">{formatTime(test.durationMinutes)}</strong>. The timer starts immediately and cannot be paused.</span>
              </li>
              <li className="flex items-start gap-3">
                <FileText className="w-4 h-4 mt-0.5 text-muted flex-shrink-0" />
                <span><strong className="text-foreground">{test.questionCount} questions</strong> across {test.subjectDistribution.length} subjects.</span>
              </li>
              <li className="flex items-start gap-3">
                <Target className="w-4 h-4 mt-0.5 text-muted flex-shrink-0" />
                <span>Total marks: <strong className="text-foreground">{test.maximumMarks}</strong>. Negative marking applies.</span>
              </li>
              <li className="flex items-start gap-3">
                <BookOpen className="w-4 h-4 mt-0.5 text-muted flex-shrink-0" />
                <span>Questions include MCQ (single correct), MSQ (multiple correct), and NAT (numeric answer type).</span>
              </li>
              <li className="flex items-start gap-3">
                <Trophy className="w-4 h-4 mt-0.5 text-muted flex-shrink-0" />
                <span>Your score, rank, and detailed analysis will be shown after submission.</span>
              </li>
            </ul>
          </motion.div>

          {/* Subject Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-2xl p-6 md:p-8 mb-8"
          >
            <h2 className="font-semibold text-sm mb-4">Subject Distribution</h2>
            <div className="space-y-3">
              {test.subjectDistribution.map((s, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-sm">{s.subject}</span>
                  <div className="flex items-center gap-4 text-xs text-muted">
                    <span>{s.count} Qs</span>
                    <span className="font-mono">{s.marks} marks</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Difficulty Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card border border-border rounded-2xl p-6 md:p-8 mb-10"
          >
            <h2 className="font-semibold text-sm mb-4">Difficulty Mix</h2>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-3 bg-foreground/5 rounded-full overflow-hidden flex">
                <div className="h-full bg-green-500 transition-all" style={{ width: `${test.difficultyDistribution.easy}%` }} />
                <div className="h-full bg-amber-500 transition-all" style={{ width: `${test.difficultyDistribution.moderate}%` }} />
                <div className="h-full bg-red-500 transition-all" style={{ width: `${test.difficultyDistribution.hard}%` }} />
              </div>
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted">
              <span>Easy: {test.difficultyDistribution.easy}%</span>
              <span>Moderate: {test.difficultyDistribution.moderate}%</span>
              <span>Hard: {test.difficultyDistribution.hard}%</span>
            </div>
          </motion.div>

          {/* Start Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center"
          >
            <button
              onClick={handleStart}
              disabled={starting}
              className="inline-flex items-center gap-3 px-10 py-4 bg-foreground text-background rounded-2xl text-base font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {starting ? (
                <>
                  <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                  Preparing Test…
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Start Mock Test
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
            <p className="text-xs text-muted mt-4">
              Make sure you have a stable internet connection and enough time to complete the test.
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
