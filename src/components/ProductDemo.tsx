"use client";

import { useState, useEffect, useRef } from "react";

type DemoStep =
  | "lesson"
  | "ask"
  | "question"
  | "response"
  | "simpler"
  | "practice"
  | "feedback"
  | "next";

type Speaker = "creator" | "arvin" | "ai";

const FLOW: { step: DemoStep; text: string; speaker: Speaker }[] = [
  {
    step: "lesson",
    text: '"Don\'t choose the chord because it sounds impressive. Choose it because the lyric needs what comes next."',
    speaker: "creator",
  },
  {
    step: "ask",
    text: "ARIN — This is confusing. Why does this progression create that feeling?",
    speaker: "arvin",
  },
  {
    step: "question",
    text: "The progression resolves on the submediant — it doesn't go where you expect. That tension holds the listener's attention without resolving. Think of it as asking a question instead of making a statement.",
    speaker: "ai",
  },
  {
    step: "response",
    text: "ARIN — Can you explain it more simply?",
    speaker: "arvin",
  },
  {
    step: "simpler",
    text: "Imagine you're telling a story. Most songs tell the whole story in one go. This progression is you pausing mid-sentence — people lean in because they want to hear what comes next.",
    speaker: "ai",
  },
  {
    step: "practice",
    text: "TRY IT: Compose a short melody over these four chords. Don't resolve on the tonic — let the last chord feel like a question.",
    speaker: "ai",
  },
  {
    step: "feedback",
    text: "YOUR MELODY — You resolved on the G major. Try holding the D for one extra bar. That unresolved note is where the feeling lives.",
    speaker: "ai",
  },
  {
    step: "next",
    text: "NEXT UP — Your instinct is to resolve quickly. We'll work on suspended tension. Creator: Riyan Das — Advanced Arrangement.",
    speaker: "ai",
  },
];

export default function ProductDemo() {
  const [step, setStep] = useState<DemoStep>("lesson");
  const [visible, setVisible] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const flowIndex = FLOW.findIndex((f) => f.step === step);
  const current = FLOW[flowIndex];

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
          }
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const advance = () => {
    if (flowIndex < FLOW.length - 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setStep(FLOW[flowIndex + 1].step);
        setIsTransitioning(false);
      }, 300);
    }
  };

  const startDemo = () => {
    setHasStarted(true);
    setStep("lesson");
  };

  const speaker = current?.speaker;
  const isCreator = speaker === "creator";
  const isArvin = speaker === "arvin";
  const isAI = speaker === "ai";

  const getStatusLabel = () => {
    switch (step) {
      case "lesson": return "CREATOR LESSON";
      case "ask": return "ARIN'S QUESTION";
      case "question": return "AI EXPLANATION";
      case "response": return "ARIN FOLLOWS UP";
      case "simpler": return "AI ADAPTS";
      case "practice": return "PRACTICE";
      case "feedback": return "FEEDBACK";
      case "next": return "RECOMMENDATION";
    }
  };

  const getStatusColor = () => {
    const speaker = current?.speaker;
    if (speaker === "creator") return "text-muted";
    if (speaker === "arvin") return "text-accent";
    return "text-success";
  };

  if (!hasStarted) {
    return (
      <div ref={containerRef} className="w-full max-w-3xl mx-auto">
        <div
          className={`transition-all duration-700 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className="bg-background-dark rounded-sm overflow-hidden shadow-2xl">
            <div className="px-8 py-16 text-center">
              <div className="text-muted-light text-sm font-mono tracking-widest uppercase mb-4">
                What learning from Riyan Das feels like
              </div>
              <div className="font-serif text-3xl md:text-4xl text-foreground-light leading-snug mb-6 max-w-xl mx-auto">
                Go beyond watching.
                <br />
                Learn how they think.
              </div>
              <p className="text-muted-light text-base mb-10 max-w-md mx-auto">
                Experience how creator knowledge meets AI personalization — step by step.
              </p>
              <button
                onClick={startDemo}
                className="inline-flex items-center gap-3 px-8 py-4 bg-accent hover:bg-accent-hover text-background font-medium text-base transition-colors duration-200 group"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Try the experience</span>
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full max-w-3xl mx-auto">
      <div
        className={`transition-all duration-700 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        <div className="bg-background-dark rounded-sm overflow-hidden shadow-2xl">
          {/* Demo header bar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border-light">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-accent/60" />
                <div className="w-3 h-3 rounded-full bg-border-light" />
                <div className="w-3 h-3 rounded-full bg-border-light" />
              </div>
              <span className="text-muted-light text-xs font-mono tracking-wider uppercase">
                Eduniche — Learning Experience
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-mono tracking-widest uppercase ${getStatusColor()}`}>
                {getStatusLabel()}
              </span>
              <div className="flex gap-1">
                {FLOW.map((_, i) => (
                  <div
                    key={i}
                    className={`h-0.5 w-6 transition-all duration-500 ${
                      i <= flowIndex ? "bg-accent" : "bg-border-light"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Demo content area */}
          <div className="px-8 py-10 min-h-[420px] flex flex-col">
            {/* Step indicator dots */}
            <div className="flex items-center gap-2 mb-8">
              <span className="text-muted-light text-xs font-mono">
                STEP {flowIndex + 1} / {FLOW.length}
              </span>
              {isCreator && (
                <span className="ml-3 px-2 py-0.5 bg-accent/10 text-accent text-xs font-mono rounded-sm">
                  CREATOR
                </span>
              )}
              {isArvin && (
                <span className="ml-3 px-2 py-0.5 bg-accent/10 text-accent text-xs font-mono rounded-sm">
                  LEARNER
                </span>
              )}
              {isAI && (
                <span className="ml-3 px-2 py-0.5 bg-success/10 text-success text-xs font-mono rounded-sm">
                  AI
                </span>
              )}
            </div>

            {/* The actual content */}
            <div
              className={`flex-1 transition-all duration-300 ${
                isTransitioning ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"
              }`}
            >
              {isCreator && (
                <div className="space-y-4">
                  <div className="text-muted-light text-xs font-mono tracking-widest uppercase mb-6">
                    LESSON — SONGWRITING
                  </div>
                  <div className="text-xl md:text-2xl font-serif text-foreground-light leading-relaxed">
                    {current.text}
                  </div>
                  <div className="flex items-center gap-3 pt-8">
                    <div className="w-10 h-10 rounded-full bg-background-alt flex items-center justify-center">
                      <span className="font-serif text-sm text-foreground">RD</span>
                    </div>
                    <div>
                      <div className="text-foreground-light text-sm font-medium">Riyan Das</div>
                      <div className="text-muted-light text-xs">Producer · Songwriter · Guwahati</div>
                    </div>
                  </div>
                </div>
              )}

              {isArvin && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                      <span className="font-serif text-sm text-accent">A</span>
                    </div>
                    <div>
                      <div className="text-foreground-light text-sm font-medium">Arvin</div>
                      <div className="text-muted-light text-xs">Aspiring music producer, 19</div>
                    </div>
                  </div>
                  <div className="bg-accent-subtle/10 border border-accent/20 rounded-sm px-6 py-4">
                    <p className="text-foreground-light text-base leading-relaxed italic">
                      {current.text}
                    </p>
                  </div>
                </div>
              )}

              {isAI && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center border border-success/30">
                      <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-foreground-light text-sm font-medium">Learning AI</div>
                      <div className="text-muted-light text-xs">Powered by Riyan's knowledge</div>
                    </div>
                  </div>
                  <div className="text-foreground-light text-base md:text-lg leading-relaxed">
                    {current.text}
                  </div>

                  {step === "next" && (
                    <div className="mt-8 p-5 border border-success/30 rounded-sm bg-success/5">
                      <div className="text-success text-xs font-mono tracking-widest uppercase mb-3">
                        LEARNING PATH UPDATED
                      </div>
                      <p className="text-foreground-light text-sm">
                        Your next session builds on what you just discovered. Ready when you are.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Demo footer with controls */}
          <div className="px-8 py-4 border-t border-border-light flex items-center justify-between">
            <div className="text-muted-light text-xs font-mono">
              {step === "lesson" && "A lesson from Riyan's course on songwriting."}
              {step === "ask" && "Arvin pauses the lesson to ask a question."}
              {step === "question" && "The AI draws from Riyan's knowledge to explain."}
              {step === "response" && "Arvin still doesn't fully follow. The AI adapts."}
              {step === "simpler" && "The AI reframes the explanation for Arvin's level."}
              {step === "practice" && "Arvin tries the concept — the AI listens."}
              {step === "feedback" && "The AI catches a specific issue in Arvin's work."}
              {step === "next" && "The system updates Arvin's learning path automatically."}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={advance}
                disabled={flowIndex >= FLOW.length - 1}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-hover disabled:bg-muted/30 disabled:cursor-not-allowed text-background font-medium text-sm transition-all duration-200 group"
              >
                <span>
                  {flowIndex >= FLOW.length - 1 ? "Start over" : "Next step"}
                </span>
                {flowIndex < FLOW.length - 1 && (
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                )}
                {flowIndex >= FLOW.length - 1 && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
