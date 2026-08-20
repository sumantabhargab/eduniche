"use client";

import ProductDemo from "@/components/ProductDemo";
import Leaderboard from "@/components/Leaderboard";
import WaitlistForm from "@/components/WaitlistForm";

export default function Home() {
  return (
    <main>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="#" className="font-serif text-xl text-foreground">
            Eduneuro
          </a>
          <div className="flex items-center gap-8">
            <a
              href="#how-it-works"
              className="hidden md:block text-sm text-muted hover:text-foreground transition-colors duration-200"
            >
              How it works
            </a>
            <a
              href="#skills"
              className="hidden md:block text-sm text-muted hover:text-foreground transition-colors duration-200"
            >
              Skills
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

      {/* SECTION 2: THE PROBLEM */}
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

      {/* SECTION 3: INTERACTIVE DEMO */}
      <section className="border-t border-border bg-background-dark">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="font-mono text-xs tracking-widest text-muted-light uppercase mb-6">
              The learning experience
            </div>
            <h2 className="font-serif text-3xl md:text-5xl text-foreground-light leading-snug mb-4">
              See how it works.
            </h2>
            <p className="text-lg text-muted-light leading-relaxed">
              An example of learning guitar — learn, practice, get feedback, and
              improve.
            </p>
          </div>

          <ProductDemo />
        </div>
      </section>

      {/* SECTION 4: HOW IT WORKS */}
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

      {/* SECTION 5: WHY A GOOD TEACHER WORKS */}
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

      {/* SECTION 6: AI ADAPTATION */}
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
              AI isn't just a chatbot beside a course. It's an active part of
              the learning loop — responding to how you practice, where you
              struggle, and when you're ready for more.
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

      {/* SECTION 7: GAMIFICATION */}
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
              Learning doesn't have to be lonely. Challenges, streaks, and
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
                completion — not just who's already the strongest. The
                experience rewards meaningful practice over raw ability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 8: SKILLS */}
      <section id="skills" className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="font-mono text-xs tracking-widest text-muted uppercase mb-6">
              Skills
            </div>
            <h2 className="font-serif text-3xl md:text-5xl leading-snug mb-6">
              Built for practical skills.
            </h2>
            <p className="text-lg text-muted leading-relaxed max-w-2xl mx-auto">
              Eduneuro&apos;s learning model can adapt across different skills —
              each one needs its own practice system, feedback, and progression.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                title: "Guitar",
                desc: "Learn a concept. Practice it. Get targeted guidance. Progress at your own pace.",
              },
              {
                title: "Fitness",
                desc: "Follow structured challenges, track performance, and use AI-assisted feedback to improve your practice.",
              },
              {
                title: "Singing",
                desc: "Practice specific skills, identify weaknesses, and work through progressively more difficult exercises.",
              },
              {
                title: "Public Speaking",
                desc: "Practice, review performance, and receive targeted feedback to build confidence over time.",
              },
              {
                title: "Coding",
                desc: "Write real code, get feedback on logic and style, and build skills through deliberate practice.",
              },
              {
                title: "Photography",
                desc: "Practice composition, get feedback on your shots, and develop an eye for better images.",
              },
            ].map((skill) => (
              <div
                key={skill.title}
                className="p-8 bg-background border border-border hover:border-accent/30 transition-colors duration-300 group"
              >
                <div className="w-8 h-px bg-accent mb-6 group-hover:w-12 transition-all duration-300" />
                <h3 className="font-serif text-xl mb-3">{skill.title}</h3>
                <p className="text-sm text-muted leading-relaxed">
                  {skill.desc}
                </p>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-muted mt-12 max-w-2xl mx-auto">
            Each skill requires its own specialized practice system, feedback
            mechanisms, and progression model. We build carefully — one skill
            at a time.
          </p>
        </div>
      </section>

      {/* SECTION 9: NEUROSCIENCE */}
      <section className="border-t border-border bg-background-alt">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="font-mono text-xs tracking-widest text-muted uppercase mb-6">
              Designed around learning
            </div>
            <h2 className="font-serif text-3xl md:text-5xl leading-snug mb-6">
              Your brain doesn&apos;t learn from watching once.
            </h2>
            <p className="text-lg text-muted leading-relaxed max-w-2xl mx-auto">
              Learning involves attention, practice, feedback, remembering, and
              repetition. Eduneuro is built around these processes to make
              online learning more active and effective.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6 max-w-5xl mx-auto">
            {[
              {
                title: "Focus",
                desc: "Learn without unnecessary overload.",
              },
              {
                title: "Practice",
                desc: "Build skills by actively doing.",
              },
              {
                title: "Feedback",
                desc: "Understand what needs to change.",
              },
              {
                title: "Memory",
                desc: "Revisit important skills instead of forgetting them.",
              },
              {
                title: "Adaptation",
                desc: "Adjust the next step based on your progress.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="p-6 bg-background border border-border text-center"
              >
                <div className="font-mono text-xs tracking-widest text-accent uppercase mb-3">
                  {item.title}
                </div>
                <p className="text-sm text-muted leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-muted mt-12 max-w-2xl mx-auto">
            The neuroscience is the foundation, not the marketing. What matters
            is that the experience feels responsive, personalized, and designed
            around how you actually improve.
          </p>
        </div>
      </section>

      {/* SECTION 10: EARLY ACCESS / WAITLIST */}
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
                group of early learners. If this resonates with you, join the
                waitlist.
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

                {/* Post-signup referral panel */}
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
                          "I just joined Eduneuro's early access. Check it out — learn practical skills with AI and neuroscience-informed practice."
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
                            title: "Eduneuro — Learn skills by doing",
                            text: "I just joined Eduneuro's early access. Learn practical skills with AI and neuroscience-informed practice.",
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
                Eduneuro
              </div>
              <p className="text-sm text-muted-light leading-relaxed max-w-xs">
                An AI-powered, neuroscience-informed platform for learning real
                skills through active practice and personalized feedback.
              </p>
            </div>

            <div>
              <div className="font-mono text-xs tracking-widest text-muted-light uppercase mb-4">
                Platform
              </div>
              <div className="space-y-2">
                <a href="#how-it-works" className="block text-sm text-muted-light hover:text-foreground-light transition-colors">
                  How it works
                </a>
                <a href="#skills" className="block text-sm text-muted-light hover:text-foreground-light transition-colors">
                  Skills
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
                  href="mailto:hello@eduneuro.com"
                  className="block text-sm text-muted-light hover:text-foreground-light transition-colors"
                >
                  hello@eduneuro.com
                </a>
              </div>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-border-light flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-xs text-muted-light">
              Eduneuro. All rights reserved.
            </div>
            <div className="text-xs text-muted-light">
              Learn. Practice. Get feedback. Improve.
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
