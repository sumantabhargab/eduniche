/**
 * Homepage — GATE-focused product entry point.
 *
 * What EduNeuro currently provides:
 * - Organized GATE study Library
 * - Free/Premium content
 * - Study timer and verified sessions
 * - Study history, goals, streaks
 * - Global leaderboard
 * - Premium: AI Doubt Engine + Global Chat
 */

import GATEIntroSection from "@/components/GATEIntroSection";

export const metadata = {
  title: "EduNeuro — GATE Exam Preparation Platform",
  description:
    "Organized GATE study Library, study tracker with streaks, global leaderboard, AI-powered doubt engine, and live study chat. Start preparing smarter.",
  openGraph: {
    title: "EduNeuro — GATE Exam Preparation Platform",
    description:
      "Organized Library, study tracker, leaderboard, AI Doubt Engine, and live chat for GATE aspirants.",
    type: "website",
  },
};

export default function Home() {
  return (
    <main>
      {/* HERO */}
      <section className="min-h-screen flex items-center pt-16">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
          <div className="max-w-3xl">
            <div className="font-mono text-xs tracking-widest text-muted uppercase mb-8">
              GATE Exam Preparation
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.1] tracking-tight mb-8">
              Study smarter for GATE.
              <br />
              Track, practice, rank.
            </h1>

            <p className="text-lg md:text-xl text-muted leading-relaxed max-w-2xl mb-10">
              EduNeuro gives GATE aspirants an organized study Library, verified study
              sessions with streaks, a global leaderboard, AI-powered doubt solving,
              and a live study community.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <a
                href="/library"
                className="inline-flex items-center px-8 py-4 bg-foreground text-background font-medium text-base transition-all duration-200 hover:opacity-90"
              >
                <span>Browse Library</span>
                <svg
                  className="w-4 h-4 ml-2"
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
              <a
                href="/pricing"
                className="inline-flex items-center px-8 py-4 border border-border hover:border-foreground text-foreground font-medium text-base transition-all duration-200"
              >
                <span>Get Premium</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES OVERVIEW */}
      <section className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
          <div className="text-center mb-16">
            <div className="font-mono text-xs tracking-widest text-muted uppercase mb-6">
              What you get
            </div>
            <h2 className="font-serif text-3xl md:text-5xl leading-snug">
              Everything you need for GATE prep
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                emoji: "📚",
                title: "Organized Library",
                desc: "PYQ analysis, predicted papers, subject-wise notes, and resources — structured by exam and branch.",
                free: true,
              },
              {
                emoji: "⏱️",
                title: "Study Tracker",
                desc: "Timer with page-visibility detection, verified sessions, daily goals, and streak tracking.",
                free: true,
              },
              {
                emoji: "🏆",
                title: "Leaderboard",
                desc: "Ranked by verified study time across the community. Compete fairly.",
                free: true,
              },
              {
                emoji: "🤖",
                title: "AI Doubt Engine",
                desc: "Ask any GATE question and get grounded answers from the EduNeuro library. Powered by Groq.",
                premium: true,
              },
              {
                emoji: "💬",
                title: "Global Study Chat",
                desc: "Real-time chat with fellow GATE aspirants. Stay motivated, share insights.",
                premium: true,
              },
              {
                emoji: "⭐",
                title: "Premium Content",
                desc: "Unlock predicted mock papers, in-depth notes, and premium library resources.",
                premium: true,
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-card border border-border rounded-2xl p-6 md:p-8"
              >
                <div className="text-3xl mb-4">{feature.emoji}</div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-lg">{feature.title}</h3>
                  {feature.premium && (
                    <span className="text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 rounded-full font-medium">
                      Premium
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border">
        <div className="max-w-4xl mx-auto px-6 py-24 md:py-32 text-center">
          <h2 className="font-serif text-3xl md:text-5xl leading-snug mb-6">
            Start preparing today.
          </h2>
          <p className="text-lg text-muted mb-10 max-w-2xl mx-auto">
            Browse the free Library or upgrade to Premium for AI-powered doubt
            solving, live chat, and all premium resources.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/library"
              className="inline-flex items-center px-8 py-4 bg-foreground text-background font-medium text-base transition-all hover:opacity-90"
            >
              Browse Library
            </a>
            <a
              href="/pricing"
              className="inline-flex items-center px-8 py-4 border border-border hover:border-foreground text-foreground font-medium text-base transition-all"
            >
              View Plans — from ₹20/week
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
