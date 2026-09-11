"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PAPERS } from "@/lib/gate/config";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Zap, Trophy, ArrowRight } from "@/components/pyq/PYQIcons";

export default function GateArcadePage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-background">
      <Nav />
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 text-amber-600 text-xs font-medium tracking-wider uppercase">
              <Zap className="w-4 h-4" />
              GATE Arcade
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-serif text-4xl sm:text-5xl leading-[1.08] tracking-tight mb-6"
          >
            Learn Through <span className="text-accent">Play</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted max-w-xl mx-auto mb-12 text-sm md:text-base"
          >
            Challenge yourself with timed practice, track your progress, and climb the leaderboard.
            Pick a paper to start your arcade session.
          </motion.p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
            {PAPERS.filter(p => p.processingStatus === "available").map((paper) => (
              <Link
                key={paper.id}
                href={`/gate/${paper.id}/practice`}
                className="group bg-card border border-border rounded-2xl p-5 hover:border-accent transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs text-accent">{paper.code}</span>
                  <ArrowRight className="w-4 h-4 text-muted group-hover:text-accent transition-colors" />
                </div>
                <h3 className="text-sm font-medium mb-1">{paper.name}</h3>
                <p className="text-xs text-muted line-clamp-2">{paper.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
