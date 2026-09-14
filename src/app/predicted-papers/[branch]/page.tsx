/**
 * Predicted Papers — Branch Page
 *
 * Lists all 4 predicted papers for a specific branch.
 * Shows paper metadata (title, description, difficulty breakdown, subject breakdown).
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import {
  Zap, ArrowRight, Lock, FileText, Target,
  BarChart3, Eye, X as XIcon
} from "@/components/pyq/PYQIcons";
import { useAuth } from "@/lib/hooks/useAuth";

interface PaperMeta {
  id: string;
  title: string;
  description: string;
  totalQuestions: number;
  totalMarks: number;
  difficultyDistribution: { easy: number; moderate: number; difficult: number };
  subjectBreakdown: { subject: string; marks: number; questions: number }[];
  predictionRationale: string;
  questions?: { id: string; questionNumber: number; subject: string; marks: number; questionText: string; options: string[] }[];
}

const BRANCH_NAMES: Record<string, string> = {
  EE: "Electrical Engineering",
  CE: "Civil Engineering",
  ME: "Mechanical Engineering",
  XE: "Engineering Sciences",
  XL: "Life Sciences",
};

export default function BranchPapersPage() {
  const params = useParams();
  const branch = (params.branch as string)?.toUpperCase() || "";
  const { user } = useAuth();
  const [papers, setPapers] = useState<PaperMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewPaper, setPreviewPaper] = useState<PaperMeta | null>(null);

  const branchName = BRANCH_NAMES[branch] || branch;

  useEffect(() => {
    if (!branch) return;
    fetch(`/api/predicted-papers/${branch.toLowerCase()}`)
      .then((r) => r.json())
      .then((data) => {
        setPapers(data.papers || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [branch]);

  const handlePreview = async (paperId: string) => {
    const res = await fetch(`/api/predicted-papers/preview/${branch.toLowerCase()}`);
    const data = await res.json();
    if (data.paper) {
      setPreviewPaper(data.paper);
    }
  };

  const isPremium = user !== null;

  return (
    <main className="min-h-screen bg-background">
      <Nav />

      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 text-purple-600 text-xs font-medium tracking-wider uppercase">
              <Zap className="w-4 h-4" />
              Premium Content
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-serif text-4xl sm:text-5xl leading-[1.08] tracking-tight mb-4"
          >
            GATE {branch} Predicted Papers
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted max-w-xl mx-auto text-sm md:text-base"
          >
            {branchName} — 4 carefully crafted papers based on 2021–2024 PYQ analysis.
            Each paper: 65 questions, 100 marks, 3-hour timed exam.
          </motion.p>
        </div>
      </section>

      {/* Papers List */}
      <section className="px-6 pb-20">
        <div className="max-w-3xl mx-auto space-y-5">
          {papers.map((paper, idx) => (
            <motion.div
              key={paper.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="bg-card border border-border rounded-2xl p-6 hover:border-accent transition-all"
            >
              <div className="mb-3">
                <span className="text-xs font-mono text-accent mb-1 block">
                  Paper {idx + 1} of 4
                </span>
                <h3 className="font-serif text-lg">{paper.title}</h3>
                <p className="text-sm text-muted mt-1">{paper.description}</p>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex items-center gap-1.5 text-xs text-muted">
                  <FileText className="w-3.5 h-3.5" />
                  <span>{paper.totalQuestions} questions</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted">
                  <Target className="w-3.5 h-3.5" />
                  <span>{paper.totalMarks} marks</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted">
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>
                    Easy {paper.difficultyDistribution.easy} · Mod {paper.difficultyDistribution.moderate} · Diff {paper.difficultyDistribution.difficult}
                  </span>
                </div>
              </div>

              {/* Subject breakdown */}
              <div className="flex flex-wrap gap-2 mb-5">
                {paper.subjectBreakdown.slice(0, 6).map((s) => (
                  <span
                    key={s.subject}
                    className="text-xs bg-foreground/5 text-muted px-2.5 py-1 rounded-lg"
                  >
                    {s.subject}: {s.marks} marks
                  </span>
                ))}
                {paper.subjectBreakdown.length > 6 && (
                  <span className="text-xs text-muted px-2.5 py-1">
                    +{paper.subjectBreakdown.length - 6} more
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                {isPremium ? (
                  <Link
                    href={`/predicted-papers/${branch.toLowerCase()}/${paper.id}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-foreground text-background rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Start Exam
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <button
                    onClick={() => handlePreview(paper.id)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 border border-border text-muted rounded-xl text-sm font-medium hover:border-accent hover:text-accent transition-all"
                  >
                    <Eye className="w-4 h-4" />
                    Preview (10 Qs)
                  </button>
                )}

                {!isPremium && (
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    <Zap className="w-4 h-4" />
                    Upgrade to Access
                  </Link>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Preview Modal */}
      {previewPaper && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="font-serif text-lg">Paper Preview</h3>
              <button
                onClick={() => setPreviewPaper(null)}
                className="text-muted hover:text-foreground transition-colors"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-muted mb-4">{previewPaper.predictionRationale}</p>
              {previewPaper.questions && previewPaper.questions.length > 0 && (
              <div className="space-y-4">
                {previewPaper.questions.map((q) => (
                  <div key={q.id} className="border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-mono text-accent">Q{q.questionNumber}</span>
                      <span className="text-xs text-muted">{q.subject}</span>
                      <span className="text-xs text-muted">{q.marks} marks</span>
                    </div>
                    <p className="text-sm mb-3">{q.questionText}</p>
                    {q.options.length > 0 && (
                      <div className="space-y-1.5">
                        {q.options.map((opt, i) => (
                          <div key={i} className="text-xs text-muted bg-foreground/5 rounded-lg px-3 py-2">
                            {String.fromCharCode(65 + i)}. {opt}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              )}
              <p className="text-xs text-muted mt-6 text-center">
                Showing 10 of {previewPaper.totalQuestions} questions. Upgrade to Premium for full access.
              </p>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}
