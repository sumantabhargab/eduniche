/**
 * Generates practice questions from branch intelligence data.
 *
 * This file contains NO fs imports — it works with in-memory data only.
 * For server-side use, import the full question-generator from the API layer.
 */

export interface GeneratedQuestion {
  id: string;
  subject: string;
  topic: string;
  weightage: number;
  difficulty: "easy" | "medium" | "hard";
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

export interface SubjectInfo {
  name: string;
  weightage: number;
  topic: string;
}

/**
 * Generate practice questions from subjects array (no file I/O).
 * Pure function — safe to call from client or server.
 */
export function generateQuestionsFromSubjects(
  paperId: string,
  subjects: SubjectInfo[],
  count: number = 10,
  mode: string = "historical"
): GeneratedQuestion[] {
  const questions: GeneratedQuestion[] = [];

  if (subjects.length === 0) {
    subjects.push(
      { name: "Core Subject", weightage: 10, topic: "Fundamental Concepts" },
      { name: "Engineering Mathematics", weightage: 12, topic: "Linear Algebra, Calculus" },
      { name: "General Aptitude", weightage: 15, topic: "Verbal, Numerical, Spatial Reasoning" },
    );
  }

  // Select subjects based on mode
  let selectedSubjects: SubjectInfo[];
  if (mode === "priority") {
    const sorted = [...subjects].sort((a, b) => b.weightage - a.weightage);
    selectedSubjects = sorted.slice(0, Math.max(1, Math.ceil(sorted.length / 2)));
  } else if (mode === "subject-specific") {
    selectedSubjects = subjects.slice(0, 1);
  } else {
    selectedSubjects = subjects;
  }

  const questionCount = Math.max(1, Math.min(count, selectedSubjects.length * 2));

  for (let i = 0; i < questionCount; i++) {
    const subject = selectedSubjects[i % selectedSubjects.length];
    const templates = getTemplatesForSubject(paperId, subject);

    const template = templates[i % templates.length];

    let difficulty: "easy" | "medium" | "hard" = "medium";
    const rand = Math.random();
    if (subject.weightage >= 10) {
      difficulty = rand < 0.3 ? "easy" : rand < 0.7 ? "medium" : "hard";
    } else {
      difficulty = rand < 0.4 ? "easy" : rand < 0.75 ? "medium" : "hard";
    }

    questions.push({
      id: `${paperId}-q-${i + 1}`,
      subject: subject.name,
      topic: subject.topic,
      weightage: subject.weightage,
      difficulty,
      question: template.question,
      options: template.options,
      answer: template.answer,
      explanation: template.explanation,
    });
  }

  return questions;
}

// Template data (paper-specific and default)
const PAPER_TEMPLATES: Record<string, { keywords: string[]; templates: Array<{ question: string; options: string[]; answer: number; explanation: string }> }[]> = {
  me: [
    {
      keywords: ["manufacturing"],
      templates: [
        { question: "In a turning operation, cutting speed is 120 m/min and workpiece diameter is 60 mm. What is the spindle speed (rpm)?", options: ["318 rpm", "637 rpm", "120 rpm", "60 rpm"], answer: 1, explanation: "N = V/(πD) = 120/(π×0.06) ≈ 637 rpm." },
        { question: "Which joining process does NOT require external heat?", options: ["Welding", "Brazing", "Adhesive bonding", "Soldering"], answer: 2, explanation: "Adhesive bonding joins materials without external heat." },
      ],
    },
    {
      keywords: ["thermodynamics", "power engineering"],
      templates: [
        { question: "A Carnot engine operates between 600 K and 300 K. What is its thermal efficiency?", options: ["50%", "33%", "67%", "25%"], answer: 0, explanation: "η = 1 - T_cold/T_hot = 1 - 300/600 = 50%." },
      ],
    },
    {
      keywords: ["som", "strength", "material"],
      templates: [
        { question: "A steel rod of 20 mm diameter is subjected to an axial tensile load of 40 kN. What is the normal stress?", options: ["127 MPa", "200 MPa", "80 MPa", "63.6 MPa"], answer: 0, explanation: "σ = P/A = 40,000/(π×0.01²) ≈ 127.3 MPa." },
      ],
    },
    {
      keywords: ["heat transfer"],
      templates: [
        { question: "Fourier's law of heat conduction is given by:", options: ["q = -k dT/dx", "q = hAΔT", "q = εσAT⁴", "q = m·c·ΔT"], answer: 0, explanation: "Fourier's law: q = -k(dT/dx)." },
      ],
    },
    {
      keywords: ["tom", "theory of machine", "kinematics"],
      templates: [
        { question: "The number of degrees of freedom of a quick-return mechanism is:", options: ["1", "2", "3", "0"], answer: 0, explanation: "Quick-return mechanisms have 1 degree of freedom." },
      ],
    },
    {
      keywords: ["fluid mechanics"],
      templates: [
        { question: "For steady, incompressible flow in a pipe, the continuity equation is:", options: ["A₁V₁ = A₂V₂", "P₁ + ½ρV₁² = P₂ + ½ρV₂²", "Bernoulli equation", "Hagen-Poiseuille"], answer: 0, explanation: "A₁V₁ = A₂V₂ for incompressible flow." },
      ],
    },
    {
      keywords: ["machine design"],
      templates: [
        { question: "In a spur gear, the Lewis form factor Y depends primarily on:", options: ["Pressure angle only", "Number of teeth", "Module", "Face width"], answer: 1, explanation: "Lewis form factor Y is a function of the number of teeth." },
      ],
    },
  ],
  ee: [
    {
      keywords: ["electrical machine"],
      templates: [
        { question: "In a 3-phase induction motor, the slip at maximum torque is:", options: ["s = R₂/X₂", "s = 1", "s = 0", "s = R₂/R₀"], answer: 0, explanation: "Slip at maximum torque: s_m = R₂/X₂." },
      ],
    },
    {
      keywords: ["power system"],
      templates: [
        { question: "The Ferranti effect is observed in:", options: ["Long transmission lines under light load", "Short transmission lines", "Cables only", "Transformers"], answer: 0, explanation: "Ferranti effect: receiving end voltage > sending end voltage in long lightly-loaded lines." },
      ],
    },
    {
      keywords: ["control"],
      templates: [
        { question: "The steady-state error of a type-1 system for a unit ramp input is:", options: ["0", "1/K", "1/K²", "∞"], answer: 0, explanation: "Type-1 system has zero steady-state error for ramp input." },
      ],
    },
    {
      keywords: ["signal"],
      templates: [
        { question: "The Fourier transform of e^(-at)u(t) for a > 0 is:", options: ["1/(a+jω)", "1/(a-jω)", "a/(a²+ω²)", "jω/(a²+ω²)"], answer: 1, explanation: "FT of e^(-at)u(t) = 1/(a+jω) for a>0." },
      ],
    },
  ],
  civil: [
    {
      keywords: ["structural"],
      templates: [
        { question: "The moment of inertia of a rectangular section (b×d) about its centroidal axis is:", options: ["bd³/12", "bd³/6", "b³d/12", "bd³/3"], answer: 0, explanation: "I = bd³/12 for rectangle about centroidal axis." },
      ],
    },
    {
      keywords: ["soil", "geotechnical"],
      templates: [
        { question: "Terzaghi's equation for bearing capacity of a shallow strip footing includes:", options: ["0.5γBNγ term", "γBNγ term", "No width term", "2γBNγ term"], answer: 0, explanation: "Terzaghi's: q_ult = cN_c + γD N_q + 0.5 γB N_γ." },
      ],
    },
    {
      keywords: ["transportation"],
      templates: [
        { question: "The recommended camber for flexible pavement in heavy rainfall areas is:", options: ["1 in 50", "1 in 33", "1 in 25", "1 in 100"], answer: 1, explanation: "Camber for flexible pavement: 1 in 33 for heavy rainfall." },
      ],
    },
  ],
  cse: [
    {
      keywords: ["algorithm", "data structure"],
      templates: [
        { question: "The time complexity of building a max-heap from n elements is:", options: ["O(n)", "O(n log n)", "O(log n)", "O(n²)"], answer: 0, explanation: "Heapify builds max-heap in O(n) time." },
      ],
    },
    {
      keywords: ["dbms"],
      templates: [
        { question: "Which normal form eliminates transitive dependency?", options: ["1NF", "2NF", "3NF", "BCNF"], answer: 2, explanation: "3NF eliminates transitive dependency." },
      ],
    },
    {
      keywords: ["toc", "theory of computation"],
      templates: [
        { question: "Which language is NOT context-free?", options: ["{aⁿbⁿ}", "{aⁿbⁿcⁿ}", "{ww}", "{aⁿ}"], answer: 1, explanation: "L = {aⁿbⁿcⁿ} is not context-free, proved via pumping lemma." },
      ],
    },
    {
      keywords: ["network"],
      templates: [
        { question: "In which OSI layer does TCP operate?", options: ["Application", "Transport", "Network", "Data Link"], answer: 1, explanation: "TCP operates in the Transport layer (Layer 4)." },
      ],
    },
    {
      keywords: ["os", "operating system"],
      templates: [
        { question: "Which page replacement algorithm achieves the minimum page fault rate?", options: ["FIFO", "LRU", "Optimal (Belady's)", "Clock"], answer: 2, explanation: "Optimal (Belady's MIN) has the minimum page faults." },
      ],
    },
    {
      keywords: ["coa", "computer organization"],
      templates: [
        { question: "Pipeline speedup for n instructions with k stages is approximately:", options: ["n", "nk/(k+n-1)", "k", "n/k"], answer: 1, explanation: "Speedup ≈ nk/(k+n-1) ≈ k for large n." },
      ],
    },
  ],
  in: [
    {
      keywords: ["transducer", "sensor"],
      templates: [
        { question: "A LVDT is used for measuring:", options: ["Displacement", "Temperature", "Pressure", "Velocity"], answer: 0, explanation: "LVDT measures linear displacement." },
      ],
    },
  ],
};

const DEFAULT_TEMPLATES = [
  { question: "The primary advantage of this approach is improved:", options: ["Accuracy", "Speed", "Memory efficiency", "All of the above"], answer: 3, explanation: "Multiple benefits combine for optimal results." },
  { question: "Consider a standard engineering setup. The correct approach involves:", options: ["Applying the standard formula", "Using numerical methods", "Consulting tables", "Iterative solution"], answer: 0, explanation: "Standard problems use established formulas." },
  { question: "In this scenario, the appropriate boundary condition is:", options: ["Dirichlet", "Neumann", "Mixed/Robin", "Periodic"], answer: 2, explanation: "Mixed conditions are common in practical engineering." },
  { question: "The fundamental principle underlying this analysis is:", options: ["Conservation laws", "Statistical methods", "Empirical correlation", "Dimensional analysis"], answer: 0, explanation: "Conservation laws form the foundation of engineering." },
  { question: "For maximum theoretical efficiency, the limiting factor is:", options: ["Thermodynamic limits", "Material properties", "Geometric constraints", "All of the above"], answer: 3, explanation: "All factors contribute to efficiency limits." },
  { question: "The characteristic parameter most influencing this behavior is:", options: ["Temperature", "Pressure/stress", "Time", "All interact"], answer: 3, explanation: "Multiple parameters interact in engineering systems." },
];

function getTemplatesForSubject(paperId: string, subject: SubjectInfo): Array<{ question: string; options: string[]; answer: number; explanation: string }> {
  const paperGroups = PAPER_TEMPLATES[paperId];
  if (!paperGroups) return DEFAULT_TEMPLATES;

  for (const group of paperGroups) {
    if (group.keywords.some(kw =>
      subject.name.toLowerCase().includes(kw) || subject.topic.toLowerCase().includes(kw)
    )) {
      return group.templates;
    }
  }
  return DEFAULT_TEMPLATES;
}
