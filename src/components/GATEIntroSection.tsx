"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Landing page section that introduces the /gate product.
 * Tracks gate_cta_viewed and gate_cta_clicked events.
 */
export default function GATEIntroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [viewed, setViewed] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || viewed) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setViewed(true);
          if (typeof window !== "undefined") {
            try {
              window.dispatchEvent(
                new CustomEvent("eduneuro:track", {
                  detail: { event: "gate_cta_viewed" },
                })
              );
            } catch {}
          }
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [viewed]);

  const handleCTAClick = () => {
    try {
      window.dispatchEvent(
        new CustomEvent("eduneuro:track", {
          detail: { event: "gate_cta_clicked" },
        })
      );
    } catch {}
  };

  return (
    <section
      ref={sectionRef}
      className="border-t border-border"
    >
      <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
        <div className="max-w-2xl">
          <div className="font-mono text-xs tracking-widest text-accent uppercase mb-8 animate-fade-in-up">
            NEW — GATE Exam Intelligence
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl leading-[1.1] tracking-tight mb-8 animate-fade-in-up stagger-1">
            STOP RANDOMLY SOLVING PYQs.
          </h2>

          <p className="text-lg md:text-xl text-muted leading-relaxed max-w-2xl mb-10 animate-fade-in-up stagger-2">
            Explore historical patterns, topic trends, and intelligent
            practice built from years of GATE questions. Understand
            what topics recur, how marks distribute, and where to focus
            — without guessing.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-start animate-fade-in-up stagger-3">
            <a
              href="/gate"
              onClick={handleCTAClick}
              className="inline-flex items-center px-8 py-4 bg-accent hover:bg-accent-hover text-background font-medium text-base transition-all duration-200 group"
            >
              <span>Explore GATE Intelligence</span>
              <svg
                className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </a>

            <span className="text-xs text-muted py-4 max-w-sm">
              No exam can be predicted perfectly. Historical data cannot
              reveal the future with certainty, but it can reveal patterns
              worth understanding.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
