"use client";

import { useState, useEffect, useRef } from "react";

type Stage = "profile" | "learning" | "practice" | "results";

export default function PersonalizedLearningDemo() {
  const [stage, setStage] = useState<Stage>("profile");
  const [visible, setVisible] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
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

  const advance = () => {
    if (stage === "profile") {
      setIsTransitioning(true);
      setTimeout(() => { setStage("learning"); setIsTransitioning(false); }, 400);
    } else if (stage === "learning") {
      setIsTransitioning(true);
      setTimeout(() => { setStage("practice"); setIsTransitioning(false); }, 500);
    } else if (stage === "practice") {
      setIsTransitioning(true);
      setTimeout(() => { setStage("results"); setIsTransitioning(false); }, 400);
    } else {
      setStage("profile");
    }
  };

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
                EduNeuro — Learning Dashboard
              </span>
            </div>
            <div className="flex items-center gap-2">
              {(["profile", "learning", "practice", "results"] as Stage[]).map((s, i) => (
                <div
                  key={s}
                  className={`h-0.5 w-6 transition-all duration-500 ${
                    ["profile", "learning", "practice", "results"].indexOf(stage) >= i
                      ? "bg-accent"
                      : "bg-white/10"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="px-6 sm:px-8 py-8 min-h-[360px]">
            <div
              className={`transition-all duration-400 ${
                isTransitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
              }`}
            >
              {stage === "profile" && (
                <div className="space-y-5">
                  <div className="text-white/30 text-xs font-mono mb-4">
                    YOUR LEARNING PROFILE
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="border border-white/10 rounded-sm p-4 bg-white/[0.02]">
                      <div className="text-white/30 text-[10px] font-mono tracking-widest uppercase mb-2">Exam</div>
                      <div className="text-white font-medium text-sm">GATE CSE</div>
                    </div>
                    <div className="border border-white/10 rounded-sm p-4 bg-white/[0.02]">
                      <div className="text-white/30 text-[10px] font-mono tracking-widest uppercase mb-2">Target</div>
                      <div className="text-white font-medium text-sm">2025 Rank &lt; 500</div>
                    </div>
                    <div className="border border-white/10 rounded-sm p-4 bg-white/[0.02]">
                      <div className="text-white/30 text-[10px] font-mono tracking-widest uppercase mb-2">Study Time</div>
                      <div className="text-white font-mono text-lg">4.5h</div>
                      <div className="text-white/20 text-[10px] mt-1">today</div>
                    </div>
                    <div className="border border-white/10 rounded-sm p-4 bg-white/[0.02]">
                      <div className="text-white/30 text-[10px] font-mono tracking-widest uppercase mb-2">Streak</div>
                      <div className="text-white font-mono text-lg">12 days</div>
                      <div className="text-white/20 text-[10px] mt-1">personal best</div>
                    </div>
                  </div>

                  {/* Weak areas */}
                  <div className="border border-accent/20 rounded-sm p-4 bg-accent/5">
                    <div className="text-accent text-[10px] font-mono tracking-widest uppercase mb-3">
                      Weak Areas — AI Recommended Focus
                    </div>
                    <div className="space-y-2">
                      {["Algorithms — Dynamic Programming (42% accuracy)", "TOC — Pushdown Automata (38% accuracy)", "DBMS — Normalization (55% accuracy)"].map((area) => (
                        <div key={area} className="flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-accent" />
                          <span className="text-white/70 text-xs">{area}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {stage === "learning" && (
                <div className="space-y-4">
                  <div className="text-white/30 text-xs font-mono mb-2">
                    PERSONALIZED STUDY PATH
                  </div>

                  <div className="border border-white/10 rounded-sm p-5 bg-white/[0.02]">
                    <div className="text-accent text-[10px] font-mono tracking-widest uppercase mb-3">
                      Today&apos;s Focus — Algorithms
                    </div>
                    <h3 className="text-white font-serif text-lg mb-3">Dynamic Programming Patterns</h3>
                    <p className="text-white/50 text-xs leading-relaxed mb-4">
                      Based on your recent performance, the AI has curated 5 DP problems
                      starting from 0/1 Knapsack and building toward Matrix Chain Multiplication.
                    </p>

                    <div className="space-y-2">
                      {[
                        { name: "0/1 Knapsack — Basics", status: "next" },
                        { name: "Unbounded Knapsack", status: "locked" },
                        { name: "Matrix Chain Multiplication", status: "locked" },
                        { name: "LCS Variations", status: "locked" },
                        { name: "DP on Trees", status: "locked" },
                      ].map((item, i) => (
                        <div
                          key={item.name}
                          className={`flex items-center justify-between py-2 px-3 rounded-sm ${
                            i === 0 ? "bg-accent/10 border border-accent/20" : "bg-white/[0.02]"
                          }`}
                        >
                          <span className={`text-xs ${i === 0 ? "text-white/90" : "text-white/30"}`}>
                            {item.name}
                          </span>
                          <span className={`text-[10px] font-mono ${
                            i === 0 ? "text-accent" : "text-white/15"
                          }`}>
                            {i === 0 ? "START" : "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {stage === "practice" && (
                <div className="space-y-4">
                  <div className="text-white/30 text-xs font-mono mb-2">
                    PRACTICE SESSION — In Progress
                  </div>

                  <div className="border border-white/10 rounded-sm p-5 bg-white/[0.02]">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-accent text-[10px] font-mono tracking-widest uppercase">0/1 Knapsack</span>
                      <span className="text-white/30 text-[10px] font-mono">Q1 of 5</span>
                    </div>

                    <p className="text-white/80 text-sm leading-relaxed mb-4">
                      Given weights [2, 3, 4, 5] and values [3, 4, 5, 6] with capacity 5,
                      what&apos;s the maximum value achievable?
                    </p>

                    <div className="space-y-2">
                      {[
                        "9 (items 3 + 4)",
                        "7 (items 1 + 2)",
                        "8 (items 1 + 3)",
                        "10 (items 2 + 3)",
                      ].map((opt, i) => (
                        <div
                          key={opt}
                          className={`py-2.5 px-3 border rounded-sm text-xs cursor-pointer transition-colors ${
                            i === 3
                              ? "border-success/30 bg-success/5 text-success"
                              : "border-white/10 text-white/40 hover:border-white/20"
                          }`}
                        >
                          {opt}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {stage === "results" && (
                <div className="space-y-4">
                  <div className="text-white/30 text-xs font-mono mb-2">
                    SESSION RESULTS
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="border border-white/10 rounded-sm p-4 bg-white/[0.02] text-center">
                      <div className="text-success font-mono text-xl">87%</div>
                      <div className="text-white/25 text-[10px] mt-1">Accuracy</div>
                    </div>
                    <div className="border border-white/10 rounded-sm p-4 bg-white/[0.02] text-center">
                      <div className="text-white font-mono text-xl">12m</div>
                      <div className="text-white/25 text-[10px] mt-1">Time</div>
                    </div>
                    <div className="border border-white/10 rounded-sm p-4 bg-white/[0.02] text-center">
                      <div className="text-accent font-mono text-xl">+8%</div>
                      <div className="text-white/25 text-[10px] mt-1">Improvement</div>
                    </div>
                  </div>

                  {/* Topic heatmap */}
                  <div className="border border-white/10 rounded-sm p-4 bg-white/[0.02]">
                    <div className="text-white/30 text-[10px] font-mono tracking-widest uppercase mb-3">
                      Topic Mastery
                    </div>
                    <div className="space-y-2">
                      {[
                        { topic: "DP Basics", level: 87 },
                        { topic: "Knapsack", level: 72 },
                        { topic: "LCS", level: 45 },
                        { topic: "Matrix DP", level: 30 },
                      ].map((topic) => (
                        <div key={topic.topic}>
                          <div className="flex justify-between text-[10px] mb-1">
                            <span className="text-white/40">{topic.topic}</span>
                            <span className="text-white/30 font-mono">{topic.level}%</span>
                          </div>
                          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${topic.level}%`,
                                backgroundColor: topic.level > 70 ? '#3DA06A' : topic.level > 40 ? '#D4891A' : '#C43E3E',
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 sm:px-8 py-4 border-t border-white/10 flex items-center justify-between">
            <span className="text-white/25 text-[10px] font-mono">
              {stage === "profile" && "Your AI-curated learning profile"}
              {stage === "learning" && "Adaptive study path based on your weaknesses"}
              {stage === "practice" && "Practice problems matched to your level"}
              {stage === "results" && "Progress tracking and mastery visualization"}
            </span>
            <button
              onClick={advance}
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-background text-xs font-medium transition-colors duration-200"
            >
              <span>
                {stage === "profile" ? "Start Learning" : stage === "learning" ? "Practice" : stage === "practice" ? "View Results" : "Reset"}
              </span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
