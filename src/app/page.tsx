"use client";

import ProductDemo from "@/components/ProductDemo";
import CreatorExperience from "@/components/CreatorExperience";
import Leaderboard from "@/components/Leaderboard";
import WaitlistForm from "@/components/WaitlistForm";

export default function Home() {
  return (
    <main>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="#" className="font-serif text-xl text-foreground">
            Eduniche
          </a>
          <div className="flex items-center gap-8">
            <a
              href="#experience"
              className="hidden md:block text-sm text-muted hover:text-foreground transition-colors duration-200"
            >
              Experience
            </a>
            <a
              href="#creator"
              className="hidden md:block text-sm text-muted hover:text-foreground transition-colors duration-200"
            >
              Creator knowledge
            </a>
            <a
              href="#waitlist"
              className="inline-flex items-center px-5 py-2 bg-accent hover:bg-accent-hover text-background text-sm font-medium transition-colors duration-200"
            >
              Join early access
            </a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="min-h-screen flex items-center pt-16">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
          <div className="max-w-3xl">
            <div className="font-mono text-xs tracking-widest text-muted uppercase mb-8 animate-fade-in-up stagger-1">
              A new kind of learning platform
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.1] tracking-tight mb-8 animate-fade-in-up stagger-2">
              Learn what the internet
              <br />
              usually leaves out.
            </h1>

            <p className="text-lg md:text-xl text-muted leading-relaxed max-w-2xl mb-10 animate-fade-in-up stagger-3">
              Structured learning from the people who actually live the craft —
              personalized by AI to how you learn.
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
                Starting with creators and experts from Assam and beyond.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: THE PROBLEM */}
      <section className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
          <div className="grid md:grid-cols-[1fr_1fr] gap-16 md:gap-24 items-center">
            <div>
              <div className="font-mono text-xs tracking-widest text-muted uppercase mb-6">
                The problem
              </div>
              <h2 className="font-serif text-3xl md:text-4xl leading-snug mb-6">
                You can listen to the song.
                <br />
                You can watch the interview.
                <br />
                You can follow the artist.
              </h2>
              <p className="text-lg text-muted leading-relaxed">
                But the knowledge behind the work — how they make decisions,
                what mistakes shaped them, how they think through a creative
                problem — is scattered across conversations, performances, and
                years of experience. What would happen if that knowledge became
                teachable?
              </p>
            </div>

            <div className="space-y-6">
              <div className="p-6 bg-background-alt border border-border">
                <div className="font-mono text-xs tracking-widest text-muted uppercase mb-3">
                  What we consume
                </div>
                <div className="space-y-2 text-muted text-base">
                  <div>→ A finished song</div>
                  <div>→ A 2-hour interview</div>
                  <div>→ Social media fragments</div>
                  <div>→ Concert footage</div>
                  <div className="pt-2 text-muted-light">The craft thinking is missing.</div>
                </div>
              </div>

              <div className="p-6 bg-accent-subtle border border-accent/20">
                <div className="font-mono text-xs tracking-widest text-accent uppercase mb-3">
                  What we&apos;re building
                </div>
                <div className="space-y-2 text-foreground text-base">
                  <div>→ Structured learning from experts</div>
                  <div>→ Ask questions in their knowledge</div>
                  <div>→ Practice with personalized feedback</div>
                  <div>→ Learn how they actually think</div>
                  <div className="pt-2 text-accent font-medium">The craft thinking, accessible.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: SHOW THE FUTURE (INTERACTIVE DEMO) */}
      <section id="experience" className="border-t border-border bg-background-dark">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="font-mono text-xs tracking-widest text-muted-light uppercase mb-6">
              The experience
            </div>
            <h2 className="font-serif text-3xl md:text-5xl text-foreground-light leading-snug">
              Go beyond watching.
              <br />
              Learn how they think.
            </h2>
          </div>

          <ProductDemo />
        </div>
      </section>

      {/* SECTION 4: MEET THE EXPERIENCE */}
      <section id="creator" className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="font-mono text-xs tracking-widest text-muted uppercase mb-6">
              Meet the experience
            </div>
            <h2 className="font-serif text-3xl md:text-5xl leading-snug mb-4">
              Riyan Das
            </h2>
            <div className="text-muted text-base">
              Producer · Songwriter · Guwahati
            </div>
          </div>

          <CreatorExperience />

          <div className="max-w-3xl mx-auto mt-16 text-center">
            <p className="text-lg text-muted leading-relaxed">
              This is a fictional example — not a real person.
              It shows what learning from an expert could feel like.
              The creator supplies the knowledge.
              The platform makes it teachable.
              AI personalizes it to how you learn.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 5: WHY AI MATTERS */}
      <section className="border-t border-border bg-background-alt">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="font-mono text-xs tracking-widest text-muted uppercase mb-6">
              Why AI is essential
            </div>
            <h2 className="font-serif text-3xl md:text-5xl leading-snug mb-6">
              One lesson doesn&apos;t fit one learner.
            </h2>
            <p className="text-lg text-muted leading-relaxed">
              AI doesn&apos;t replace the creator.
              It adapts their knowledge to how you actually learn.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                title: "Ask the lesson anything.",
                desc: "Got a question mid-lesson? Ask it. The AI answers using the creator's actual knowledge.",
              },
              {
                title: "You're struggling with rhythm? We'll approach it differently.",
                desc: "The AI detects where you're stuck and adjusts — slower explanations, different examples, targeted practice.",
              },
              {
                title: "You've already mastered this. Let's move forward.",
                desc: "No repeating what you already know. The AI recognizes what you understand and skips ahead.",
              },
              {
                title: "Here's where your arrangement is losing tension.",
                desc: "After you practice, the AI gives specific feedback — not a score, but actionable insight based on the creator's principles.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="p-8 bg-background border border-border hover:border-accent/30 transition-colors duration-300 group"
              >
                <div className="w-8 h-px bg-accent mb-6 group-hover:w-12 transition-all duration-300" />
                <h3 className="font-serif text-xl mb-3">{item.title}</h3>
                <p className="text-muted text-base leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6: THE LEARNING LOOP */}
      <section className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="font-mono text-xs tracking-widest text-muted uppercase mb-6">
              The long-term architecture
            </div>
            <h2 className="font-serif text-3xl md:text-5xl leading-snug mb-6">
              A platform that learns how to teach.
            </h2>
            <p className="text-lg text-muted leading-relaxed">
              The more learners use the system, the better it gets at helping
              each person learn. This is the long-term direction.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="space-y-0">
              {[
                "Creator knowledge enters the system",
                "Learners interact, ask questions, practice",
                "The AI identifies misconceptions and patterns",
                "Learning outcomes shape personalization",
                "The system improves for the next learner",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-6 py-4 border-b border-border last:border-0">
                  <div className="font-mono text-xs text-accent mt-1">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="text-base text-foreground pt-0.5">
                    {step}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 p-6 bg-background-alt border border-border">
              <p className="text-sm text-muted leading-relaxed">
                <span className="font-medium text-foreground">The principle:</span>{" "}
                Every learner interaction makes the system smarter about how to
                teach the next person — without replacing the creator&apos;s
                authority over their own knowledge.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7: REGIONAL EXPANSION */}
      <section className="border-t border-border bg-background-dark">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
          <div className="max-w-3xl">
            <div className="font-mono text-xs tracking-widest text-muted-light uppercase mb-6">
              Where we start
            </div>
            <h2 className="font-serif text-3xl md:text-5xl text-foreground-light leading-snug mb-8">
              Assam.
              <br />
              Then the Northeast.
              <br />
              Then everywhere.
            </h2>
            <p className="text-lg text-muted-light leading-relaxed mb-12 max-w-2xl">
              The most meaningful expertise is often the most local. Regional
              languages, dialects, cultural knowledge — this is where the
              platform begins. The infrastructure scales beyond any single
              language or region.
            </p>

            <div className="grid grid-cols-3 gap-0 max-w-lg">
              {[
                {
                  label: "ASSAM",
                  status: "Active",
                  active: true,
                },
                {
                  label: "NORTHEAST",
                  status: "Next",
                  active: false,
                },
                {
                  label: "REGIONAL INDIA",
                  status: "Vision",
                  active: false,
                },
              ].map((region) => (
                <div
                  key={region.label}
                  className={`p-6 border ${
                    region.active
                      ? "border-accent bg-accent/5"
                      : "border-border-light"
                  }`}
                >
                  <div
                    className={`font-mono text-sm tracking-widest mb-2 ${
                      region.active ? "text-accent" : "text-muted-light"
                    }`}
                  >
                    {region.label}
                  </div>
                  <div
                    className={`text-xs ${
                      region.active ? "text-accent/80" : "text-muted-light/60"
                    }`}
                  >
                    {region.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 8: CREATOR MODEL */}
      <section className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
          <div className="grid md:grid-cols-[1fr_1fr] gap-16 md:gap-24 items-center">
            <div>
              <div className="font-mono text-xs tracking-widest text-muted uppercase mb-6">
                For creators
              </div>
              <h2 className="font-serif text-3xl md:text-4xl leading-snug mb-6">
                The expert remains the authority.
              </h2>
              <p className="text-lg text-muted leading-relaxed mb-8">
                You don&apos;t need to become a course entrepreneur. The
                platform handles the infrastructure. You contribute the
                knowledge, experience, and perspective only you have.
              </p>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                  <span className="text-muted">Course structuring</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                  <span className="text-muted">Technology and payments</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                  <span className="text-muted">Student management</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                  <span className="text-muted">AI assistance and localization</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                  <span className="text-muted">Analytics and distribution</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-8 bg-background-alt border border-border">
                <div className="font-mono text-xs tracking-widest text-muted uppercase mb-4">
                  You provide
                </div>
                <div className="space-y-3">
                  {[
                    "Knowledge",
                    "Experience",
                    "Perspective",
                    "Authenticity",
                  ].map((item) => (
                    <div key={item} className="text-base text-foreground">
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-center py-4">
                <svg className="w-6 h-6 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>

              <div className="p-8 bg-background-alt border border-border">
                <div className="font-mono text-xs tracking-widest text-muted uppercase mb-4">
                  Platform handles
                </div>
                <div className="space-y-3">
                  {[
                    "Course structuring",
                    "Technology",
                    "Payments",
                    "AI personalization",
                    "Analytics",
                    "Distribution",
                  ].map((item) => (
                    <div key={item} className="text-base text-foreground">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 9: EARLY ACCESS / WAITLIST */}
      <section id="waitlist" className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
          <div className="grid md:grid-cols-[1fr_1fr] gap-16 md:gap-24">
            <div>
              <div className="font-mono text-xs tracking-widest text-muted uppercase mb-6">
                Early access
              </div>
              <h2 className="font-serif text-3xl md:text-5xl leading-snug mb-6">
                Be here when
                <br />
                the first ones launch.
              </h2>
              <p className="text-lg text-muted leading-relaxed mb-8">
                We&apos;re opening the first learning experiences with a small
                group of early learners and creators. If this resonates with
                you, join the waitlist.
              </p>

              <div className="space-y-4 text-sm text-muted">
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                  <span>
                    Get priority access when we open new learning experiences
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                  <span>
                    Share your unique link — verified referrals move you up
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                  <span>
                    Help shape what we build next — early members influence
                    priorities
                  </span>
                </div>
              </div>

              {/* Referral reward notice */}
              <div className="mt-8 p-4 bg-background-alt border border-border">
                <div className="text-xs font-mono text-muted-light tracking-widest uppercase mb-2">
                  Early supporter reward
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  The top 5 members with 50+ verified referrals will be eligible
                  for a chance to win ₹10,000, subject to the final campaign
                  terms.{" "}
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById("reward-terms");
                      el?.classList.toggle("hidden");
                    }}
                    className="text-accent hover:underline"
                  >
                    View terms
                  </button>
                </p>
                <div id="reward-terms" className="hidden mt-3 pt-3 border-t border-border">
                  <ul className="text-xs text-muted space-y-1">
                    <li>
                      • A verified referral counts only when a new unique email
                      joins through your link.
                    </li>
                    <li>• Self-referrals and fake emails don&apos;t count.</li>
                    <li>
                      • The reward depends on the startup reaching required
                      funding conditions.
                    </li>
                    <li>
                      • Winners will be selected after the campaign period ends.
                    </li>
                    <li>
                      • This is not a guaranteed payment — it&apos;s an
                      opportunity for early supporters.
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <div className="bg-background-alt border border-border p-8 md:p-10">
                <WaitlistForm />

                {/* Post-signup referral panel - shown via onSuccess or URL param */}
                <div
                  id="referral-panel"
                  className="hidden mt-8 pt-8 border-t border-border"
                >
                  <div className="text-center mb-6">
                    <h3 className="font-serif text-xl text-foreground mb-2">
                      Share your link
                    </h3>
                    <p className="text-sm text-muted">
                      Verified referrals move you up the waitlist.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <input
                        id="referral-link"
                        type="text"
                        readOnly
                        className="flex-1 px-4 py-3 bg-background border border-border text-muted text-sm font-mono"
                      />
                      <button
                        onClick={async () => {
                          const input = document.getElementById(
                            "referral-link"
                          ) as HTMLInputElement;
                          await navigator.clipboard.writeText(input.value);
                          const btn = document.activeElement as HTMLButtonElement;
                          const original = btn.textContent;
                          btn.textContent = "Copied";
                          setTimeout(() => {
                            btn.textContent = original;
                          }, 2000);
                        }}
                        className="px-4 py-3 bg-accent hover:bg-accent-hover text-background text-sm font-medium transition-colors duration-200 whitespace-nowrap"
                      >
                        Copy
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(
                          "I just joined Eduniche's early access. Check it out — learn from creators who actually know their craft."
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-3 border border-border hover:border-success hover:text-success text-muted text-sm text-center transition-colors duration-200"
                      >
                        WhatsApp
                      </a>
                      <button
                        onClick={() => {
                          navigator.share?.({
                            title: "Eduniche — Learn from creators",
                            text: "I just joined Eduniche's early access. Learn from people who actually know their craft.",
                          }).catch(() => {});
                        }}
                        className="flex-1 py-3 border border-border hover:border-accent hover:text-accent text-muted text-sm transition-colors duration-200"
                      >
                        Share
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Leaderboard */}
              <div className="mt-8 bg-background-alt border border-border p-8 md:p-10">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="font-mono text-xs tracking-widest text-muted uppercase mb-1">
                      Early community
                    </div>
                    <div className="text-sm text-muted">Top referrers</div>
                  </div>
                </div>
                <Leaderboard />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border bg-background-dark">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-[1fr_1fr_1fr] gap-12">
            <div>
              <div className="font-serif text-xl text-foreground-light mb-4">
                Eduniche
              </div>
              <p className="text-sm text-muted-light leading-relaxed max-w-xs">
                Structured learning from the people who actually live the craft,
                personalized by AI to how you learn.
              </p>
            </div>

            <div>
              <div className="font-mono text-xs tracking-widest text-muted-light uppercase mb-4">
                Platform
              </div>
              <div className="space-y-2">
                <a href="#experience" className="block text-sm text-muted-light hover:text-foreground-light transition-colors">
                  Experience
                </a>
                <a href="#creator" className="block text-sm text-muted-light hover:text-foreground-light transition-colors">
                  Creator knowledge
                </a>
                <a href="#waitlist" className="block text-sm text-muted-light hover:text-foreground-light transition-colors">
                  Early access
                </a>
              </div>
            </div>

            <div>
              <div className="font-mono text-xs tracking-widest text-muted-light uppercase mb-4">
                Contact
              </div>
              <div className="space-y-2">
                <a
                  href="mailto:hello@eduniche.com"
                  className="block text-sm text-muted-light hover:text-foreground-light transition-colors"
                >
                  hello@eduniche.com
                </a>
              </div>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-border-light flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-xs text-muted-light">
              Eduniche. All rights reserved.
            </div>
            <div className="text-xs text-muted-light">
              Creator-led. AI-assisted. Learner-personalized.
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
