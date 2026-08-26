import WaitlistSection from "@/components/WaitlistSection";
import GATEIntroSection from "@/components/GATEIntroSection";

export const metadata = {
  title: "Eduneuro — Learn skills by doing, not just watching",
  description:
    "Eduneuro is an AI-powered, neuroscience-informed platform that helps you learn real-world skills through active practice, personalized feedback, and adaptive challenges.",
  openGraph: {
    title: "Eduneuro — Learn skills by doing",
    description:
      "An AI and neuroscience-informed platform for learning real skills through active practice and personalized feedback.",
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
            <div className="font-mono text-xs tracking-widest text-muted uppercase mb-8 animate-fade-in-up stagger-1">
              A new way to learn skills
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.1] tracking-tight mb-8 animate-fade-in-up stagger-2">
              Learn skills by doing.
              <br />
              Not just watching.
            </h1>

            <p className="text-lg md:text-xl text-muted leading-relaxed max-w-2xl mb-10 animate-fade-in-up stagger-3">
              Eduneuro combines AI, neuroscience-informed learning, personalized
              feedback, and challenges to help you practice real skills and
              improve over time.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 items-start animate-fade-in-up stagger-4">
              <a
                href="#waitlist"
                className="inline-flex items-center px-8 py-4 bg-accent hover:bg-accent-hover text-background font-medium text-base transition-all duration-200 group"
              >
                <span>Join early access</span>
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
              <span className="text-sm text-muted py-4">
                Starting with practical skills. Built around how people learn,
                practice, and improve.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* THE PROBLEM */}
      <section className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center mb-20">
            <div className="font-mono text-xs tracking-widest text-muted uppercase mb-6">
              The problem
            </div>
            <h2 className="font-serif text-3xl md:text-5xl leading-snug mb-6">
              Watching isn&apos;t the same as learning.
            </h2>
            <p className="text-lg text-muted leading-relaxed max-w-2xl mx-auto">
              You can watch hundreds of lessons. Finish entire courses. Save
              dozens of tutorials. But knowing what to do and being able to
              actually do it are different things.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Traditional learning */}
            <div className="p-8 md:p-10 bg-background-alt border border-border">
              <div className="font-mono text-xs tracking-widest text-muted uppercase mb-8">
                Traditional online learning
              </div>
              <div className="space-y-6">
                {[
                  { label: "Watch", desc: "Consume lessons and videos" },
                  { label: "Watch more", desc: "Consume more content" },
                  { label: "Try it alone", desc: "Practice without guidance" },
                  { label: "Get stuck", desc: "No one points out what's wrong" },
                  { label: "Lose momentum", desc: "Progress stalls" },
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center">
                        <span className="text-xs font-mono text-muted">
                          {i + 1}
                        </span>
                      </div>
                      {i < 4 && (
                        <div className="w-px h-8 bg-border mt-2" />
                      )}
                    </div>
                    <div className="pt-1">
                      <div className="text-sm font-medium text-foreground">
                        {step.label}
                      </div>
                      <div className="text-xs text-muted mt-0.5">
                        {step.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Eduneuro learning */}
            <div className="p-8 md:p-10 bg-background-dark border border-border-light">
              <div className="font-mono text-xs tracking-widest text-muted-light uppercase mb-8">
                Learning with Eduneuro
              </div>
              <div className="space-y-6">
                {[
                  {
                    label: "Learn",
                    desc: "Start with a clear, focused lesson",
                  },
                  {
                    label: "Practice",
                    desc: "Apply what you learned in real practice",
                  },
                  {
                    label: "Feedback",
                    desc: "Get specific guidance on what to improve",
                  },
                  {
                    label: "Adapt",
                    desc: "The experience adjusts to your progress",
                  },
                  {
                    label: "Improve",
                    desc: "Track growth and take on harder challenges",
                  },
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full border border-accent/40 bg-accent/10 flex items-center justify-center">
                        <span className="text-xs font-mono text-accent">
                          {i + 1}
                        </span>
                      </div>
                      {i < 4 && (
                        <div className="w-px h-8 bg-border-light/20 mt-2" />
                      )}
                    </div>
                    <div className="pt-1">
                      <div className="text-sm font-medium text-foreground-light">
                        {step.label}
                      </div>
                      <div className="text-xs text-muted-light mt-0.5">
                        {step.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GATE */}
      <GATEIntroSection />

      {/* WAITLIST */}
      <section id="waitlist" className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
          <WaitlistSection />
        </div>
      </section>
    </main>
  );
}
