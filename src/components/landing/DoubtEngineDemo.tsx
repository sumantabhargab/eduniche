"use client";

import { useState, useEffect, useRef } from "react";

type Step = "question" | "thinking" | "answer";

const GATE_QUESTION = {
  subject: "DBMS",
  topic: "Normalization",
  text: "Consider a relation R(A, B, C, D, E) with functional dependencies: A → BC, B → D, C → E. What is the highest normal form of R?",
};

const AI_ANSWER = `Let me break this down step by step.

**Step 1: Find the candidate key**

From A → BC and B → D, C → E:
- A⁺ = {A, B, C, D, E} → A is a candidate key.

**Step 2: Check for partial dependency**

A → BC is fine (full dependency on key).
But B → D: here {B} is a proper subset of the key {A}, and B → D is a non-prime attribute. **Partial dependency detected.**

**Step 3: Conclusion**

Since a partial dependency exists (B → D where B ⊂ key), the relation is only in **1NF**.

To achieve 2NF, decompose into:
- R₁(A, B, C) with A → BC
- R₂(B, D) with B → D
- R₃(C, E) with C → E`;

export default function DoubtEngineDemo() {
  const [step, setStep] = useState<Step>("question");
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
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const advance = () => {
    if (step === "question") {
      setIsTransitioning(true);
      setTimeout(() => {
        setStep("thinking");
        setIsTransitioning(false);
      }, 400);
    } else if (step === "thinking") {
      setIsTransitioning(true);
      setTimeout(() => {
        setStep("answer");
        setIsTransitioning(false);
      }, 600);
    } else {
      setStep("question");
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
                EduNeuro — AI Doubt Engine
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest uppercase text-success">
                {step === "thinking" ? "Analyzing..." : step === "answer" ? "Complete" : "Ready"}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 sm:px-8 py-8 min-h-[380px] flex flex-col">
            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-6">
              <span className="text-white/30 text-xs font-mono">
                {step === "question" && "STEP 1 — Your Question"}
                {step === "thinking" && "STEP 2 — AI Analyzing"}
                {step === "answer" && "STEP 3 — Detailed Answer"}
              </span>
            </div>

            <div
              className={`flex-1 transition-all duration-400 ${
                isTransitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
              }`}
            >
              {step === "question" && (
                <div className="space-y-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                      <span className="font-serif text-xs text-accent">You</span>
                    </div>
                    <div>
                      <div className="text-white/80 text-sm font-medium">Your question</div>
                      <div className="text-white/30 text-xs">GATE CSE · DBMS</div>
                    </div>
                  </div>

                  {/* Question card */}
                  <div className="border border-white/10 rounded-sm p-5 bg-white/[0.03]">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] font-mono tracking-widest uppercase text-white/30">
                        {GATE_QUESTION.subject} · {GATE_QUESTION.topic}
                      </span>
                    </div>
                    <p className="text-white/90 text-base leading-relaxed">
                      {GATE_QUESTION.text}
                    </p>
                  </div>

                  <p className="text-white/25 text-xs">
                    Ask any GATE question and get a step-by-step explanation grounded in concepts.
                  </p>
                </div>
              )}

              {step === "thinking" && (
                <div className="space-y-5">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center border border-success/30">
                      <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-white/80 text-sm font-medium">Learning AI</div>
                      <div className="text-white/30 text-xs">Analyzing your question...</div>
                    </div>
                  </div>

                  {/* Thinking animation */}
                  <div className="space-y-3">
                    {[
                      "Identifying the subject and topic...",
                      "Finding candidate keys from functional dependencies...",
                      "Checking normal form violations...",
                      "Detecting partial dependency B → D...",
                      "Generating step-by-step explanation...",
                    ].map((line, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 text-sm"
                        style={{
                          opacity: 0,
                          animation: `fadeInUp 0.3s ease-out ${i * 0.4}s forwards`,
                        }}
                      >
                        <div className="w-1 h-1 rounded-full bg-accent" />
                        <span className="text-white/50 font-mono text-xs">{line}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step === "answer" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center border border-success/30">
                      <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-white/80 text-sm font-medium">Learning AI</div>
                      <div className="text-white/30 text-xs">Step-by-step explanation</div>
                    </div>
                  </div>

                  {/* Answer preview */}
                  <div className="text-white/90 text-sm leading-relaxed space-y-3">
                    <p>Let me break this down step by step.</p>

                    <div className="border border-accent/30 rounded-sm p-4 bg-accent/5">
                      <div className="text-accent text-[10px] font-mono tracking-widest uppercase mb-2">
                        Step 1 — Candidate Key
                      </div>
                      <p className="text-white/70 text-xs leading-relaxed">
                        Closure A+ covers all attributes, making A a candidate key.
                      </p>
                    </div>

                    <div className="border border-white/10 rounded-sm p-4 bg-white/[0.02]">
                      <div className="text-white/40 text-[10px] font-mono tracking-widest uppercase mb-2">
                        Step 2 — Check Normal Form
                      </div>
                      <p className="text-white/70 text-xs leading-relaxed">
                        B → D is a partial dependency (B is part of the key). This violates 2NF.
                      </p>
                    </div>

                    <div className="border border-success/30 rounded-sm p-4 bg-success/5">
                      <div className="text-success text-[10px] font-mono tracking-widest uppercase mb-2">
                        Conclusion
                      </div>
                      <p className="text-white/80 text-xs leading-relaxed">
                        The relation is in <span className="text-accent font-medium">1NF</span> due to the partial dependency B → D.
                        Decompose into R₁(A,B,C), R₂(B,D), R₃(C,E) to achieve 2NF.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 sm:px-8 py-4 border-t border-white/10 flex items-center justify-between">
            <span className="text-white/25 text-xs font-mono">
              {step === "question" && "Submit a GATE question to see AI analysis"}
              {step === "thinking" && "The AI breaks down the problem systematically"}
              {step === "answer" && "Full conceptual explanation with step-by-step reasoning"}
            </span>
            <button
              onClick={advance}
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-background text-xs font-medium transition-colors duration-200"
            >
              <span>
                {step === "question" ? "Submit Question" : step === "thinking" ? "View Answer" : "Try Another"}
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
