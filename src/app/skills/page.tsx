export const metadata = {
  title: "Skills — Eduneuro",
  description:
    "Eduneuro's learning model can adapt across different skills — guitar, fitness, singing, public speaking, coding, and photography.",
};

export default function Skills() {
  const skills = [
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
  ];

  return (
    <main>
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
            {skills.map((skill) => (
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
    </main>
  );
}
