import ProductDemo from "@/components/ProductDemo";

export const metadata = {
  title: "How it works — Eduneuro",
  description:
    "Learn, practice, get feedback, adapt, repeat, and improve — the loop that builds real skills.",
};

export default function HowItWorks() {
  return (
    <main>
      {/* SECTION 1: HOW IT WORKS */}
      <section id="how-it-works" className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center mb-20">
            <div className="font-mono text-xs tracking-widest text-muted uppercase mb-6">
              How you learn
            </div>
            <h2 className="font-serif text-3xl md:text-5xl leading-snug mb-6">
              The loop that builds skills.
            </h2>
            <p className="text-lg text-muted leading-relaxed max-w-2xl mx-auto">
              Every learning experience follows the same loop — designed around
              how people actually learn, practice, and remember.
            </p>
          </div>

          {/* Core loop bar */}
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-0 mb-20 max-w-4xl mx-auto">
            {[
              "Learn",
              "Do",
              "Feedback",
              "Adapt",
              "Repeat",
              "Improve",
            ].map((word, i, arr) => (
              <div key={word} className="flex items-center">
                <div
                  className={`px-4 py-2.5 font-mono text-sm tracking-wider ${
                    i === 0
                      ? "bg-accent text-background"
                      : i === arr.length - 1
                        ? "bg-success text-background"
                        : "bg-background-alt text-foreground border border-border"
                  }`}
                >
                  {word}
                </div>
                {i < arr.length - 1 && (
                  <svg
                    className="w-4 h-4 text-muted-light mx-1 md:mx-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                )}
              </div>
            ))}
          </div>

          {/* Detailed steps */}
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  num: "01",
                  title: "Learn",
                  desc: "Start with a structured lesson designed to make the next step clear without overwhelming you. Information is delivered in the right amount, at the right pace.",
                },
                {
                  num: "02",
                  title: "Do",
                  desc: "Don't just finish the lesson. Apply what you learned through real practice. Active engagement is where skills actually develop.",
                },
                {
                  num: "03",
                  title: "Get feedback",
                  desc: "Depending on the skill, AI can analyze your performance, identify mistakes, and help you understand exactly what needs to change.",
                },
                {
                  num: "04",
                  title: "Adapt",
                  desc: "If you're struggling, the experience changes. You may get a simpler explanation, a different example, or targeted practice on what's hard.",
                },
                {
                  num: "05",
                  title: "Repeat",
                  desc: "Important skills return through spaced practice instead of being forgotten after one lesson. Repetition is structured, not random.",
                },
                {
                  num: "06",
                  title: "Improve",
                  desc: "Track progress over time and gradually take on more difficult challenges. Growth is visible, measurable, and motivating.",
                },
              ].map((step) => (
                <div
                  key={step.num}
                  className="p-8 bg-background border border-border hover:border-accent/30 transition-colors duration-300 group"
                >
                  <div className="font-mono text-xs text-accent mb-4">
                    {step.num}
                  </div>
                  <h3 className="font-serif text-xl mb-3">{step.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: WHY A GOOD TEACHER WORKS */}
      <section className="border-t border-border bg-background-alt">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
          <div className="grid md:grid-cols-[1fr_1fr] gap-16 md:gap-24 items-center">
            <div>
              <div className="font-mono text-xs tracking-widest text-muted uppercase mb-6">
                Learning principles
              </div>
              <h2 className="font-serif text-3xl md:text-4xl leading-snug mb-6">
                A great teacher doesn&apos;t just give you answers.
              </h2>
              <p className="text-lg text-muted leading-relaxed mb-8">
                They notice where you&apos;re stuck. They explain things
                another way. They simplify what&apos;s difficult. They correct
                mistakes. They know when you&apos;re ready for the next level.
              </p>
              <p className="text-lg text-muted leading-relaxed">
                Eduneuro uses AI to bring more of that adaptive learning
                experience into online skill development. Not to replace
                instructors — but to make learning more responsive, available,
                and personalized.
              </p>
            </div>

            <div className="space-y-4">
              {[
                "Notices where you're stuck",
                "Explains things another way",
                "Simplifies difficult concepts",
                "Gives you something to practice",
                "Corrects mistakes",
                "Knows when you're ready for more",
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 p-5 bg-background border border-border"
                >
                  <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg
                      className="w-3.5 h-3.5 text-accent"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span className="text-sm text-foreground leading-relaxed">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: AI ADAPTATION */}
      <section className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="font-mono text-xs tracking-widest text-muted uppercase mb-6">
              How AI helps
            </div>
            <h2 className="font-serif text-3xl md:text-5xl leading-snug mb-6">
              AI that adapts to your practice.
            </h2>
            <p className="text-lg text-muted leading-relaxed max-w-2xl mx-auto">
              AI isn&apos;t just a chatbot beside a course. It&apos;s an active part of
              the learning loop — responding to how you practice, where you
              struggle, and when you&apos;re ready for more.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                title: "You're struggling?",
                desc: "The AI detects where you're stuck and adjusts — slower explanations, different examples, or targeted practice on that specific area.",
              },
              {
                title: "Making the same mistake?",
                desc: "The AI notices patterns in your practice and focuses on the weakness that's holding you back.",
              },
              {
                title: "Already mastering it?",
                desc: "Move forward instead of repeating what you already know. The AI recognizes your progress and adjusts accordingly.",
              },
              {
                title: "Losing progress?",
                desc: "Important skills return at the right time. Spaced review ensures what you learn stays with you.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="p-8 bg-background border border-border hover:border-accent/30 transition-colors duration-300 group"
              >
                <div className="w-8 h-px bg-accent mb-6 group-hover:w-12 transition-all duration-300" />
                <h3 className="font-serif text-xl mb-3">{item.title}</h3>
                <p className="text-muted text-base leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: INTERACTIVE DEMO */}
      <section className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="font-mono text-xs tracking-widest text-muted uppercase mb-6">
              The learning experience
            </div>
            <h2 className="font-serif text-3xl md:text-5xl text-foreground leading-snug mb-4">
              See how it works.
            </h2>
            <p className="text-lg text-muted leading-relaxed">
              An example of learning guitar — learn, practice, get feedback, and
              improve.
            </p>
          </div>

          <ProductDemo />
        </div>
      </section>

      {/* SECTION 5: GAMIFICATION */}
      <section className="border-t border-border bg-background-dark">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="font-mono text-xs tracking-widest text-muted-light uppercase mb-6">
              Learning is better when you want to come back
            </div>
            <h2 className="font-serif text-3xl md:text-5xl text-foreground-light leading-snug mb-6">
              Turn progress into a challenge.
            </h2>
            <p className="text-lg text-muted-light leading-relaxed max-w-2xl mx-auto">
              Learning doesn&apos;t have to be lonely. Challenges, streaks, and
              friendly competition make practice more engaging — without feeling
              like a game.
            </p>
          </div>

          {/* Example challenge card */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-background-dark border border-border-light p-8 md:p-10">
              <div className="font-mono text-xs tracking-widest text-muted-light uppercase mb-6">
                Example challenge
              </div>
              <h3 className="font-serif text-2xl text-foreground-light mb-2">
                30-Day Guitar Foundation
              </h3>
              <p className="text-sm text-muted-light mb-8">
                Build consistent practice habits and master core skills.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-light">
                    Daily practice streaks
                  </span>
                  <span className="font-mono text-xs text-accent">
                    12 / 30 days
                  </span>
                </div>
                <div className="w-full h-1.5 bg-background/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all duration-500"
                    style={{ width: "40%" }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="text-center p-4 bg-background/50 border border-border-light">
                  <div className="font-mono text-lg text-foreground-light">
                    89%
                  </div>
                  <div className="text-xs text-muted-light mt-1">
                    Chord accuracy
                  </div>
                </div>
                <div className="text-center p-4 bg-background/50 border border-border-light">
                  <div className="font-mono text-lg text-foreground-light">
                    7
                  </div>
                  <div className="text-xs text-muted-light mt-1">
                    Day streak
                  </div>
                </div>
                <div className="text-center p-4 bg-background/50 border border-border-light">
                  <div className="font-mono text-lg text-foreground-light">
                    +14%
                  </div>
                  <div className="text-xs text-muted-light mt-1">
                    Improvement
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-light leading-relaxed">
                Progress is measured by consistency, improvement, and
                completion — not just who&apos;s already the strongest. The
                experience rewards meaningful practice over raw ability.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
