export const metadata = {
  title: "Neuroscience — Eduneuro",
  description:
    "Eduneuro is built around attention, practice, feedback, memory, and adaptation — the processes your brain actually uses to learn.",
};

export default function Neuroscience() {
  const items = [
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
  ];

  return (
    <main>
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
            {items.map((item) => (
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
    </main>
  );
}
