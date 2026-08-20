"use client";

import { useState, useEffect } from "react";

type QAStep =
  | "intro"
  | "question1"
  | "response1"
  | "question2"
  | "response2"
  | "synthesis";

const creatorQuote = `"Don't choose the chord because it sounds impressive. Choose it because the lyric needs what comes next."`;

const QASteps: Record<QAStep, { label: string; type: "quote" | "question" | "ai"; content: string; author?: string }> = {
  intro: {
    label: "CREATOR KNOWLEDGE",
    type: "quote",
    content: creatorQuote,
    author: "Riyan Das, Songwriting",
  },
  question1: {
    label: "LEARNER ASKS",
    type: "question",
    content: "Why does this chord progression create that unresolved feeling?",
    author: "Arvin, 19 — aspiring producer",
  },
  response1: {
    label: "AI EXPLAINS",
    type: "ai",
    content:
      "The progression delays resolution by ending on the submediant instead of the tonic. The ear expects resolution and doesn't get it — that's where the tension lives. It's the difference between a full stop and an ellipsis in a sentence.",
  },
  question2: {
    label: "LEARNER DEEPER",
    type: "question",
    content: "Could you show me how this applies to the next verse?",
    author: "Arvin",
  },
  response2: {
    label: "AI + CREATOR KNOWLEDGE",
    type: "ai",
    content:
      "Look at how Riyan shifts the bass note on the second repeat — he keeps the chord but changes the root, so the tension deepens instead of repeating. That's the technique. Now try applying it to your verse where the second line returns to the same melody.",
  },
  synthesis: {
    label: "WHAT JUST HAPPENED",
    type: "quote",
    content:
      "You didn't just watch Riyan play chords. You asked why, explored the reasoning, and got a personalized exercise built from his actual approach.",
  },
};

export default function CreatorExperience() {
  const [step, setStep] = useState<QAStep>("intro");
  const [visible, setVisible] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setVisible(true);
        });
      },
      { threshold: 0.15 }
    );

    const el = document.getElementById("creator-trigger");
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const current = QASteps[step];
  const steps = Object.keys(QASteps) as QAStep[];
  const currentIndex = steps.indexOf(step);

  const advance = () => {
    if (currentIndex < steps.length - 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setStep(steps[currentIndex + 1]);
        setIsTransitioning(false);
      }, 250);
    }
  };

  const reset = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setStep("intro");
      setIsTransitioning(false);
    }, 250);
  };

  const typeStyles = {
    quote: "border-foreground/20",
    question: "border-accent/40",
    ai: "border-success/40",
  };

  const typeBg = {
    quote: "bg-foreground/5",
    question: "bg-accent/5",
    ai: "bg-success/5",
  };

  return (
    <div id="creator-trigger" className="w-full">
      <div
        className={`transition-all duration-700 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        {/* Desktop layout */}
        <div className="hidden md:grid grid-cols-[280px_1fr_280px] gap-0 items-start">
          {/* Left: Creator info */}
          <div className="pr-8 border-r border-border">
            <div className="font-serif text-xl text-foreground mb-1">
              Riyan Das
            </div>
            <div className="text-muted text-sm mb-6">
              Producer · Songwriter · Guwahati
            </div>

            <div className="text-xs font-mono text-muted-light tracking-widest uppercase mb-3">
              Course
            </div>
            <nav className="space-y-1">
              {["Songwriting", "Composition", "Music Production", "Creative Decisions", "Ethics in Music", "Industry Experience"].map(
                (item, i) => (
                  <div
                    key={item}
                    className={`text-sm py-1.5 px-3 transition-all duration-300 ${
                      i === 0
                        ? "text-foreground font-medium"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    {item}
                  </div>
                )
              )}
            </nav>
          </div>

          {/* Center: Content */}
          <div className="px-12 py-8 min-h-[400px] flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-xs font-mono tracking-widest text-muted-light uppercase">
                {current.label}
              </span>
            </div>

            <div
              className={`flex-1 p-8 border-l-2 ${typeStyles[current.type]} ${typeBg[current.type]} transition-all duration-300 ${
                isTransitioning ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"
              }`}
            >
              {current.type === "quote" && current.author && (
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center">
                    <span className="font-serif text-xs text-foreground">RD</span>
                  </div>
                  <span className="text-muted text-xs">{current.author}</span>
                </div>
              )}
              {current.type === "question" && current.author && (
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                    <span className="font-serif text-xs text-accent">A</span>
                  </div>
                  <span className="text-muted text-xs">{current.author}</span>
                </div>
              )}
              <p
                className={`text-lg leading-relaxed ${
                  current.type === "quote"
                    ? "font-serif text-foreground"
                    : current.type === "ai"
                    ? "text-foreground"
                    : "text-foreground italic"
                }`}
              >
                {current.content}
              </p>
            </div>
          </div>

          {/* Right: Context & controls */}
          <div className="pl-8 border-l border-border">
            <div className="text-xs font-mono text-muted-light tracking-widest uppercase mb-4">
              Ask Why
            </div>
            <p className="text-sm text-muted leading-relaxed mb-8">
              Ask anything about this lesson. The AI responds using Riyan's
              knowledge, explained at your level.
            </p>

            <div className="text-xs font-mono text-muted-light tracking-widest uppercase mb-3">
              Step
            </div>
            <div className="flex gap-1 mb-6">
              {steps.map((s, i) => (
                <button
                  key={s}
                  onClick={() => {
                    setIsTransitioning(true);
                    setTimeout(() => {
                      setStep(s);
                      setIsTransitioning(false);
                    }, 250);
                  }}
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                    i <= currentIndex ? "bg-accent" : "bg-border hover:bg-muted/30"
                  }`}
                />
              ))}
            </div>

            <div className="space-y-2">
              <button
                onClick={advance}
                disabled={currentIndex >= steps.length - 1}
                className="w-full py-3 px-4 bg-accent hover:bg-accent-hover disabled:bg-muted/20 disabled:cursor-not-allowed text-background font-medium text-sm transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <span>
                  {currentIndex >= steps.length - 1 ? "Start over" : "Next"}
                </span>
                {currentIndex < steps.length - 1 && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                )}
              </button>
              {currentIndex >= steps.length - 1 && (
                <button
                  onClick={reset}
                  className="w-full py-3 px-4 border border-border hover:border-muted text-muted hover:text-foreground font-medium text-sm transition-all duration-200"
                >
                  Replay
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile layout */}
        <div className="md:hidden">
          <div className="border-b border-border pb-4 mb-6">
            <div className="font-serif text-lg text-foreground mb-0.5">
              Riyan Das
            </div>
            <div className="text-muted text-xs mb-3">
              Producer · Songwriter · Guwahati
            </div>
            <div className="flex flex-wrap gap-1">
              {["Songwriting", "Composition", "Music Production", "Creative Decisions"].map(
                (item) => (
                  <span key={item} className="text-xs px-2 py-1 bg-background-alt text-muted border border-border rounded-sm">
                    {item}
                  </span>
                )
              )}
            </div>
          </div>

          <div className="mb-6">
            <div className="text-xs font-mono text-muted-light tracking-widest uppercase mb-3">
              {current.label}
            </div>
            <div
              className={`p-5 border-l-2 ${typeStyles[current.type]} ${typeBg[current.type]} transition-all duration-300 ${
                isTransitioning ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"
              }`}
            >
              {current.type === "quote" && current.author && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-full bg-foreground/10 flex items-center justify-center">
                    <span className="font-serif text-xs text-foreground">RD</span>
                  </div>
                  <span className="text-muted text-xs">{current.author}</span>
                </div>
              )}
              {current.type === "question" && current.author && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center">
                    <span className="font-serif text-xs text-accent">A</span>
                  </div>
                  <span className="text-muted text-xs">{current.author}</span>
                </div>
              )}
              <p
                className={`text-base leading-relaxed ${
                  current.type === "quote"
                    ? "font-serif text-foreground"
                    : current.type === "ai"
                    ? "text-foreground"
                    : "text-foreground italic"
                }`}
              >
                {current.content}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex gap-1">
              {steps.map((s, i) => (
                <button
                  key={s}
                  onClick={() => {
                    setIsTransitioning(true);
                    setTimeout(() => {
                      setStep(s);
                      setIsTransitioning(false);
                    }, 250);
                  }}
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                    i <= currentIndex ? "bg-accent" : "bg-border"
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={advance}
                disabled={currentIndex >= steps.length - 1}
                className="flex-1 py-3 px-4 bg-accent hover:bg-accent-hover disabled:bg-muted/20 disabled:cursor-not-allowed text-background font-medium text-sm transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <span>
                  {currentIndex >= steps.length - 1 ? "Replay" : "Next"}
                </span>
                {currentIndex < steps.length - 1 && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
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
