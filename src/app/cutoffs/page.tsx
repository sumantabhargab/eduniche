/**
 * Cutoff Tracker — /cutoffs
 *
 * Previous year cutoff marks for all GATE branches with trend analysis.
 * Enhanced with: score vs cutoff widget, predicted cutoff, WhatsApp share.
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { useRouter } from "next/navigation";
import { shareOnWhatsApp } from "@/lib/share/whatsapp";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Award,
  Users,
  BarChart3,
  ChevronRight,
  Share2,
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

function ScoreVsCutoffWidget({ cutoffs, category }: { cutoffs: CutoffEntry[]; category: string }) {
  const [myScore, setMyScore] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("CS");
  const [result, setResult] = useState<{ qualifies: boolean[]; years: number[]; branches: string[] } | null>(null);

  const branches = Array.from(new Set(cutoffs.map((c) => c.branchCode))).sort();

  const handleCheck = () => {
    const score = parseFloat(myScore);
    if (isNaN(score)) return;

    const branchData = cutoffs
      .filter((c) => c.branchCode === selectedBranch)
      .sort((a, b) => b.year - a.year)
      .slice(0, 5);

    const qualifies = branchData.map((c) => {
      switch (category) {
        case "ob": return score >= c.obCutoff;
        case "sc": return score >= c.scCutoff;
        case "st": return score >= c.stCutoff;
        default: return score >= c.generalCutoff;
      }
    });

    setResult({
      qualifies,
      years: branchData.map((c) => c.year),
      branches: branchData.map((c) => c.category),
    });
  };

  const handleWhatsAppShare = () => {
    if (!result) return;
    const branchName = cutoffs.find(c => c.branchCode === selectedBranch)?.branchName || selectedBranch;
    const catLabel = category === "ob" ? "OBC" : category === "sc" ? "SC" : category === "st" ? "ST" : "General";
    const lines = result.qualifies.map((q, i) => `${result.years[i]}: ${q ? "✅ Qualified" : "❌ Not Qualified"}`).join("\n");
    const text =
      `📊 GATE Cutoff Analysis — ${branchName} (${catLabel})\n` +
      `My Expected Score: ${myScore}/100\n\n` +
      `${lines}\n\n` +
      `Check: padhaishuru.com/cutoffs`;
    shareOnWhatsApp(text);
  };

  return (
    <div className="bg-card border border-border rounded-3xl p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="w-5 h-5 text-accent" />
        <h3 className="font-semibold text-sm">My Score vs Cutoff</h3>
      </div>

      <div className="grid sm:grid-cols-[1fr_auto_1fr] gap-4 items-end">
        <div>
          <label className="block text-xs text-muted font-medium mb-2">Your Expected Score</label>
          <input
            type="number"
            min="0"
            max="100"
            value={myScore}
            onChange={(e) => setMyScore(e.target.value)}
            placeholder="e.g., 65"
            className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm font-mono focus:outline-none focus:border-accent/50"
          />
        </div>
        <div>
          <label className="block text-xs text-muted font-medium mb-2">Branch</label>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-accent/50"
          >
            {branches.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
        <div>
          <button
            onClick={handleCheck}
            disabled={!myScore}
            className="w-full py-3 bg-foreground text-background rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Check Qualifying Chances
          </button>
        </div>
      </div>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 pt-6 border-t border-border"
        >
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {result.years.map((year, i) => (
              <div
                key={year}
                className={`p-4 rounded-2xl text-center ${
                  result.qualifies[i]
                    ? "bg-green-500/10 border border-green-500/20"
                    : "bg-red-500/10 border border-red-500/20"
                }`}
              >
                <div className="text-xs text-muted font-mono mb-1">{year}</div>
                <div className="text-xl mb-1">{result.qualifies[i] ? "✅" : "❌"}</div>
                <div className={`text-xs font-medium ${result.qualifies[i] ? "text-green-600" : "text-red-600"}`}>
                  {result.qualifies[i] ? "Qualified" : "Not Qualified"}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleWhatsAppShare}
            className="mt-4 w-full py-2.5 bg-[#25D366] text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share Analysis on WhatsApp
          </button>
        </motion.div>
      )}
    </div>
  );
}

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

  // Group by year, take latest per branch — category-aware sorting
  const latestByBranch = new Map<string, CutoffEntry>();
  for (const c of cutoffs) {
    const existing = latestByBranch.get(c.branchCode);
    if (!existing || c.year > existing.year) {
      latestByBranch.set(c.branchCode, c);
    }
  }
  const getCuttoffForCategory = (c: CutoffEntry) => {
    switch (selectedCategory) {
      case "ob": return c.obCutoff;
      case "sc": return c.scCutoff;
      case "st": return c.stCutoff;
      default: return c.generalCutoff;
    }
  };
  const latestCutoffs = Array.from(latestByBranch.values()).sort((a, b) => getCuttoffForCategory(b) - getCuttoffForCategory(a));

  // Calculate trend using category-specific cutoff
  const getTrend = (branchCode: string) => {
    const branchData = cutoffs
      .filter((c) => c.branchCode === branchCode)
      .sort((a, b) => a.year - b.year);
    if (branchData.length < 2) return null;
    const latest = getCuttoffForCategory(branchData[branchData.length - 1]);
    const previous = getCuttoffForCategory(branchData[branchData.length - 2]);
    const diff = latest - previous;
    return { diff, percentage: previous > 0 ? ((diff / previous) * 100).toFixed(1) : "0" };
  };

  // Predicted cutoff for next year using linear regression
  const getPredictedCutoff = (branchCode: string) => {
    const branchData = cutoffs
      .filter((c) => c.branchCode === branchCode)
      .sort((a, b) => a.year - b.year)
      .slice(-3);
    if (branchData.length < 2) return null;
    const values = branchData.map((c) => getCuttoffForCategory(c));
    const avgChange = (values[values.length - 1] - values[0]) / (branchData.length - 1);
    const lastValue = values[values.length - 1];
    return Math.round((lastValue + avgChange) * 10) / 10;
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

      {/* My Score vs Cutoff */}
      <section className="px-6 pb-8">
        <div className="max-w-6xl mx-auto">
          <ScoreVsCutoffWidget cutoffs={cutoffs} category={selectedCategory} />
        </div>
      </section>

      {/* Category selector */}
      <section className="px-6 pb-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-muted font-medium mr-2">Category:</span>
            {[
              { value: "general", label: "General" },
              { value: "ob", label: "OBC-NCL" },
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
            <h2 className="font-semibold text-sm">Latest Cutoff Marks (GATE 2024) — {selectedCategory === "ob" ? "OBC-NCL" : selectedCategory === "sc" ? "SC" : selectedCategory === "st" ? "ST" : "General"}</h2>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-foreground/5">
                    <th className="text-left p-4 text-xs text-muted font-medium">Branch</th>
                    <th className="text-center p-4 text-xs text-muted font-medium">Cutoff</th>
                    <th className="text-center p-4 text-xs text-muted font-medium">Predicted 2025</th>
                    <th className="text-center p-4 text-xs text-muted font-medium">Trend</th>
                    <th className="text-center p-4 text-xs text-muted font-medium">Applicants</th>
                    <th className="text-center p-4 text-xs text-muted font-medium">Qualified</th>
                    <th className="text-center p-4 text-xs text-muted font-medium">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {latestCutoffs.map((c, i) => {
                    const trend = getTrend(c.branchCode);
                    const predicted = getPredictedCutoff(c.branchCode);
                    const cutoff = getCuttoffForCategory(c);
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
                          <span className="text-lg font-bold font-mono">{cutoff.toFixed(1)}</span>
                          <span className="text-xs text-muted">/ {c.maxMarks}</span>
                        </td>
                        <td className="text-center p-4">
                          {predicted !== null ? (
                            <span className="text-sm font-mono text-accent">{predicted.toFixed(1)}</span>
                          ) : (
                            <span className="text-xs text-muted">—</span>
                          )}
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
                const values = branchData.map((c) => getCuttoffForCategory(c));
                const maxVal = Math.max(...values);
                const minVal = Math.min(...values);
                const predicted = getPredictedCutoff(selectedBranch);

                return (
                  <>
                    <h3 className="font-medium text-sm mb-6">{branchName} — {selectedCategory === "ob" ? "OBC-NCL" : selectedCategory === "sc" ? "SC" : selectedCategory === "st" ? "ST" : "General"} Cutoff Trend (2020–2024)</h3>
                    <div className="space-y-4">
                      {branchData.map((c) => {
                        const val = getCuttoffForCategory(c);
                        return (
                          <div key={c.year} className="flex items-center gap-4">
                            <span className="text-xs font-mono text-muted w-12">{c.year}</span>
                            <div className="flex-1 h-8 bg-foreground/5 rounded-lg overflow-hidden relative">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(val / maxVal) * 100}%` }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="h-full bg-accent/80 rounded-lg"
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-mono font-medium">
                                {val.toFixed(1)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {predicted !== null && (
                      <div className="mt-4 p-4 bg-accent/5 border border-accent/10 rounded-xl">
                        <div className="text-xs text-muted mb-1">Predicted Cutoff for 2025</div>
                        <div className="text-xl font-bold font-mono text-accent">{predicted.toFixed(1)} / 100</div>
                        <div className="text-xs text-muted mt-1">Based on linear trend from 2020–2024</div>
                      </div>
                    )}

                    <div className="mt-6 pt-6 border-t border-border grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-xs text-muted mb-1">Highest</div>
                        <div className="text-lg font-bold font-mono text-green-600">{maxVal.toFixed(1)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted mb-1">Lowest</div>
                        <div className="text-lg font-bold font-mono text-red-600">{minVal.toFixed(1)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted mb-1">Average</div>
                        <div className="text-lg font-bold font-mono">
                          {(values.reduce((s, v) => s + v, 0) / values.length).toFixed(1)}
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
