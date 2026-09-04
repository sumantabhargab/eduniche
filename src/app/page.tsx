/**
 * Homepage — GATE-focused product entry point.
 *
 * Conversion-optimized landing page for EduNeuro.
 */

import Link from "next/link";
import GATEIntroSection from "@/components/GATEIntroSection";
import DoubtEngineMockup from "@/components/landing/DoubtEngineMockup";
import GateIntelligenceMockup from "@/components/landing/GateIntelligenceMockup";
import PersonalizedLearningMockup from "@/components/landing/PersonalizedLearningMockup";

export const metadata = {
  title: "EduNeuro — AI-Powered GATE Preparation",
  description:
    "Start with the free GATE library and AI doubt engine (5 questions/day). Upgrade for unlimited AI, live chat, and advanced analytics.",
  openGraph: {
    title: "EduNeuro — AI-Powered GATE Preparation",
    description:
      "Free GATE library, AI doubt engine, study tracker, and leaderboard. Start preparing smarter for GATE today.",
    type: "website",
  },
};

export default function Home() {
  return (
    <main>
      {/* ============ HERO ============ */}
      <section className="min-h-screen flex items-center pt-16">
        <div className="max-w-6xl mx-auto px-6 py-16 md:py-24">
          <div className="max-w-3xl">
            {/* Eyebrow */}
            <div className="font-mono text-xs tracking-[0.2em] text-accent uppercase mb-8">
              Free GATE preparation platform
            </div>

            {/* Headline */}
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.08] tracking-tight mb-8">
              Study smarter,
              <br />
              not harder, for{" "}
              <span className="text-accent">GATE</span>.
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-lg md:text-xl text-muted leading-relaxed max-w-2xl mb-10">
              Start with the free library — explore 18 years of GATE questions, take
              a diagnostic test, and get AI help (5 questions/day, no card required).
              Upgrade when you need more.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start">
              <Link
                href="/library"
                className="inline-flex items-center px-7 py-3.5 bg-foreground text-background font-medium text-sm rounded-xl transition-all duration-200 hover:opacity-90 group"
              >
                <span>Start Learning Free</span>
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
              </Link>
              <Link
                href="/gate"
                className="inline-flex items-center px-7 py-3.5 border border-border hover:border-foreground/40 text-foreground font-medium text-sm rounded-xl transition-all duration-200"
              >
                Explore GATE Papers
              </Link>
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap items-center gap-6 mt-12 pt-8 border-t border-border/60">
              <div>
                <div className="font-mono text-lg text-foreground">Free to start</div>
                <div className="text-xs text-muted">No card required</div>
              </div>
              <div className="w-px h-8 bg-border hidden sm:block" />
              <div>
                <div className="font-mono text-lg text-foreground">5 AI questions/day</div>
                <div className="text-xs text-muted">Free tier</div>
              </div>
              <div className="w-px h-8 bg-border hidden sm:block" />
              <div>
                <div className="font-mono text-lg text-foreground">20+ GATE papers</div>
                <div className="text-xs text-muted">18 years of analysis</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
          <div className="max-w-2xl mb-16 md:mb-20">
            <div className="font-mono text-xs tracking-[0.2em] text-muted uppercase mb-6 reveal">
              How it works
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl leading-[1.1] tracking-tight mb-6 reveal">
              Three steps to better preparation.
            </h2>
            <p className="text-base md:text-lg text-muted leading-relaxed reveal">
              EduNeuro adapts to how you learn — not the other way around.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 md:gap-12">
            {[
              {
                num: "01",
                title: "Assess",
                desc: "Take a quick diagnostic test to identify your weak areas across subjects. The AI maps your current level.",
              },
              {
                num: "02",
                title: "Adapt",
                desc: "EduNeuro builds a study path around your gaps. Focus on what matters — not everything.",
              },
              {
                num: "03",
                title: "Improve",
                desc: "Practice with adaptive questions, get instant feedback, and track progress. Watch your accuracy climb.",
              },
            ].map((step) => (
              <div key={step.num} className="reveal">
                <div className="font-mono text-4xl text-accent/20 mb-4">{step.num}</div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ PRODUCT DEMOS ============ */}
      <section className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
          {/* Section header */}
          <div className="max-w-2xl mb-16 md:mb-20">
            <div className="font-mono text-xs tracking-[0.2em] text-muted uppercase mb-6 reveal">
              The product
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl leading-[1.1] tracking-tight mb-6 reveal">
              Built around how you actually prepare.
            </h2>
            <p className="text-base md:text-lg text-muted leading-relaxed reveal">
              Every feature in EduNeuro is designed for the GATE preparation workflow —
              from understanding concepts to analyzing patterns to tracking progress.
            </p>
          </div>

          {/* Demo 1: AI Doubt Engine */}
          <div className="mb-20 md:mb-28">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
              <div className="lg:w-5/12 lg:sticky lg:top-24">
                <div className="font-mono text-xs tracking-[0.15em] text-accent uppercase mb-4 reveal">
                  AI Doubt Engine
                </div>
                <h3 className="font-serif text-2xl md:text-3xl leading-snug mb-4 reveal">
                  Ask any GATE question. Get a conceptual explanation.
                </h3>
                <p className="text-sm md:text-base text-muted leading-relaxed mb-6 reveal">
                  Powered by Groq and grounded in EduNeuro&apos;s library content.
                  Free users get 5 questions per day. Premium users get unlimited access.
                  The AI doesn&apos;t just answer — it breaks down the reasoning step by step.
                </p>
                <Link
                  href="/doubts"
                  className="inline-flex items-center text-sm font-medium text-accent hover:text-accent-hover transition-colors reveal"
                >
                  Try AI Doubt Engine
                  <svg className="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
              <div className="lg:w-7/12 reveal">
                <DoubtEngineMockup />
              </div>
            </div>
          </div>

          {/* Demo 2: GATE Intelligence */}
          <div className="mb-20 md:mb-28">
            <div className="flex flex-col lg:flex-row-reverse gap-8 lg:gap-12 items-start">
              <div className="lg:w-5/12 lg:sticky lg:top-24">
                <div className="font-mono text-xs tracking-[0.15em] text-accent uppercase mb-4 reveal">
                  GATE Intelligence
                </div>
                <h3 className="font-serif text-2xl md:text-3xl leading-snug mb-4 reveal">
                  18 years of GATE questions, analyzed for you.
                </h3>
                <p className="text-sm md:text-base text-muted leading-relaxed mb-6 reveal">
                  Stop randomly solving PYQs. Understand topic weightage, difficulty
                  trends, and recurring patterns across papers. EduNeuro processes
                  historical data so you can focus on what actually matters.
                </p>
                <Link
                  href="/gate"
                  className="inline-flex items-center text-sm font-medium text-accent hover:text-accent-hover transition-colors reveal"
                >
                  Explore GATE Intelligence
                  <svg className="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
              <div className="lg:w-7/12 reveal">
                <GateIntelligenceMockup />
              </div>
            </div>
          </div>

          {/* Demo 3: Personalized Learning */}
          <div>
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
              <div className="lg:w-5/12 lg:sticky lg:top-24">
                <div className="font-mono text-xs tracking-[0.15em] text-accent uppercase mb-4 reveal">
                  Personalized Learning
                </div>
                <h3 className="font-serif text-2xl md:text-3xl leading-snug mb-4 reveal">
                  Your study plan, adapted to your performance.
                </h3>
                <p className="text-sm md:text-base text-muted leading-relaxed mb-6 reveal">
                  EduNeuro tracks your weak areas and builds a study path around them.
                  Practice problems are selected based on your accuracy. Progress is
                  tracked with topic-level mastery — not just a timer.
                </p>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center text-sm font-medium text-accent hover:text-accent-hover transition-colors reveal"
                >
                  Go to Dashboard
                  <svg className="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
              <div className="lg:w-7/12 reveal">
                <PersonalizedLearningMockup />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
          <div className="text-center mb-16 md:mb-20">
            <div className="font-mono text-xs tracking-[0.2em] text-muted uppercase mb-6 reveal">
              Platform
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl leading-[1.1] tracking-tight reveal">
              Everything you need for GATE prep.
            </h2>
            <p className="text-base text-muted max-w-xl mx-auto mt-4 reveal">
              Free forever. Premium when you need more.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[
              {
                title: "AI Doubt Engine",
                desc: "Ask any GATE question and get a grounded, step-by-step explanation. Free: 5/day. Premium: unlimited.",
                tier: "premium",
              },
              {
                title: "GATE Intelligence",
                desc: "Topic weightage, difficulty trends, and topic analysis across 20+ GATE branches using historical question data.",
                tier: "free",
              },
              {
                title: "Study Library",
                desc: "Organized PYQ analysis, predicted papers, subject-wise notes, and resources structured by branch.",
                tier: "free",
              },
              {
                title: "Study Tracker",
                desc: "Timer with page-visibility detection, verified sessions, daily goals, and streak tracking.",
                tier: "free",
              },
              {
                title: "Global Leaderboard",
                desc: "Ranked by verified study time. Compete fairly with fellow GATE aspirants.",
                tier: "free",
              },
              {
                title: "Global Study Chat",
                desc: "Real-time chat with fellow aspirants. Stay motivated, share insights, discuss problems.",
                tier: "premium",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group bg-card border border-border rounded-2xl p-6 md:p-8 hover:border-foreground/20 transition-all duration-300 reveal"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-semibold text-base md:text-lg leading-snug">{feature.title}</h3>
                  {feature.tier === "premium" && (
                    <span className="text-[10px] px-2 py-0.5 bg-accent/10 text-accent rounded-full font-medium tracking-wider uppercase shrink-0 ml-2">
                      Premium
                    </span>
                  )}
                  {feature.tier === "free" && (
                    <span className="text-[10px] px-2 py-0.5 bg-green-500/10 text-green-600 rounded-full font-medium tracking-wider uppercase shrink-0 ml-2">
                      Free
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ GATE SECTION ============ */}
      <section className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
          <div className="max-w-2xl mb-12 md:mb-16">
            <div className="font-mono text-xs tracking-[0.2em] text-muted uppercase mb-6 reveal">
              GATE Preparation
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl leading-[1.1] tracking-tight mb-6 reveal">
              Stop guessing. Start analyzing.
            </h2>
            <p className="text-base md:text-lg text-muted leading-relaxed reveal">
              GATE isn&apos;t about memorizing everything. It&apos;s about knowing
              what to study, how deeply, and where to focus. EduNeuro&apos;s GATE
              Intelligence gives you that clarity — available for free.
            </p>
          </div>

          {/* Paper grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-12">
            {[
              { code: "CS", name: "Computer Science", id: "cse" },
              { code: "EC", name: "Electronics & Comm", id: "ece" },
              { code: "ME", name: "Mechanical Engg", id: "me" },
              { code: "CE", name: "Civil Engg", id: "ce" },
              { code: "EE", name: "Electrical Engg", id: "ee" },
              { code: "IN", name: "Instrumentation", id: "in" },
            ].map((paper, i) => (
              <Link
                key={paper.id}
                href={`/gate/${paper.id}`}
                className="group bg-card border border-border rounded-xl p-4 hover:border-foreground/30 transition-all duration-200 reveal"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="font-mono text-lg text-foreground mb-1 group-hover:text-accent transition-colors">
                  {paper.code}
                </div>
                <div className="text-xs text-muted leading-snug">{paper.name}</div>
                <div className="flex items-center gap-1 mt-3 text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] font-medium">Explore</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>

          <GATEIntroSection />
        </div>
      </section>

      {/* ============ FREE EXPERIENCE ============ */}
      <section className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
          <div className="max-w-2xl mb-12 md:mb-16">
            <div className="font-mono text-xs tracking-[0.2em] text-muted uppercase mb-6 reveal">
              Free experience
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl leading-[1.1] tracking-tight mb-6 reveal">
              Start learning without paying anything.
            </h2>
            <p className="text-base md:text-lg text-muted leading-relaxed reveal">
              You don&apos;t need a subscription to experience EduNeuro&apos;s core
              value. The free tier is designed to be genuinely useful.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[
              { title: "Full GATE Library", desc: "Browse 20+ branches, 18 years of question analysis, subject-wise notes, and predicted papers." },
              { title: "AI Doubt Engine", desc: "5 questions per day, powered by Groq. Get step-by-step explanations grounded in the library." },
              { title: "Study Tracker", desc: "Timer with page-visibility detection, daily goals, verified sessions, and streak tracking." },
              { title: "Diagnostic Tests", desc: "Free 10-question diagnostic to identify your weak areas across subjects." },
              { title: "Global Leaderboard", desc: "Ranked by verified study time. See how you compare with fellow aspirants." },
              { title: "Virtual Library", desc: "Enter a 2D multiplayer study space. Find your spot and study with others." },
            ].map((feature) => (
              <div key={feature.title} className="bg-card border border-border rounded-2xl p-6 reveal">
                <h3 className="font-semibold text-base mb-2">{feature.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/library"
              className="inline-flex items-center px-7 py-3.5 bg-foreground text-background font-medium text-sm rounded-xl transition-all hover:opacity-90"
            >
              Start Learning Free
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <p className="text-xs text-muted mt-3">No sign-up required for the library demo</p>
          </div>
        </div>
      </section>

      {/* ============ PRICING ============ */}
      <section className="border-t border-border" id="pricing">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
          <div className="max-w-2xl mb-12 md:mb-16">
            <div className="font-mono text-xs tracking-[0.2em] text-muted uppercase mb-6 reveal">
              Pricing
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl leading-[1.1] tracking-tight mb-6 reveal">
              Free to start. Premium when you need it.
            </h2>
            <p className="text-base md:text-lg text-muted leading-relaxed reveal">
              Use EduNeuro for free with the full GATE library, study tracker, and leaderboard.
              Upgrade to Premium for the AI Doubt Engine, live chat, and all premium content.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl">
            {/* Free */}
            <div className="bg-card border border-border rounded-2xl p-6 md:p-8 reveal">
              <div className="font-mono text-xs tracking-[0.15em] text-muted uppercase mb-4">
                Free
              </div>
              <div className="text-3xl font-bold mb-1">₹0</div>
              <div className="text-sm text-muted mb-6">forever</div>

              <ul className="space-y-3 mb-8">
                {[
                  "Full GATE Library access",
                  "5 AI doubts per day",
                  "Study timer with verification",
                  "Daily goals and streaks",
                  "Global leaderboard",
                  "Virtual Library demo",
                  "Diagnostic tests",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm">
                    <svg className="w-4 h-4 text-success mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-foreground/80">{item}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/library"
                className="block w-full py-3 text-center border border-border rounded-xl text-sm font-medium hover:border-foreground/40 transition-colors"
              >
                Start Learning Free
              </Link>
            </div>

            {/* Premium */}
            <div className="relative bg-card border border-foreground/20 rounded-2xl p-6 md:p-8 reveal">
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-foreground text-background px-4 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase">
                Recommended
              </div>
              <div className="font-mono text-xs tracking-[0.15em] text-accent uppercase mb-4">
                EduPremium
              </div>
              <div className="text-3xl font-bold mb-1">₹49<span className="text-base font-normal text-muted">/mo</span></div>
              <div className="text-sm text-muted mb-6">or ₹20/week</div>

              <ul className="space-y-3 mb-8">
                {[
                  "Unlimited AI Doubt Engine",
                  "Live global study chat",
                  "All premium library content",
                  "Predicted mock papers",
                  "Advanced analytics & insights",
                  "All Free features included",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm">
                    <svg className="w-4 h-4 text-accent mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-foreground/80">{item}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/pricing"
                className="block w-full py-3 text-center bg-foreground text-background rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Get Premium
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="border-t border-border">
        <div className="max-w-3xl mx-auto px-6 py-24 md:py-32 text-center">
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl leading-[1.1] tracking-tight mb-6 reveal">
            Start preparing smarter.
          </h2>
          <p className="text-base md:text-lg text-muted leading-relaxed max-w-xl mx-auto mb-10 reveal">
            Join GATE aspirants who use EduNeuro&apos;s AI-powered tools to prepare
            more effectively. Free to start — no card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center reveal">
            <Link
              href="/library"
              className="inline-flex items-center px-7 py-3.5 bg-foreground text-background font-medium text-sm rounded-xl transition-all hover:opacity-90"
            >
              Browse Library
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center px-7 py-3.5 border border-border hover:border-foreground/40 text-foreground font-medium text-sm rounded-xl transition-all"
            >
              View Premium Plans
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
