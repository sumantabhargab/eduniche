/**
 * Cutoff Tracker — /cutoffs
 *
 * Previous year cutoff marks for all GATE branches with trend analysis.
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Award,
  Users,
  BarChart3,
  ChevronRight,
} from "@/components/pyq/PYQIcons";

type CutoffEntry = {
  year: number;
  branchCode: string;
  branchName: string;
  generalCutoff: number;
  obCutoff: number;
  scCutoff: number;
  stCutoff: number;
  totalApplicants: number;
  totalQualified: number;
  qualifyingRate: number;
  maxMarks: number;
  cutoff: number;
  category: string;
};

export default function CutoffsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [cutoffs, setCutoffs] = useState<CutoffEntry[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState("general");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    fetch("/api/cutoffs")
      .then((r) => r.json())
      .then((data) => {
        if (data.cutoffs) setCutoffs(data.cutoffs);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const branches = Array.from(new Set(cutoffs.map((c) => c.branchCode))).sort();

  const filtered = cutoffs.filter((c) => {
    if (selectedBranch !== "all" && c.branchCode !== selectedBranch) return false;
    return true;
  });

  // Group by year, take latest per branch
  const latestByBranch = new Map<string, CutoffEntry>();
  for (const c of cutoffs) {
    const existing = latestByBranch.get(c.branchCode);
    if (!existing || c.year > existing.year) {
      latestByBranch.set(c.branchCode, c);
    }
  }
  const latestCutoffs = Array.from(latestByBranch.values()).sort((a, b) => b.generalCutoff - a.generalCutoff);

  // Calculate trend
  const getTrend = (branchCode: string) => {
    const branchData = cutoffs
      .filter((c) => c.branchCode === branchCode)
      .sort((a, b) => a.year - b.year);
    if (branchData.length < 2) return null;
    const latest = branchData[branchData.length - 1].generalCutoff;
    const previous = branchData[branchData.length - 2].generalCutoff;
    const diff = latest - previous;
    return { diff, percentage: ((diff / previous) * 100).toFixed(1) };
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
              <Award className="w-4 h-4" />
              Cutoff Tracker
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-serif text-4xl sm:text-5xl leading-[1.08] tracking-tight mb-6"
          >
            Know the Cutoff.<br />
            <span className="text-accent">Set Your Target.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted max-w-xl mx-auto mb-10 text-sm md:text-base"
          >
            Previous year cutoff marks across all GATE branches. Track trends, set realistic targets, and plan your preparation accordingly.
          </motion.p>
        </div>
      </section>

      {/* Category selector */}
      <section className="px-6 pb-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-muted font-medium mr-2">Category:</span>
            {[
              { value: "general", label: "General" },
              { value: "ob", label: "OBC" },
              { value: "sc", label: "SC" },
              { value: "st", label: "ST" },
            ].map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  selectedCategory === cat.value
                    ? "bg-foreground text-background"
                    : "bg-card border border-border text-muted hover:text-foreground"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Latest cutoffs table */}
      <section className="px-6 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-5 h-5 text-muted" />
            <h2 className="font-semibold text-sm">Latest Cutoff Marks (GATE 2024)</h2>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-foreground/5">
                    <th className="text-left p-4 text-xs text-muted font-medium">Branch</th>
                    <th className="text-center p-4 text-xs text-muted font-medium">Cutoff</th>
                    <th className="text-center p-4 text-xs text-muted font-medium">Trend</th>
                    <th className="text-center p-4 text-xs text-muted font-medium">Applicants</th>
                    <th className="text-center p-4 text-xs text-muted font-medium">Qualified</th>
                    <th className="text-center p-4 text-xs text-muted font-medium">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {latestCutoffs.map((c, i) => {
                    const trend = getTrend(c.branchCode);
                    return (
                      <motion.tr
                        key={c.branchCode}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-b border-border last:border-0 hover:bg-foreground/5 transition-colors cursor-pointer"
                        onClick={() => router.push(`/cutoffs?branch=${c.branchCode}`)}
                      >
                        <td className="p-4">
                          <div>
                            <div className="font-medium text-sm">{c.branchName}</div>
                            <div className="text-xs text-muted font-mono">{c.branchCode}</div>
                          </div>
                        </td>
                        <td className="text-center p-4">
                          <span className="text-lg font-bold font-mono">{c.generalCutoff.toFixed(1)}</span>
                          <span className="text-xs text-muted">/ {c.maxMarks}</span>
                        </td>
                        <td className="text-center p-4">
                          {trend ? (
                            <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                              trend.diff > 0 ? "text-green-600" : trend.diff < 0 ? "text-red-600" : "text-muted"
                            }`}>
                              {trend.diff > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : trend.diff < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : null}
                              {trend.diff > 0 ? "+" : ""}{trend.diff.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-xs text-muted">—</span>
                          )}
                        </td>
                        <td className="text-center p-4 text-muted font-mono text-xs">
                          {c.totalApplicants.toLocaleString()}
                        </td>
                        <td className="text-center p-4 text-muted font-mono text-xs">
                          {c.totalQualified.toLocaleString()}
                        </td>
                        <td className="text-center p-4">
                          <span className="text-xs font-medium">{c.qualifyingRate.toFixed(1)}%</span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Year-wise trend */}
      <section className="px-6 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-5 h-5 text-muted" />
            <h2 className="font-semibold text-sm">Year-wise Trend</h2>
          </div>

          {selectedBranch !== "all" ? (
            <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
              {(() => {
                const branchData = cutoffs
                  .filter((c) => c.branchCode === selectedBranch)
                  .sort((a, b) => a.year - b.year);

                if (branchData.length === 0) {
                  return <p className="text-muted text-center py-8">No data available.</p>;
                }

                const branchName = branchData[0].branchName;
                const maxCutoff = Math.max(...branchData.map((c) => c.generalCutoff));
                const minCutoff = Math.min(...branchData.map((c) => c.generalCutoff));

                return (
                  <>
                    <h3 className="font-medium text-sm mb-6">{branchName} — Cutoff Trend (2020–2024)</h3>
                    <div className="space-y-4">
                      {branchData.map((c) => (
                        <div key={c.year} className="flex items-center gap-4">
                          <span className="text-xs font-mono text-muted w-12">{c.year}</span>
                          <div className="flex-1 h-8 bg-foreground/5 rounded-lg overflow-hidden relative">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(c.generalCutoff / maxCutoff) * 100}%` }}
                              transition={{ duration: 0.8, delay: 0.2 }}
                              className="h-full bg-accent/80 rounded-lg"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-mono font-medium">
                              {c.generalCutoff.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 pt-6 border-t border-border grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-xs text-muted mb-1">Highest</div>
                        <div className="text-lg font-bold font-mono text-green-600">{(maxCutoff).toFixed(1)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted mb-1">Lowest</div>
                        <div className="text-lg font-bold font-mono text-red-600">{(minCutoff).toFixed(1)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted mb-1">Average</div>
                        <div className="text-lg font-bold font-mono">
                          {(branchData.reduce((s, c) => s + c.generalCutoff, 0) / branchData.length).toFixed(1)}
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="w-8 h-8 text-muted mx-auto mb-3" />
              <p className="text-sm text-muted">Select a branch to view detailed cutoff trends.</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
