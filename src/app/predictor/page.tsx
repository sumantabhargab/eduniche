/**
 * AIR Predictor — /predictor
 *
 * Predicts All-India Rank based on expected marks, branch, and category.
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { shareOnWhatsApp } from "@/lib/share/whatsapp";
import {
  TrendingUp,
  Award,
  Share2,
  Calculator,
  ChevronRight,
} from "@/components/pyq/PYQIcons";

import { BRANCH_REGISTRY } from "@/lib/pyq/branches";

type PredictionResult = {
  predictedAIR: number;
  rangeLow: number;
  rangeHigh: number;
  qualifies: boolean;
  cutoff: number;
  message: string;
  branch: string;
  category: string;
  marks: number;
};

const BRANCHES = BRANCH_REGISTRY
  .filter((b) => b.active)
  .map((b) => ({ code: b.branchCode, name: b.displayName }));

const CATEGORIES = [
  { value: "general", label: "General", short: "Gen" },
  { value: "ob", label: "OBC-NCL", short: "OBC" },
  { value: "sc", label: "SC", short: "SC" },
  { value: "st", label: "ST", short: "ST" },
  { value: "pw_d", label: "PwD", short: "PwD" },
];

export default function AIRPredictorPage() {
  const [marks, setMarks] = useState("");
  const [branch, setBranch] = useState("CS");
  const [category, setCategory] = useState("general");
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePredict = async () => {
    const marksNum = parseFloat(marks);
    if (isNaN(marksNum) || marksNum < 0 || marksNum > 100) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        marks: String(marksNum),
        branch,
        category,
      });
      const res = await fetch(`/api/predictor/air?${params}`);
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
      }
    } catch (e) {
      console.error("[AIR] Prediction error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppShare = () => {
    if (!result) return;
    const text =
      `🎯 GATE ${result.branch} AIR Prediction\n` +
      `Score: ${result.marks}/100\n` +
      `Predicted AIR: ${result.rangeLow}–${result.rangeHigh}\n` +
      `${result.qualifies ? "✅ Likely to qualify!" : "⚠️ Needs improvement"}\n` +
      `\nCheck your prediction on PadhaiShuru → padhaishuru.com/predictor`;
    shareOnWhatsApp(text);
  };

  const getAIRColor = (air: number) => {
    if (air <= 500) return "text-success";
    if (air <= 1500) return "text-accent";
    if (air <= 5000) return "text-muted-light";
    return "text-error";
  };

  const getAIRLabel = (air: number) => {
    if (air <= 100) return "🏆 Elite";
    if (air <= 500) return "🎯 Top 500";
    if (air <= 1000) return "💪 Top 1000";
    if (air <= 5000) return "📈 Top 5000";
    return "📚 Keep Going";
  };

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

  return (
    <main className="min-h-screen bg-background">
      <Nav />

      <section className="pt-32 pb-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-xs font-medium tracking-wider uppercase">
              <Award className="w-4 h-4" />
              AIR Predictor
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-serif text-4xl sm:text-5xl leading-[1.08] tracking-tight mb-6"
          >
            Know Your Rank.<br />
            <span className="text-accent">Before Results.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted max-w-xl mx-auto mb-10 text-sm md:text-base"
          >
            Enter your expected marks and get a predicted All-India Rank based on
            historical GATE data. Category-wise predictions available.
          </motion.p>

          {/* Input Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card border border-border rounded-3xl p-6 sm:p-8 text-left space-y-5"
          >
            {/* Marks */}
            <div>
              <label className="block text-xs font-medium text-muted mb-2 uppercase tracking-wider">
                Expected Marks (0–100)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={marks}
                onChange={(e) => setMarks(e.target.value)}
                placeholder="e.g., 65"
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/10 transition-all font-mono"
              />
            </div>

            {/* Branch */}
            <div>
              <label className="block text-xs font-medium text-muted mb-2 uppercase tracking-wider">
                Branch
              </label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/10 transition-all"
              >
                {BRANCHES.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.code} — {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-muted mb-2 uppercase tracking-wider">
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setCategory(cat.value)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      category === cat.value
                        ? "bg-foreground text-background"
                        : "bg-background border border-border text-muted hover:text-foreground"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Predict Button */}
            <button
              onClick={handlePredict}
              disabled={!marks || loading}
              className="w-full py-3.5 bg-foreground text-background rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
              ) : (
                <>
                  <Calculator className="w-4 h-4" />
                  Predict My Rank
                </>
              )}
            </button>
          </motion.div>
        </div>
      </section>

      {/* Result */}
      {result && (
        <section className="px-6 pb-16">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="bg-card border border-border rounded-3xl p-6 sm:p-8"
            >
              {/* AIR Prediction */}
              <div className="text-center mb-8">
                <div className="text-xs text-muted font-medium uppercase tracking-wider mb-2">
                  Predicted AIR — GATE {result.branch} · {CATEGORIES.find(c => c.value === result.category)?.label}
                </div>
                <div className={`text-5xl sm:text-6xl font-bold font-mono ${getAIRColor(result.predictedAIR)}`}>
                  {result.rangeLow}–{result.rangeHigh}
                </div>
                <div className="text-sm text-muted mt-1">
                  Range: ±12% confidence interval
                </div>
                <div className={`text-lg font-medium mt-3 ${getAIRColor(result.predictedAIR)}`}>
                  {getAIRLabel(result.predictedAIR)}
                </div>
              </div>

              {/* Status */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className={`p-4 rounded-2xl text-center ${result.qualifies ? "bg-green-500/10 border border-green-500/20" : "bg-red-500/10 border border-red-500/20"}`}>
                  <div className="text-2xl mb-1">{result.qualifies ? "✅" : "⚠️"}</div>
                  <div className="text-xs text-muted">Qualifying Status</div>
                  <div className={`text-sm font-medium ${result.qualifies ? "text-green-600" : "text-red-600"}`}>
                    {result.qualifies ? "Likely to Qualify" : "Below Cutoff"}
                  </div>
                </div>
                <div className="p-4 rounded-2xl text-center bg-foreground/5 border border-border">
                  <div className="text-2xl mb-1">📊</div>
                  <div className="text-xs text-muted">Cutoff Marks</div>
                  <div className="text-sm font-medium font-mono">
                    {result.cutoff} / 100
                  </div>
                </div>
              </div>

              {/* Message */}
              <div className="p-4 bg-accent/5 border border-accent/10 rounded-2xl mb-6">
                <p className="text-sm text-muted leading-relaxed">{result.message}</p>
              </div>

              {/* Score Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-xs text-muted mb-2">
                  <span>Your Score</span>
                  <span>Cutoff</span>
                </div>
                <div className="h-3 bg-foreground/5 rounded-full overflow-hidden relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(result.marks, 100)}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                    className={`h-full rounded-full ${result.qualifies ? "bg-green-500" : "bg-red-500"}`}
                  />
                  <div
                    className="absolute top-0 h-full w-0.5 bg-foreground/50"
                    style={{ left: `${result.cutoff}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="font-mono">{result.marks} marks</span>
                  <span className="font-mono text-muted">Cutoff: {result.cutoff}</span>
                </div>
              </div>

              {/* Share */}
              <button
                onClick={handleWhatsAppShare}
                className="w-full py-3 bg-[#25D366] text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share on WhatsApp
              </button>

              <p className="text-xs text-muted text-center mt-4">
                Based on 2020–2024 data. Actual results may vary.
              </p>
            </motion.div>
          </div>
        </section>
      )}

      <Footer />
    </main>
  );
}
