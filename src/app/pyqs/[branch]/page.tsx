/**
 * Branch Page — /pyqs/[branch]
 *
 * Shows subjects for a selected branch.
 * If ?subject= is present, shows the practice session.
 *
 * FIX: Uses usePathname() instead of use(params) to avoid hydration mismatch.
 */

"use client";

import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { BookOpen, Lock, Star, ArrowLeft, ChevronRight } from "@/components/pyq/PYQIcons";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SubjectPracticeSession from "./_components/SubjectPracticeSession";

interface SubjectRef {
  id: string;
  subjectName: string;
  displayName: string;
  displayOrder: number;
  topicCount: number;
  questionCount: number;
  topics?: { topicName: string; displayName: string }[];
}

export default function BranchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { isPremium } = useAuth();

  // Extract branch from URL pathname: /pyqs/CS -> CS
  const branchFromUrl = pathname.replace("/pyqs/", "").split("?")[0].toUpperCase() || "CS";
  const subjectParam = searchParams.get("subject") || "";

  const [mounted, setMounted] = useState(false);
  const [subjects, setSubjects] = useState<SubjectRef[]>([]);
  const [loading, setLoading] = useState(true);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load subjects
  useEffect(() => {
    if (!mounted) return;
    setLoading(true);
    fetch(`/api/pyq/branches/${branchFromUrl}/subjects`)
      .then((r) => r.json())
      .then((data) => {
        if (data.subjects) setSubjects(data.subjects);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [branchFromUrl, mounted]);

  const branchMeta: Record<string, { name: string; icon: string }> = {
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

  const meta = branchMeta[branchFromUrl] || { name: branchFromUrl, icon: "📚" };

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <main className="min-h-screen bg-background">
        <Nav />
        <div className="pt-24 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-muted">Loading…</p>
          </div>
        </div>
      </main>
    );
  }

  // If subject is selected, show practice session (needs Suspense for useSearchParams)
  if (subjectParam) {
    return (
      <Suspense fallback={
        <main className="min-h-screen bg-background">
          <Nav />
          <div className="pt-24 flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-muted">Loading practice session…</p>
            </div>
          </div>
          <Footer />
        </main>
      }>
        <SubjectPracticeSession branch={branchFromUrl} subject={subjectParam} />
      </Suspense>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Nav />

      {/* Header */}
      <div className="sticky top-16 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center">
          <button onClick={() => router.push("/pyqs")} className="text-xs text-muted hover:text-foreground transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            All Branches
          </button>
          <span className="text-muted/30 mx-3">/</span>
          <span className="text-sm font-medium flex items-center gap-2">
            <span>{meta.icon}</span>
            <span className="font-mono">{branchFromUrl}</span>
          </span>
        </div>
      </div>

      <section className="pt-12 pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="text-4xl mb-4">{meta.icon}</div>
            <h1 className="font-serif text-3xl md:text-4xl mb-2">
              {meta.name}
            </h1>
            <p className="text-muted text-sm">
              GATE PYQs across all years · Choose a subject to begin
            </p>
          </motion.div>

          {/* Premium promo */}
          {!isPremium && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-10 p-5 bg-gradient-to-r from-accent/10 to-amber-500/5 border border-accent/20 rounded-2xl"
            >
              <div className="flex items-start gap-4">
                <div className="p-2 bg-accent/10 rounded-xl">
                  <Star className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-1">Unlock Topic-wise Practice</h3>
                  <p className="text-muted text-xs mb-3">
                    Filter questions by topic, access heatmaps, trend analysis, and smart practice sets.
                  </p>
                  <button
                    onClick={() => router.push("/pricing")}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-hover"
                  >
                    <Lock className="w-3 h-3" />
                    Upgrade to Premium
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Subjects grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-2xl p-6 animate-pulse">
                  <div className="h-5 bg-foreground/5 rounded w-3/4 mb-3" />
                  <div className="h-4 bg-foreground/5 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {subjects.map((subject, index) => (
                <motion.button
                  key={subject.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => router.push(`/pyqs/${branchFromUrl}?subject=${encodeURIComponent(subject.displayName)}`)}
                  className="group relative bg-card border border-border rounded-2xl p-6 text-left
                    hover:border-foreground/20 hover:shadow-lg hover:shadow-black/5
                    transition-all duration-300"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="w-4 h-4 text-accent" />
                        <h3 className="font-semibold text-sm group-hover:text-accent transition-colors">
                          {subject.displayName}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted">
                        <span>{subject.questionCount?.toLocaleString() || "?"} questions</span>
                        <span>·</span>
                        <span>{subject.topicCount || subject.topics?.length || 0} topics</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted group-hover:text-foreground group-hover:translate-x-0.5 transition-all mt-1" />
                  </div>

                  {/* Topic preview for premium */}
                  {isPremium && subject.topics && subject.topics.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex flex-wrap gap-1.5">
                        {subject.topics.slice(0, 4).map((t) => (
                          <span key={t.topicName} className="text-[10px] px-2 py-1 bg-foreground/5 rounded-md text-muted">
                            {t.displayName || t.topicName}
                          </span>
                        ))}
                        {subject.topics.length > 4 && (
                          <span className="text-[10px] px-2 py-1 text-muted">+{subject.topics.length - 4} more</span>
                        )}
                      </div>
                    </div>
                  )}
                </motion.button>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
