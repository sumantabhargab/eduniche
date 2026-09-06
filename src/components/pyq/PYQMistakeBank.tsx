/**
 * PYQ Mistake Bank — shows questions the student got wrong
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Flame, ChevronRight, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";

interface Mistake {
  id: string;
  questionId: string;
  branchCode: string;
  year: number;
  questionNumber: number;
  subjectName: string;
  topicName: string;
  selectedAnswer: string;
  correctAnswer: string;
  createdAt: string;
}

export default function PYQMistakeBank() {
  const { user } = useAuth();
  const router = useRouter();
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetch("/api/pyq/mistakes")
      .then((r) => r.json())
      .then((data) => {
        if (data.mistakes) setMistakes(data.mistakes);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="bg-card border border-border rounded-2xl p-8 text-center">
        <Flame className="w-8 h-8 text-accent mx-auto mb-4" />
        <h3 className="font-serif text-xl mb-2">Mistake Bank</h3>
        <p className="text-muted text-sm mb-4">Sign in to track and review your wrong answers.</p>
        <button
          onClick={() => router.push("/auth/signin")}
          className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-xl text-sm font-medium"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-red-500" />
          <h3 className="font-serif text-xl">My PYQ Mistakes</h3>
          <span className="text-xs text-muted ml-2">{mistakes.length} questions</span>
        </div>
        <button
          onClick={() => {
            const mistakeIds = mistakes.map(m => m.questionId);
            const url = `/pyqs/practice?mode=mistakes&ids=${mistakeIds.join(",")}`;
            router.push(url);
          }}
          disabled={mistakes.length === 0}
          className="inline-flex items-center gap-1.5 text-xs px-4 py-2 bg-foreground text-background rounded-xl disabled:opacity-30"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry All
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-foreground/5 rounded-xl" />
          ))}
        </div>
      ) : mistakes.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🎯</div>
          <p className="text-muted text-sm">No mistakes yet! Start practicing to build your mistake bank.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {mistakes.slice(0, 20).map((mistake, i) => (
            <motion.button
              key={mistake.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => router.push(`/pyqs/${mistake.branchCode}?subject=${encodeURIComponent(mistake.subjectName)}`)}
              className="w-full text-left p-4 bg-background/50 border border-border rounded-xl hover:border-foreground/20 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-muted">GATE {mistake.year}</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-red-500/10 text-red-600 rounded">
                      ✗ {mistake.selectedAnswer}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 rounded">
                      ✓ {mistake.correctAnswer}
                    </span>
                  </div>
                  <div className="text-xs text-muted">
                    {mistake.branchCode} · Q{mistake.questionNumber} · {mistake.subjectName}
                    {mistake.topicName && ` · ${mistake.topicName}`}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted shrink-0 mt-1" />
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
