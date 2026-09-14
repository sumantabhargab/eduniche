export const metadata = {
  title: "Skills — PadhaiShuru",
  description:
    "PadhaiShuru's learning model is designed around how humans actually improve — a framework that can apply to any skill domain.",
};

export default function Skills() {
  const skills = [
    {
      title: "GATE Preparation",
      desc: "The first and current focus. Real questions, real analysis, real progress tracking — built for GATE aspirants.",
      available: true,
    },
    {
      title: "Future Domains",
      desc: "The same practice → feedback → adaptation loop applies to many skills. We'll expand carefully, one domain at a time.",
      available: false,
    },
  ];

  return (
    <main>
      <section id="skills" className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="font-mono text-xs tracking-widest text-muted uppercase mb-6">
              Scope
            </div>
            <h2 className="font-serif text-3xl md:text-5xl leading-snug mb-6">
              One skill, done well.
            </h2>
            <p className="text-lg text-muted leading-relaxed max-w-2xl mx-auto">
              PadhaiShuru is built around a single skill right now: GATE preparation.
              The learning model — practice, feedback, adaptation — is universal,
              but we ship carefully.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {skills.map((skill) => (
              <div
                key={skill.title}
                className={`p-8 bg-background border rounded-2xl transition-colors duration-300 group ${
                  skill.available
                    ? "border-accent/30 hover:border-accent/50"
                    : "border-border opacity-70"
                }`}
              >
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-px bg-accent group-hover:w-12 transition-all duration-300" />
                  {skill.available && (
                    <span className="text-[10px] px-2 py-0.5 bg-green-500/10 text-green-600 rounded-full font-medium tracking-wider uppercase">
                      Live
                    </span>
                  )}
                  {!skill.available && (
                    <span className="text-[10px] px-2 py-0.5 bg-muted/10 text-muted rounded-full font-medium tracking-wider uppercase">
                      Coming
                    </span>
                  )}
                </div>
                <h3 className="font-serif text-xl mb-3">{skill.title}</h3>
                <p className="text-sm text-muted leading-relaxed">
                  {skill.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
