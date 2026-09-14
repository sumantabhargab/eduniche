/**
 * Predicted Papers Hub — /predicted-papers
 *
 * Lists all 5 branches (EE, CE, ME, XE, XL) with 4 predicted papers each.
 * Premium users see "Start Exam" buttons; free users see previews + paywall.
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Zap, ArrowRight, Lock, Eye, FileText, TrendingUp } from "@/components/pyq/PYQIcons";
import { useAuth } from "@/lib/hooks/useAuth";

interface BranchInfo {
  branch: string;
  name: string;
  icon: string;
  paperCount: number;
}

export default function PredictedPapersPage() {
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetch("/api/predicted-papers")
      .then((r) => r.json())
      .then((data) => {
        setBranches(data.branches || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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
            className="font-serif text-4xl sm:text-5xl leading-[1.08] tracking-tight mb-6"
          >
            Predicted GATE Papers
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted max-w-xl mx-auto mb-12 text-sm md:text-base"
          >
            Four carefully crafted papers per branch, designed by analyzing 2021–2024 PYQ trends.
            Each paper mirrors the actual GATE exam pattern — 65 questions, 100 marks, 3 hours.
          </motion.p>
        </div>
      </section>

      {/* Branch Grid */}
      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {branches.map((branch, idx) => (
            <motion.div
              key={branch.branch}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Link
                href={`/predicted-papers/${branch.branch.toLowerCase()}`}
                className="group block bg-card border border-border rounded-2xl p-6 hover:border-accent transition-all h-full"
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="text-3xl">{branch.icon}</span>
                  <span className="text-xs font-medium text-muted bg-foreground/5 px-3 py-1 rounded-full">
                    {branch.paperCount} papers
                  </span>
                </div>

                <h3 className="font-serif text-lg mb-1 group-hover:text-accent transition-colors">
                  GATE {branch.branch}
                </h3>
                <p className="text-sm text-muted mb-4">{branch.name}</p>

                <div className="flex items-center gap-2 text-xs text-muted">
                  <FileText className="w-3.5 h-3.5" />
                  <span>4 predicted papers · 65 questions each</span>
                </div>

                <div className="flex items-center gap-2 text-xs text-accent mt-3 font-medium">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>View papers</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Premium Banner */}
      {!user && (
        <section className="px-6 pb-20">
          <div className="max-w-2xl mx-auto bg-gradient-to-br from-purple-500/10 to-accent/10 border border-purple-500/20 rounded-3xl p-8 text-center">
            <Lock className="w-8 h-8 text-purple-500 mx-auto mb-4" />
            <h3 className="font-serif text-xl mb-2">Full access requires Premium</h3>
            <p className="text-sm text-muted mb-6">
              Predicted papers are a premium feature. Get unlimited access with a Weekly or Monthly plan.
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
            >
              View Plans <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}

      {user && (
        <section className="px-6 pb-20">
          <div className="max-w-2xl mx-auto bg-gradient-to-br from-purple-500/10 to-accent/10 border border-purple-500/20 rounded-3xl p-8 text-center">
            <Zap className="w-8 h-8 text-purple-500 mx-auto mb-4" />
            <h3 className="font-serif text-xl mb-2">Premium Feature</h3>
            <p className="text-sm text-muted mb-6">
              Predicted papers are available for Premium subscribers. You have full access!
            </p>
            <Link
              href="/predicted-papers/ee"
              className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Start Practising <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}

      <Footer />
    </main>
  );
}
