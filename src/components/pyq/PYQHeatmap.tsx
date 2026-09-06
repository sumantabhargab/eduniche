/**
 * PYQ Heatmap — premium component showing topic frequency over years
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, Lock } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";

interface HeatmapProps {
  branch?: string;
}

export default function PYQHeatmap({ branch }: HeatmapProps) {
  const { isPremium } = useAuth();
  const router = useRouter();
  const [heatmapData, setHeatmapData] = useState<Record<string, Record<number, number>>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isPremium) return;
    const params = new URLSearchParams();
    if (branch) params.set("branch", branch);
    fetch(`/api/pyq/analytics/heatmap?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.heatmap) setHeatmapData(data.heatmap);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [branch, isPremium]);

  if (!isPremium) {
    return (
      <div className="bg-card border border-accent/20 rounded-2xl p-8 text-center">
        <Lock className="w-8 h-8 text-accent mx-auto mb-4" />
        <h3 className="font-serif text-xl mb-2">PYQ Heatmap</h3>
        <p className="text-muted text-sm mb-4">Visualize topic frequency across years with our premium heatmap.</p>
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

  const years = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];
  const topics = Object.keys(heatmapData).slice(0, 15);
  const maxCount = Math.max(
    1,
    ...topics.flatMap((t) => years.map((y) => heatmapData[t]?.[y] || 0))
  );

  const getIntensity = (count: number) => {
    if (count === 0) return "bg-foreground/5";
    const ratio = count / maxCount;
    if (ratio < 0.25) return "bg-emerald-500/20";
    if (ratio < 0.5) return "bg-emerald-500/40";
    if (ratio < 0.75) return "bg-emerald-500/60";
    return "bg-emerald-500/80";
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="w-5 h-5 text-accent" />
        <h3 className="font-serif text-xl">PYQ Heatmap</h3>
        <span className="text-xs text-muted ml-2">Topic frequency · {branch || "All branches"}</span>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-8 bg-foreground/5 rounded" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left py-2 px-2 text-muted font-medium sticky left-0 bg-card">Topic</th>
                {years.map((y) => (
                  <th key={y} className="py-2 px-2 text-muted font-medium text-center">{y}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topics.map((topic) => (
                <tr key={topic} className="border-t border-border">
                  <td className="py-2 px-2 font-medium sticky left-0 bg-card max-w-[200px] truncate">{topic}</td>
                  {years.map((y) => {
                    const count = heatmapData[topic]?.[y] || 0;
                    return (
                      <td key={y} className="py-2 px-1 text-center">
                        <div className={`w-full h-6 rounded ${getIntensity(count)} flex items-center justify-center ${
                          count > 0 ? "text-foreground" : "text-muted"
                        }`}>
                          {count || "-"}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex items-center gap-2 text-[10px] text-muted">
        <span>Less</span>
        <div className="flex gap-0.5">
          {["bg-foreground/5", "bg-emerald-500/20", "bg-emerald-500/40", "bg-emerald-500/60", "bg-emerald-500/80"].map((cls) => (
            <div key={cls} className={`w-4 h-4 rounded ${cls}`} />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
