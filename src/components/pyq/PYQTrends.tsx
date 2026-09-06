/**
 * PYQ Trends — premium component showing topic frequency trends
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Lock, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";

interface TrendProps {
  branch?: string;
}

export default function PYQTrends({ branch }: TrendProps) {
  const { isPremium } = useAuth();
  const router = useRouter();
  const [trends, setTrends] = useState<{ topic: string; trend: "increasing" | "decreasing" | "stable"; change: number; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isPremium) return;
    const params = new URLSearchParams();
    if (branch) params.set("branch", branch);
    fetch(`/api/pyq/analytics/trends?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.trends) setTrends(data.trends);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [branch, isPremium]);

  if (!isPremium) {
    return (
      <div className="bg-card border border-accent/20 rounded-2xl p-8 text-center">
        <Lock className="w-8 h-8 text-accent mx-auto mb-4" />
        <h3 className="font-serif text-xl mb-2">Trend Analysis</h3>
        <p className="text-muted text-sm mb-4">Discover what topics are being asked more frequently.</p>
        <button
          onClick={() => router.push("/pricing")}
          className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-xl text-sm font-medium"
        >
          <Lock className="w-4 h-4" />
          Upgrade to Premium
        </button>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-accent" />
        <h3 className="font-serif text-xl">Topic Trends</h3>
        <span className="text-xs text-muted ml-2">What&apos;s been asked more · {branch || "All branches"}</span>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 bg-foreground/5 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {trends.map((item, i) => (
            <motion.div
              key={item.topic}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-4 p-4 bg-background/50 rounded-xl border border-border"
            >
              <div className={`p-2 rounded-lg ${
                item.trend === "increasing" ? "bg-emerald-500/10 text-emerald-600" :
                item.trend === "decreasing" ? "bg-red-500/10 text-red-600" :
                "bg-muted/10 text-muted"
              }`}>
                {item.trend === "increasing" ? <ArrowUp className="w-4 h-4" /> :
                 item.trend === "decreasing" ? <ArrowDown className="w-4 h-4" /> :
                 <Minus className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{item.topic}</div>
                <div className="text-xs text-muted">{item.count} questions historically</div>
              </div>
              <div className={`text-xs font-medium ${
                item.trend === "increasing" ? "text-emerald-600" :
                item.trend === "decreasing" ? "text-red-600" : "text-muted"
              }`}>
                {item.trend === "increasing" ? `+${item.change}%` :
                 item.trend === "decreasing" ? `${item.change}%` : "Stable"}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
