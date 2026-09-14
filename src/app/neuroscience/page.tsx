export const metadata = {
  title: "Learning Design — PadhaiShuru",
  description:
    "PadhaiShuru is built around how people actually learn — practice, feedback, spacing, and adaptation — grounded in well-established learning science.",
};

export default function LearningDesign() {
  const items = [
    {
      title: "Active Practice",
      desc: "Solving real problems builds skill faster than watching or reading. PadhaiShuru centers on doing.",
      evidence: "Supported by retrieval practice and testing effect research (Roediger & Karpicke, 2006).",
    },
    {
      title: "Spaced Review",
      desc: "Revisiting topics over time is more effective than cramming. The platform encourages consistent, distributed practice.",
      evidence: "Spaced repetition is one of the most robust findings in learning science (Cepeda et al., 2006).",
    },
    {
      title: "Targeted Feedback",
      desc: "Knowing what you got wrong and why is essential. Explanations and analysis help close the gap.",
      evidence: "Feedback is a core principle in formative assessment and mastery learning (Hattie & Timperley, 2007).",
    },
    {
      title: "Error Analysis",
      desc: "Tracking mistakes and weak topics helps you focus study time where it matters most.",
      evidence: "Mistake-driven practice aligns with deliberate practice frameworks (Ericsson et al., 1993).",
    },
    {
      title: "Adaptive Focus",
      desc: "The next step should depend on where you are, not a fixed syllabus. Practice adapts to your performance.",
      evidence: "Adaptive learning systems show measurable benefits when data-driven (VanLehn, 2011).",
    },
  ];

  return (
    <main>
      <section className="border-t border-border bg-background-alt">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="font-mono text-xs tracking-widest text-muted uppercase mb-6">
              Learning design
            </div>
            <h2 className="font-serif text-3xl md:text-5xl leading-snug mb-6">
              Built around how people actually learn.
            </h2>
            <p className="text-lg text-muted leading-relaxed max-w-2xl mx-auto">
              Every design choice in PadhaiShuru maps to a well-established learning
              principle — not neuroscience branding, but evidence-based practice
              that has been validated across decades of research.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6 max-w-5xl mx-auto">
            {items.map((item) => (
              <div
                key={item.title}
                className="p-6 bg-background border border-border"
              >
                <div className="font-mono text-xs tracking-widest text-accent uppercase mb-3">
                  {item.title}
                </div>
                <p className="text-sm text-foreground leading-relaxed mb-3">
                  {item.desc}
                </p>
                <p className="text-[10px] text-muted leading-relaxed">
                  {item.evidence}
                </p>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-muted mt-12 max-w-2xl mx-auto">
            These principles come from published research in cognitive science and
            educational psychology, not marketing. We cite representative papers
            where helpful — the goal is genuine learning design, not neuroscience
            branding.
          </p>
        </div>
      </section>
    </main>
  );
}
