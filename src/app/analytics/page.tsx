/**
 * Performance Analytics — /analytics
 *
 * Comprehensive performance dashboard for GATE preparation.
 * Shows weak topics, progress over time, and personalized insights.
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  Flame,
  Clock,
  BookOpen,
  CheckCircle,
  Award,
  ChevronRight,
  Sparkles,
  Lock,
} from "@/components/pyq/PYQIcons";
import Link from "next/link";

type TopicPerformance = {
  topicName: string;
  subjectName: string;
  totalAttempts: number;
  correctCount: number;
  accuracy: number;
  averageTime: number;
  trend: "improving" | "stable" | "declining";
};

type PerformanceData = {
  overallAccuracy: number;
  totalAttempts: number;
  totalCorrect: number;
  totalTime: number;
  streakDays: number;
  weeklyProgress: Array<{ day: string; attempts: number; correct: number }>;
  weakTopics: TopicPerformance[];
  strongTopics: TopicPerformance[];
  branchBreakdown: Record<string, { attempts: number; accuracy: number }>;
};

export default function AnalyticsPage() {
  const router = useRouter();
  const { isPremium, user, loading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    if (user?.id) {
      fetch("/api/pyq/analytics/overview")
        .then((r) => r.json())
        .then((d) => {
          if (d.analytics) setData(d.analytics);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [mounted, user?.id]);

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

  // Generate sample data for demo
  const sampleData: PerformanceData = {
    overallAccuracy: 67.5,
    totalAttempts: 342,
    totalCorrect: 231,
    totalTime: 86400,
    streakDays: 7,
    weeklyProgress: [
      { day: "Mon", attempts: 25, correct: 18 },
      { day: "Tue", attempts: 32, correct: 22 },
      { day: "Wed", attempts: 28, correct: 19 },
      { day: "Thu", attempts: 35, correct: 24 },
      { day: "Fri", attempts: 30, correct: 20 },
      { day: "Sat", attempts: 45, correct: 32 },
      { day: "Sun", attempts: 40, correct: 28 },
    ],
    weakTopics: [
      { topicName: "Dynamic Programming", subjectName: "Algorithms", totalAttempts: 45, correctCount: 15, accuracy: 33.3, averageTime: 120, trend: "declining" },
      { topicName: "Turing Machines", subjectName: "TOC", totalAttempts: 30, correctCount: 12, accuracy: 40.0, averageTime: 90, trend: "stable" },
      { topicName: "Page Replacement", subjectName: "OS", totalAttempts: 38, correctCount: 17, accuracy: 44.7, averageTime: 75, trend: "improving" },
    ],
    strongTopics: [
      { topicName: "Graph Algorithms", subjectName: "Algorithms", totalAttempts: 52, correctCount: 45, accuracy: 86.5, averageTime: 60, trend: "stable" },
      { topicName: "SQL Queries", subjectName: "DBMS", totalAttempts: 40, correctCount: 35, accuracy: 87.5, averageTime: 45, trend: "improving" },
      { topicName: "Digital Logic", subjectName: "Digital Logic", totalAttempts: 48, correctCount: 42, accuracy: 87.5, averageTime: 50, trend: "stable" },
    ],
    branchBreakdown: {
      CS: { attempts: 200, accuracy: 70.0 },
      EC: { attempts: 80, accuracy: 65.0 },
      EE: { attempts: 62, accuracy: 62.0 },
    },
  };

  const displayData = data || sampleData;

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

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
              <BarChart3 className="w-4 h-4" />
              Performance Analytics
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-serif text-4xl sm:text-5xl leading-[1.08] tracking-tight mb-6"
          >
            Track Progress.<br />
            <span className="text-accent">Improve Faster.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted max-w-xl mx-auto mb-10 text-sm md:text-base"
          >
            Understand your strengths and weaknesses. Get AI-powered insights to focus on what matters most.
          </motion.p>
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 pb-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Accuracy", value: `${displayData.overallAccuracy.toFixed(1)}%`, icon: Target, color: "text-accent" },
              { label: "Attempts", value: displayData.totalAttempts.toString(), icon: BookOpen },
              { label: "Correct", value: displayData.totalCorrect.toString(), icon: CheckCircle, color: "text-green-600" },
              { label: "Study Time", value: formatTime(displayData.totalTime), icon: Clock },
              { label: "Streak", value: `${displayData.streakDays} days`, icon: Flame, color: "text-orange-600" },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-2xl p-4 text-center"
              >
                <stat.icon className={`w-5 h-5 mx-auto mb-2 ${stat.color || "text-muted"}`} />
                <div className="text-xl font-bold font-mono">{stat.value}</div>
                <div className="text-xs text-muted mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Weekly Progress */}
      <section className="px-6 pb-12">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl p-6 md:p-8"
          >
            <h2 className="font-semibold text-sm mb-6 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-accent" />
              Weekly Progress
            </h2>

            <div className="flex items-end justify-between gap-4 h-48">
              {displayData.weeklyProgress.map((day, i) => {
                const maxAttempts = Math.max(...displayData.weeklyProgress.map((d) => d.attempts));
                const accuracy = day.attempts > 0 ? (day.correct / day.attempts * 100) : 0;
                return (
                  <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                    <div className="text-xs text-muted font-mono mb-1">{accuracy.toFixed(0)}%</div>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(day.attempts / maxAttempts) * 100}%` }}
                      transition={{ duration: 0.8, delay: i * 0.1 }}
                      className="w-full bg-accent/80 rounded-t-lg min-h-[20px]"
                    />
                    <div className="text-xs text-muted mt-2">{day.day}</div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Weak vs Strong Topics */}
      <section className="px-6 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weak Topics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-2xl p-6"
            >
              <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-500" />
                Weak Topics
              </h3>
              <div className="space-y-4">
                {displayData.weakTopics.map((topic, i) => (
                  <div key={i} className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="text-sm font-medium">{topic.topicName}</div>
                        <div className="text-xs text-muted">{topic.subjectName}</div>
                      </div>
                      <span className="text-xs px-2 py-1 bg-red-500/10 text-red-600 rounded-full font-medium">
                        {topic.accuracy.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-foreground/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500 rounded-full"
                        style={{ width: `${topic.accuracy}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-muted">
                      <span>{topic.totalAttempts} attempts</span>
                      <span className="capitalize">{topic.trend}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Strong Topics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-2xl p-6"
            >
              <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                Strong Topics
              </h3>
              <div className="space-y-4">
                {displayData.strongTopics.map((topic, i) => (
                  <div key={i} className="p-4 bg-green-500/5 border border-green-500/10 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="text-sm font-medium">{topic.topicName}</div>
                        <div className="text-xs text-muted">{topic.subjectName}</div>
                      </div>
                      <span className="text-xs px-2 py-1 bg-green-500/10 text-green-600 rounded-full font-medium">
                        {topic.accuracy.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-foreground/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${topic.accuracy}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-muted">
                      <span>{topic.totalAttempts} attempts</span>
                      <span className="capitalize">{topic.trend}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Premium CTA */}
      {!isPremium && (
        <section className="px-6 pb-16">
          <div className="max-w-4xl mx-auto">
            <div className="relative bg-gradient-to-br from-accent/10 via-amber-500/5 to-transparent border border-accent/20 rounded-3xl p-8 md:p-12 text-center overflow-hidden">
              <Sparkles className="w-8 h-8 text-accent mx-auto mb-4" />
              <h3 className="font-serif text-2xl md:text-3xl mb-4">
                Unlock Advanced Analytics
              </h3>
              <p className="text-muted max-w-lg mx-auto mb-8 text-sm md:text-base">
                Get AIR prediction, personalized study recommendations, topic heatmaps,
                and AI-powered insights with EduNeuro Premium.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <Lock className="w-4 h-4" />
                  Upgrade to Premium
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
