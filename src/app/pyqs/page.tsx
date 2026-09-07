/**
 * PYQ Library Page — /pyqs
 *
 * The main entry point for the PYQ library experience.
 *
 * Flow:
 * 1. Show a compelling header
 * 2. Show branch selector (the primary navigation)
 * 3. Show subjects for selected branch
 * 4. Topic filter (premium-locked for free users)
 * 5. Quick stats
 * 6. Recent/missed/bookmarks shortcuts
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ChevronRight,
  Bookmark,
  Flame,
  TrendingUp,
  Lock,
  Activity,
  Sparkles,
  ArrowRight,
  GraduationCap,
  FileText,
  Target,
  Filter,
} from "@/components/pyq/PYQIcons";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { useAuth } from "@/lib/hooks/useAuth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PYQHeatmap from "@/components/pyq/PYQHeatmap";
import PYQTrends from "@/components/pyq/PYQTrends";
import PYQMistakeBank from "@/components/pyq/PYQMistakeBank";

type View = "library" | "practice" | "heatmap" | "trends" | "mistakes";
type BranchItem = { code: string; name: string; icon: string; questionCount: number; yearMin: number; yearMax: number };

export default function PYQLibraryPage() {
  const router = useRouter();
  const [view, setView] = useState<View>("library");
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [stats, setStats] = useState({ total: 0, branchCount: 0, yearMin: 2024, yearMax: 2024 });
  const { isPremium } = useAuth();

  useEffect(() => {
    fetch("/api/pyq/branches")
      .then((r) => r.json())
      .then((data) => {
        const mapped = (data.branches || []).map((b: any) => ({
          code: b.branchCode,
          name: b.displayName,
          icon: iconFor(b.branchCode),
          questionCount: b.questionCount,
          yearMin: b.yearMin,
          yearMax: b.yearMax,
        }));
        setBranches(mapped);
        const total = mapped.reduce((sum: number, b: any) => sum + (b.questionCount || 0), 0);
        const yMin = Math.min(...mapped.map((b: any) => b.yearMin).filter(Boolean));
        const yMax = Math.max(...mapped.map((b: any) => b.yearMax).filter(Boolean));
        setStats({ total, branchCount: mapped.length, yearMin: yMin, yearMax: yMax });
      })
      .catch(() => {});
  }, []);

  const quickActions = [
    { id: "practice" as View, label: "Quick Practice", icon: Target, desc: "Jump into questions", color: "text-accent" },
    { id: "heatmap" as View, label: "PYQ Heatmap", icon: Activity, desc: "Topic frequency analysis", color: "text-emerald-600 dark:text-emerald-400", premium: true },
    { id: "trends" as View, label: "Trend Analysis", icon: TrendingUp, desc: "What's been asked more", color: "text-blue-600 dark:text-blue-400", premium: true },
    { id: "mistakes" as View, label: "Mistake Bank", icon: Flame, desc: "Review wrong answers", color: "text-red-600 dark:text-red-400" },
  ];

  const colorFor = (code: string) => {
    const colors: Record<string, string> = {
      CS: "from-blue-500/20 to-cyan-500/20", EC: "from-purple-500/20 to-pink-500/20", EE: "from-amber-500/20 to-orange-500/20",
      ME: "from-green-500/20 to-emerald-500/20", CE: "from-yellow-500/20 to-amber-500/20", IN: "from-indigo-500/20 to-blue-500/20",
      PI: "from-red-500/20 to-pink-500/20", CH: "from-teal-500/20 to-cyan-500/20", BT: "from-emerald-500/20 to-green-500/20",
      MT: "from-orange-500/20 to-red-500/20", XE: "from-violet-500/20 to-purple-500/20", XL: "from-lime-500/20 to-green-500/20",
      TF: "from-pink-500/20 to-rose-500/20", PE: "from-slate-500/20 to-gray-500/20", EY: "from-green-500/20 to-emerald-500/20",
      MA: "from-sky-500/20 to-blue-500/20", AR: "from-stone-500/20 to-amber-500/20", AG: "from-lime-500/20 to-yellow-500/20",
      GG: "from-orange-500/20 to-yellow-500/20", PH: "from-indigo-500/20 to-violet-500/20",
    };
    return colors[code] || "from-gray-500/20 to-slate-500/20";
  };

  const iconFor = (code: string) => {
    const icons: Record<string, string> = {
      CS: "💻", EC: "📡", EE: "⚡", ME: "⚙️", CE: "🏗️", IN: "🔬", PI: "🏭", CH: "🧪",
      BT: "🧬", MT: "🔥", XE: "🔭", XL: "🧫", TF: "🧵", PE: "🛢️", EY: "🌿", MA: "📐",
      AR: "🏛️", AG: "🌾", GG: "🌍", PH: "⚛️",
    };
    return icons[code] || "📚";
  };

  if (selectedBranch && view === "library") {
    router.push(`/pyqs/${selectedBranch}`);
  }

  return (
    <main className="min-h-screen bg-background">
      <Nav />

      {/* ─── Hero ──────────────────────────────────────────────────────────── */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-xs font-medium tracking-wider uppercase">
              <FileText className="w-4 h-4" />
              Previous Year Questions
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-serif text-4xl sm:text-5xl md:text-6xl leading-[1.08] tracking-tight mb-6"
          >
            Master GATE with<br />
            <span className="text-accent">Every PYQ</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base md:text-lg text-muted leading-relaxed max-w-2xl mx-auto mb-10"
          >
            Practice real GATE questions. Filter by branch, subject, year, and topic.
            Learn from patterns that actually appeared in the exam.
          </motion.p>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-xl mx-auto relative mb-12"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
            <input
              type="text"
              placeholder="Search PYQs: deadlock, Bayes theorem, TCP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-card border border-border rounded-2xl text-sm md:text-base focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/10 transition-all"
            />
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap justify-center gap-8 md:gap-12 mb-16"
          >
            {[
              { label: "Total PYQs", value: stats.total.toLocaleString() + "+" },
              { label: "Branches", value: stats.branchCount.toString() },
              { label: "Years Covered", value: stats.yearMin === stats.yearMax ? `${stats.yearMin}` : `${stats.yearMin}–${stats.yearMax}` },
              { label: "Verified Answers", value: "Official Keys" },
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

      {/* ─── Quick Actions ─────────────────────────────────────────────────── */}
      <section className="px-6 pb-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={() => {
                  if (action.premium && !isPremium) {
                    window.location.href = "/pricing";
                    return;
                  }
                  setView(action.id);
                }}
                className="group relative bg-card border border-border rounded-2xl p-6 text-left hover:border-foreground/20 transition-all duration-300 hover:shadow-lg hover:shadow-black/5"
              >
                <action.icon className={`w-6 h-6 ${action.color} mb-3`} />
                <div className="font-medium text-sm mb-1">{action.label}</div>
                <div className="text-xs text-muted">{action.desc}</div>
                {action.premium && (
                  <span className="absolute top-3 right-3 text-[10px] px-2 py-0.5 bg-accent/10 text-accent rounded-full font-medium">
                    Premium
                  </span>
                )}
                <ArrowRight className="w-4 h-4 text-muted mt-3 group-hover:text-foreground group-hover:translate-x-1 transition-all" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Dynamic View Switcher ─────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {view === "heatmap" && (
          <motion.section
            key="heatmap"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="px-6 pb-16"
          >
            <div className="max-w-6xl mx-auto">
              <PYQHeatmap branch={selectedBranch ?? undefined} />
            </div>
          </motion.section>
        )}
        {view === "trends" && (
          <motion.section
            key="trends"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="px-6 pb-16"
          >
            <div className="max-w-6xl mx-auto">
              <PYQTrends branch={selectedBranch ?? undefined} />
            </div>
          </motion.section>
        )}
        {view === "mistakes" && (
          <motion.section
            key="mistakes"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="px-6 pb-16"
          >
            <div className="max-w-6xl mx-auto">
              <PYQMistakeBank />
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ─── Branch Selector ───────────────────────────────────────────────── */}
      <section className="px-6 pb-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-mono text-xs tracking-[0.2em] text-muted uppercase mb-8">
            Choose Your Branch
          </h2>

              {branches.map((branch) => (
                <button
                  key={branch.code}
                  onClick={() => {
                    setSelectedBranch(branch.code);
                    router.push(`/pyqs/${branch.code}`);
                  }}
                  className={`group relative bg-card border border-border rounded-2xl p-6 text-left
                    hover:border-foreground/20 hover:shadow-lg hover:shadow-black/5
                    transition-all duration-300 overflow-hidden`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${colorFor(branch.code)} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  <div className="relative">
                    <span className="text-3xl mb-3 block">{branch.icon}</span>
                    <div className="font-semibold text-sm mb-1">{branch.name}</div>
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <span className="font-mono">{branch.code}</span>
                      <span>·</span>
                      <span>{(branch.questionCount || 0).toLocaleString()} PYQs</span>
                    </div>
                  </div>
                </button>
              ))}
        </div>
      </section>

      {/* ─── Premium Features Promo ────────────────────────────────────────── */}
      {!isPremium && (
        <section className="px-6 pb-16">
          <div className="max-w-4xl mx-auto">
            <div className="relative bg-gradient-to-br from-accent/10 via-amber-500/5 to-transparent border border-accent/20 rounded-3xl p-8 md:p-12 text-center overflow-hidden">
              <Sparkles className="w-8 h-8 text-accent mx-auto mb-4" />
              <h3 className="font-serif text-2xl md:text-3xl mb-4">
                Unlock the Full PYQ Experience
              </h3>
              <p className="text-muted max-w-lg mx-auto mb-8 text-sm md:text-base">
                Get topic-wise filtering, heatmaps, trend analysis, smart practice,
                and personalized recommendations with EduNeuro Premium.
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
