"use client";

import { useState, useEffect, useRef } from "react";
import { PAPERS } from "@/lib/gate/config";

type View = "overview" | "subjects" | "analysis";

const SUBJECTS = [
  { name: "Algorithms", weight: "15%", difficulty: "High", trend: "up" },
  { name: "Data Structures", weight: "10%", difficulty: "Medium", trend: "stable" },
  { name: "DBMS", weight: "10%", difficulty: "Medium", trend: "up" },
  { name: "Operating Systems", weight: "10%", difficulty: "Medium", trend: "stable" },
  { name: "Computer Networks", weight: "8%", difficulty: "High", trend: "up" },
  { name: "TOC", weight: "8%", difficulty: "High", trend: "stable" },
  { name: "COA", weight: "8%", difficulty: "High", trend: "down" },
  { name: "Digital Logic", weight: "7%", difficulty: "Medium", trend: "stable" },
  { name: "Discrete Math", weight: "7%", difficulty: "Medium", trend: "up" },
  { name: "Engineering Math", weight: "15%", difficulty: "Medium", trend: "stable" },
];

export default function GateIntelligenceDemo() {
  const [view, setView] = useState<View>("overview");
  const [visible, setVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setVisible(true);
        });
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const csePaper = PAPERS.find(p => p.id === "cse");

  return (
    <div ref={containerRef} className="w-full max-w-3xl mx-auto">
      <div
        className={`transition-all duration-700 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="bg-background-dark rounded-sm overflow-hidden shadow-2xl">
          {/* Header bar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-accent/80" />
                <div className="w-3 h-3 rounded-full bg-white/10" />
                <div className="w-3 h-3 rounded-full bg-white/10" />
              </div>
              <span className="text-white/40 text-xs font-mono tracking-wider uppercase">
                EduNeuro — GATE CSE Intelligence
              </span>
            </div>
            <div className="flex items-center gap-1">
              {["overview", "subjects", "analysis"].map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v as View)}
                  className={`px-2.5 py-1 text-[10px] font-mono tracking-wider uppercase transition-colors ${
                    view === v
                      ? "text-accent border-b border-accent"
                      : "text-white/30 hover:text-white/50"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="px-6 sm:px-8 py-8 min-h-[360px]">
            {view === "overview" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white/80 text-sm font-medium mb-1">GATE CSE — 2024</div>
                    <div className="text-white/30 text-xs">Computer Science and Information Technology</div>
                  </div>
                  <span className="text-[10px] font-mono text-success tracking-wider uppercase">Available</span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="border border-white/10 rounded-sm p-4 bg-white/[0.02]">
                    <div className="text-white/30 text-[10px] font-mono tracking-widest uppercase mb-2">Questions</div>
                    <div className="text-white font-mono text-lg">1,247</div>
                    <div className="text-white/20 text-[10px] mt-1">18 years analyzed</div>
                  </div>
                  <div className="border border-white/10 rounded-sm p-4 bg-white/[0.02]">
                    <div className="text-white/30 text-[10px] font-mono tracking-widest uppercase mb-2">Subjects</div>
                    <div className="text-white font-mono text-lg">10</div>
                    <div className="text-white/20 text-[10px] mt-1">Full coverage</div>
                  </div>
                  <div className="border border-white/10 rounded-sm p-4 bg-white/[0.02]">
                    <div className="text-white/30 text-[10px] font-mono tracking-widest uppercase mb-2">Data</div>
                    <div className="text-white font-mono text-lg">73%</div>
                    <div className="text-white/20 text-[10px] mt-1">Coverage</div>
                  </div>
                </div>

                {/* Quick actions */}
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setView("subjects")} className="flex-1 py-2.5 bg-accent/10 border border-accent/20 text-accent text-xs font-medium hover:bg-accent/20 transition-colors">
                    Explore Subjects
                  </button>
                  <button onClick={() => setView("analysis")} className="flex-1 py-2.5 bg-white/5 border border-white/10 text-white/60 text-xs font-medium hover:bg-white/10 transition-colors">
                    View Analysis
                  </button>
                </div>
              </div>
            )}

            {view === "subjects" && (
              <div className="space-y-3">
                <div className="text-white/30 text-xs font-mono mb-4">
                  {SUBJECTS.length} subjects · sorted by weight
                </div>
                {SUBJECTS.map((subject, i) => (
                  <div
                    key={subject.name}
                    className="flex items-center justify-between p-3 border border-white/10 bg-white/[0.02] hover:border-white/20 transition-colors"
                    style={{
                      opacity: 0,
                      animation: `fadeInUp 0.3s ease-out ${i * 0.05}s forwards`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-white/20 font-mono text-xs w-5">{String(i + 1).padStart(2, "0")}</span>
                      <span className="text-white/80 text-sm">{subject.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-[10px] font-mono tracking-wider ${
                        subject.difficulty === "High" ? "text-red-400/70" : "text-white/30"
                      }`}>
                        {subject.difficulty}
                      </span>
                      <span className="text-white/40 text-xs font-mono w-10 text-right">{subject.weight}</span>
                      <span className={`text-[10px] ${
                        subject.trend === "up" ? "text-green-400/70" : "text-white/20"
                      }`}>
                        {subject.trend === "up" ? "↑ trending" : subject.trend === "down" ? "↓" : "→"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {view === "analysis" && (
              <div className="space-y-4">
                <div className="text-white/30 text-xs font-mono mb-4">
                  Topic trends from 2007–2024
                </div>

                <div className="space-y-4">
                  {[
                    {
                      topic: "Algorithms",
                      trend: "Consistently high weightage. Dynamic Programming and Graph Theory dominate. 3+ mark questions appear every year.",
                      action: "Focus on DP patterns and graph algorithms",
                    },
                    {
                      topic: "DBMS",
                      trend: "Increasing emphasis on normalization and transaction management. SQL queries remain predictable.",
                      action: "Practice normalization problems",
                    },
                    {
                      topic: "Engineering Math",
                      trend: "Stable 15% weightage. Linear Algebra and Probability are high-yield.",
                      action: "Master probability distributions",
                    },
                  ].map((item, i) => (
                    <div
                      key={item.topic}
                      className="border border-white/10 rounded-sm p-4 bg-white/[0.02]"
                      style={{
                        opacity: 0,
                        animation: `fadeInUp 0.3s ease-out ${i * 0.15}s forwards`,
                      }}
                    >
                      <div className="text-accent text-[10px] font-mono tracking-widest uppercase mb-2">
                        {item.topic}
                      </div>
                      <p className="text-white/60 text-xs leading-relaxed mb-2">
                        {item.trend}
                      </p>
                      <div className="text-success/70 text-[10px] font-mono">
                        → {item.action}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 sm:px-8 py-3 border-t border-white/10">
            <span className="text-white/20 text-[10px] font-mono">
              {view === "overview" && "Click a tab to explore GATE paper intelligence"}
              {view === "subjects" && "Subject-wise weightage, difficulty, and trends from historical data"}
              {view === "analysis" && "AI-generated insights from 18 years of GATE question patterns"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
