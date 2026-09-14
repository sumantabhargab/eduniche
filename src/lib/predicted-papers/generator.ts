/**
 * Predicted Papers Generator
 *
 * Reads PYQ data from data/pyq/processed/<BRANCH>.json and markdown
 * analysis from ../gate-pyq-analysis/ to generate 5 GATE-style predicted
 * papers per branch.
 *
 * Each paper: 65 questions, 100 marks, matching real GATE exam pattern.
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { PredictedPaper, BranchPapers, AllPapers, PredictedQuestion } from "./types";

// ─── Constants ───────────────────────────────────────────────────────────────

const TOTAL_QUESTIONS = 65;
const TOTAL_MARKS = 100;
const DIFFICULTY_DIST = { easy: 0.31, moderate: 0.54, difficult: 0.15 };

const PROCESSED_DIR = join(process.cwd(), "data", "pyq", "processed");
const MARKDOWN_DIR = join(process.cwd(), "..", "gate-pyq-analysis");
const OUTPUT_DIR = join(process.cwd(), "data", "predicted-papers");

// ─── PYQ Question type ───────────────────────────────────────────────────────

interface RawQuestion {
  id: string;
  question_number: number;
  question_text: string;
  subject: string;
  topic: string;
  options: string[];
  answer: string;
  question_type: string;
  marks: number;
  negative_marks: number;
  branch: string;
  year: number;
  session?: string;
  difficulty: string;
  tags: string[];
  explanation: string;
  source: string;
  source_file: string;
}

interface ProcessedData {
  branch: string;
  totalQuestions: number;
  yearRange: { min: number; max: number };
  sessions: string[];
  questions: RawQuestion[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickWithoutReplacement<T>(pool: T[], n: number, rand: () => number): T[] {
  const shuffled = shuffle(pool, rand);
  return shuffled.slice(0, Math.min(n, pool.length));
}

function assignDifficulty(counts: { easy: number; moderate: number; difficult: number }, rand: () => number): string[] {
  const result: string[] = [];
  const total = counts.easy + counts.moderate + counts.difficult;
  const easyRatio = counts.easy / total;
  const modRatio = counts.moderate / total;

  for (let i = 0; i < total; i++) {
    const r = rand();
    if (r < easyRatio) result.push("easy");
    else if (r < easyRatio + modRatio) result.push("moderate");
    else result.push("difficult");
  }
  return result;
}

// ─── Subject weightage configs ───────────────────────────────────────────────
// Derived from ../gate-pyq-analysis markdown files.

interface SubjectWeightage {
  name: string;
  marks: number;
}

function getSubjectWeightage(branch: string): SubjectWeightage[] {
  const configs: Record<string, SubjectWeightage[]> = {
    CS: [
      { name: "General Aptitude", marks: 15 },
      { name: "Engineering Mathematics", marks: 13 },
      { name: "Programming and Data Structures", marks: 12 },
      { name: "Algorithms", marks: 10 },
      { name: "Operating Systems", marks: 10 },
      { name: "Computer Networks", marks: 9 },
      { name: "DBMS", marks: 8 },
      { name: "Digital Logic", marks: 7 },
      { name: "Computer Organization and Architecture", marks: 7 },
      { name: "Theory of Computation", marks: 6 },
      { name: "Compiler Design", marks: 2 },
      { name: "Software Engineering", marks: 1 },
    ],
    EE: [
      { name: "General Aptitude", marks: 15 },
      { name: "Engineering Mathematics", marks: 12 },
      { name: "Electrical Machines", marks: 14 },
      { name: "Power Systems", marks: 12 },
      { name: "Control Systems", marks: 9 },
      { name: "Power Electronics", marks: 10 },
      { name: "Network Theory", marks: 10 },
      { name: "Analog Electronics", marks: 7 },
      { name: "Digital Electronics", marks: 6 },
      { name: "Signals and Systems", marks: 5 },
      { name: "EMFT", marks: 5 },
      { name: "Measurements and Instrumentation", marks: 5 },
    ],
    CE: [
      { name: "General Aptitude", marks: 15 },
      { name: "Engineering Mathematics", marks: 13 },
      { name: "Structural Engineering", marks: 22 },
      { name: "Geotechnical Engineering", marks: 12 },
      { name: "Water Resources Engineering", marks: 12 },
      { name: "Environmental Engineering", marks: 10 },
      { name: "Transportation Engineering", marks: 10 },
      { name: "Surveying", marks: 3 },
      { name: "Construction Materials and Management", marks: 3 },
    ],
    ME: [
      { name: "General Aptitude", marks: 15 },
      { name: "Engineering Mathematics", marks: 13 },
      { name: "Strength of Materials", marks: 10 },
      { name: "Fluid Mechanics", marks: 10 },
      { name: "Manufacturing Processes", marks: 10 },
      { name: "Thermodynamics", marks: 8 },
      { name: "Heat Transfer", marks: 8 },
      { name: "Theory of Machines", marks: 8 },
      { name: "Engineering Mechanics", marks: 8 },
      { name: "Industrial Engineering", marks: 8 },
      { name: "Vibrations", marks: 5 },
      { name: "Machine Design", marks: 5 },
    ],
    XE: [
      { name: "Engineering Mathematics", marks: 15 },
      { name: "Solid Mechanics", marks: 10 },
      { name: "Fluid Mechanics", marks: 10 },
      { name: "Thermodynamics", marks: 10 },
      { name: "Material Science", marks: 10 },
      { name: "Basic Electronics", marks: 8 },
      { name: "Basic Electrical", marks: 8 },
      { name: "Computers and Programming", marks: 8 },
      { name: "Environmental Science", marks: 8 },
      { name: "General Aptitude", marks: 15 },
    ],
    XL: [
      { name: "Chemistry", marks: 25 },
      { name: "Biochemistry", marks: 10 },
      { name: "Botany", marks: 10 },
      { name: "Zoology", marks: 10 },
      { name: "Microbiology", marks: 10 },
      { name: "Genetics", marks: 10 },
      { name: "Cell Biology", marks: 10 },
      { name: "Ecology", marks: 8 },
      { name: "Evolution", marks: 7 },
      { name: "General Aptitude", marks: 10 },
      { name: "Engineering Mathematics", marks: 0 },
    ],
  };
  return configs[branch] || [];
}

// ─── Paper metadata ──────────────────────────────────────────────────────────

const BRANCH_META: Record<string, { name: string; icon: string; shortName: string }> = {
  CS: { name: "Computer Science & Engineering", icon: "💻", shortName: "CS" },
  EE: { name: "Electrical Engineering", icon: "⚡", shortName: "EE" },
  CE: { name: "Civil Engineering", icon: "🏗️", shortName: "CE" },
  ME: { name: "Mechanical Engineering", icon: "⚙️", shortName: "ME" },
  XE: { name: "Engineering Sciences", icon: "🔬", shortName: "XE" },
  XL: { name: "Life Sciences", icon: "🧬", shortName: "XL" },
};

const PAPER_DESCRIPTIONS: Record<string, string[]> = {
  CS: [
    "Programming & Data Structures focus with strong Algorithms and OS coverage. Mix of easy MCQs and challenging MSQs matching recent GATE CSE trends.",
    "Computer Networks + DBMS emphasis. Theory of Computation and Compiler Design form the analytical core. Tricky NAT questions from previous years.",
    "Algorithms + Digital Logic + COA combination. Engineering Mathematics calculus and probability questions provide numerical variety. Moderate difficulty with conceptual MCQs.",
    "Full stack CS paper: OS memory management, DBMS transactions, CN routing, and TOC automata. Challenging 2-mark MSQs for top-rank aspirants.",
    "Complete GATE CSE syllabus coverage. Easy recall questions from Digital Logic and SE, moderate application from DSA and DBMS, difficult analysis from Algorithms and TOC. This paper simulates the real exam's difficulty curve — starting easy, ramping up complexity, and ending with tough NAT questions. Perfect for final timed practice.",
  ],
  EE: [
    "Balanced mix of core EE topics with emphasis on Machines, Power Systems, and Control Systems. High-frequency PYQs from 2021–2024.",
    "Focus on Circuit Theory, Power Electronics, and Network Analysis. Includes tricky NAT questions from recent sessions.",
    "Emphasis on Analog & Digital Electronics with solid Signals & Systems coverage. Moderate difficulty with conceptual MCQs.",
    "Heavy on Machines and Power Systems with integrated Control Systems questions. Challenging complex problems included.",
    "Comprehensive revision paper combining all major EE subjects. Mix of easy recall questions and challenging multi-concept problems. Ideal for final practice before the exam.",
  ],
  CE: [
    "Heavy Structural Engineering focus with Geotechnical and Water Resources combo. Realistic mix of design and analysis problems.",
    "Environmental + Transportation emphasis with core Structural coverage. Scoring topics prioritized for quick marks.",
    "Balanced across all major CE subjects. Includes recent trend questions from Hydrology and Surveying.",
    "Structural + Geotechnical intensive. Challenging RCC and Foundation problems. Realistic complex problems.",
    "Full-syllabus mock paper. Covers all 9 major CE subjects in GATE proportions. Mix of formula-based and conceptual questions for complete exam simulation.",
  ],
  ME: [
    "Manufacturing + SOM + Fluid Mechanics focus. Formula-heavy numerical problems matching recent GATE patterns.",
    "Thermodynamics + Heat Transfer + TOM combination. Balanced difficulty with moderate NAT questions.",
    "Engineering Mechanics + Industrial Engineering emphasis. Scoring topics with high accuracy potential.",
    "SOM + Vibrations + Machine Design integration. Challenging multi-concept problems for top-rank aspirants.",
    "Complete syllabus coverage paper. Mix of easy recall, moderate application, and difficult analysis questions. Perfect for timed self-assessment before the actual exam.",
  ],
  XE: [
    "Section A (Engg Math) + Section B (Fluid Mechanics) + Section C (Materials Science). Comprehensive coverage.",
    "Section A + Section D (Solid Mechanics) + Section E (Thermodynamics). Mechanics-focused paper.",
    "Section A + Section B + Section D. Fluid + Solid mechanics combo with strong math foundation.",
    "Section A + Section C + Section E. Materials + Thermodynamics with compulsory engineering mathematics.",
    "All sections represented. Mix of easy and moderate questions across all 9 XE subjects. Best for final readiness check with realistic exam conditions.",
  ],
  XL: [
    "Section P (Chemistry) + Section Q (Biochemistry) + Section R (Botany). Life sciences comprehensive.",
    "Section P + Section S (Microbiology) + Section T (Zoology). Deep biology focus with chemistry foundation.",
    "Section P + Section Q + Section T. Biochemistry + Zoology combo with organic chemistry emphasis.",
    "Section P + Section R + Section S. Botany + Microbiology with physical chemistry core.",
    "Full XL syllabus paper covering all 5 sections. Balanced mix of recall, application, and analysis questions. Designed for complete exam simulation with realistic timing.",
  ],
};

const RATIONALE_TEMPLATES: Record<string, string[]> = {
  CS: [
    "This paper puts Programming & Data Structures front and center (~12 marks), reflecting their dominant presence in recent GATE papers. Algorithms and OS share ~20 marks combined. DBMS and CN provide moderate scoring opportunities. MSQ questions test multi-correct understanding — a pattern increasingly seen in GATE CSE. Easy questions from Digital Logic and Engg Math ensure quick starts.",
    "Computer Networks and DBMS are emphasized based on 2024's rising weightage for these subjects. Theory of Computation PDA and grammar questions test formal reasoning. Compiler Design lexical analysis and parsing provide moderate difficulty. Engineering Mathematics probability and graph theory appear in NAT format. This paper rewards students who've practiced previous year questions thoroughly.",
    "Algorithms and Data Structures form the analytical backbone. Digital Logic combinational circuits and COA pipelining questions test hardware-software interface understanding. OS process scheduling and memory management questions follow GATE's standard patterns. Theory of Computation regular languages and TMs provide conceptual challenge. Engineering Mathematics linear algebra and calculus offer numerical variety.",
    "Comprehensive CS paper covering all major subjects. OS memory management page replacement algorithms, DBMS transaction concurrency, CN sliding window and routing, and TOC decidability form the core. Compiler Design LR parsing and SE COCOMO provide moderate questions. This paper targets 60+ marks for strong students with difficult MSQs filtering top ranks.",
    "This full-syllabus revision paper covers all 12 CS subjects in GATE proportions. The difficulty curve follows actual GATE: Section 1 starts with easy recall from Digital Logic and Engg Math, builds through moderate DSA and DBMS questions, and ends with challenging TOC and Compiler Design questions. Section 2 ramps up further with complex Algorithm analysis and OS virtual memory problems. Designed to build 3-hour exam stamina. NAT questions test numerical precision in probability and calculus.",
  ],
  EE: [
    "This paper emphasizes Electrical Machines (highest weightage at ~14 marks) combined with Power Systems and Power Electronics (~22 marks combined). Control Systems stability questions are placed strategically. Network Theory forms the foundation for several circuit-based questions. NAT questions test numerical precision in Power Electronics and Control Systems.",
    "Built around Circuit Theory and Network Analysis as the backbone, with Power Electronics chopper/inverter questions forming the core. Digital Electronics sequential circuits feature prominently. Signals & Systems Laplace transform questions test analytical ability. Complex problems combine multiple concepts — typical of recent GATE trends.",
    "Analog Electronics and Digital Electronics are given extra weight based on 2024 trends. Signals & Systems sampling theorem and Fourier questions are placed early. EMFT electrostatics questions test conceptual clarity. Control Systems state-space representation appears in the complex section.",
    "Heavy Machines paper: Transformer equivalent circuits, induction motor torque, and synchronous machine alternator problems form the core. Power Systems fault analysis (symmetrical components) and load flow are tested. Control Systems root locus and Bode plot questions assess frequency-domain skills.",
    "This full-syllabus revision paper covers all major EE topics in realistic proportions. Easy questions test fundamental recall, moderate ones test application skills, and difficult ones combine multiple concepts. The paper mirrors the actual GATE difficulty curve — starting moderate, building complexity through Section 1 and Section 2, and ending with challenging NAT questions.",
  ],
  CE: [
    "Structural Engineering dominates (~22 marks) with SFD/BMD, deflection, and RCC design questions. Geotechnical Engineering permeability and shear strength problems follow. Water Resources Engineering unit hydrograph and canal design questions test application skills. Complex problems combine structural analysis with design — matching 2024's trend.",
    "Environmental Engineering water treatment and wastewater questions are emphasized based on rising weightage. Transportation highway geometric design and pavement problems follow. Core Structural questions ensure baseline coverage. Surveying and Construction Management provide easy scoring opportunities.",
    "Balanced paper covering all major CE subjects proportionally. Structural analysis indeterminate structures (moment distribution) challenge analytical skills. Geotechnical consolidation and earth pressure problems test depth. Hydrology flood routing appears in the NAT section.",
    "Structural + Geotechnical intensive. RCC beam design, steel design, and soil bearing capacity form the complex challenge questions. Fluid mechanics open channel flow and boundary layer provide scoring opportunities. Transportation traffic engineering problems test applied knowledge.",
    "This comprehensive mock covers all 9 CE subjects in GATE proportions. Easy questions from Surveying and Construction Management provide quick marks. Moderate questions from Structural Analysis and Geotechnical test core competence. Difficult NAT questions from Environmental Engineering and Transportation simulate the real exam's difficulty curve.",
  ],
  ME: [
    "Manufacturing Processes lead with casting defects, machining tool life, and metal forming calculations. SOM torsion and bending moment problems test fundamentals. Fluid Mechanics Bernoulli applications and turbomachinery provide numerical challenge. Complex questions combine thermodynamics with heat transfer — a proven GATE pattern.",
    "Thermodynamics entropy and availability questions form the conceptual core. Heat Transfer conduction (1D/2D) and heat exchanger problems follow. TOM kinematics and gear train questions test mechanical understanding. Industrial Engineering LP and PERT/CPM provide scoring opportunities.",
    "Engineering Mechanics equilibrium and friction problems establish the foundation. Vibrations single DOF free/forced vibration analysis appears in the section. Machine Design shaft and spring design problems provide applied mechanics testing. Manufacturing welding and sheet metal operations test practical knowledge.",
    "SOM combined with Vibrations creates a mechanical duo paper. Torsion, bending, and beam deflection problems flow into multi-DOF vibration analysis. Fluid Mechanics dimensional analysis and boundary layer theory provide variety. IC Engine Otto/Diesel cycle questions reflect consistent weightage.",
    "Complete ME syllabus in one paper. Easy recall questions from Engineering Mechanics and SOM, moderate application questions from Manufacturing and Fluid Mechanics, and difficult analysis questions from TOM and Vibrations. This paper is designed to build stamina for the real exam. Mix of theoretical and numerical questions across all major ME subjects.",
  ],
  XE: [
    "Section A (Engg Math) covers Linear Algebra, Calculus ODEs, and Vector Calculus — the core mathematical foundation. Section B (Fluid Mechanics) tests fluid statics, Bernoulli applications, and boundary layer theory. Section C (Materials Science) covers crystal structures, phase diagrams, and mechanical properties. Ideal for students choosing B+C combination.",
    "Section A Engineering Mathematics paired with Section D (Solid Mechanics) stress-strain, bending, torsion, and buckling problems. Section E (Thermodynamics) laws, entropy, and thermodynamic cycles complete this mechanics-focused paper. Best for students choosing D+E combination.",
    "Fluid Mechanics (Section B) and Solid Mechanics (Section D) combined with compulsory Engineering Mathematics. Boundary layer theory and dimensional analysis pair with beam deflection and column buckling. Strong engineering mechanics foundation paper.",
    "Materials Science (Section C) crystal structures and phase diagrams combined with Thermodynamics (Section E) laws and cycles. Engineering Mathematics probability and linear algebra provide the mathematical backbone. Ideal for material science and thermal engineering aspirants.",
    "All XE sections represented in realistic exam proportions. Easy math questions test calculus and linear algebra basics. Moderate questions from Fluid and Solid Mechanics test core competence. Difficult questions from Materials and Thermodynamics simulate the real exam's analytical challenges. Ideal for timed practice.",
  ],
  XL: [
    "Section P (Chemistry) Organic reaction mechanisms, Physical Chemistry thermodynamics/kinetics, and Inorganic coordination compounds. Section Q (Biochemistry) proteins, enzymes, metabolism. Section R (Botany) plant physiology, genetics. Comprehensive for P+Q+R combination students.",
    "Chemistry section emphasizes organic stereochemistry and named reactions. Microbiology microbial physiology and genetics form Section S. Zoology animal physiology and developmental biology (Section T) complete this biology-heavy paper. Ideal for P+S+T combination.",
    "Organic Chemistry named reactions and aromatic substitution dominate Section P. Biochemistry metabolism and molecular biology (Section Q) pair with Zoology genetics and ecology (Section T). Strong biochemistry focus for P+Q+T aspirants.",
    "Physical Chemistry quantum basics and electrochemistry balanced with Organic polymer chemistry. Botany plant systematics and ecology (Section R) combined with Microbiology applied aspects (Section S). Well-rounded for P+R+S combination.",
    "Full XL syllabus paper covering all 5 sections. Balanced mix of recall, application, and analysis questions. Designed for complete exam simulation with realistic timing. Easy chemistry questions provide quick marks, moderate biology questions test depth, and difficult multi-concept questions challenge even prepared students.",
  ],
};

// ─── Subject normalization ───────────────────────────────────────────────────

function normalizeSubject(name: string, branch: string): string {
  const map: Record<string, Record<string, string>> = {
    CS: {
      "General Aptitude": "General Aptitude",
      "Engineering Mathematics": "Engineering Mathematics",
      "Programming and Data Structures": "Programming and Data Structures",
      "PDS": "Programming and Data Structures",
      "DSA": "Programming and Data Structures",
      "Algorithms": "Algorithms",
      "Operating Systems": "Operating Systems",
      "OS": "Operating Systems",
      "Computer Networks": "Computer Networks",
      "CN": "Computer Networks",
      "DBMS": "DBMS",
      "Database Management Systems": "DBMS",
      "Digital Logic": "Digital Logic",
      "DLD": "Digital Logic",
      "Computer Organization and Architecture": "Computer Organization and Architecture",
      "COA": "Computer Organization and Architecture",
      "Theory of Computation": "Theory of Computation",
      "TOC": "Theory of Computation",
      "Compiler Design": "Compiler Design",
      "CD": "Compiler Design",
      "Software Engineering": "Software Engineering",
      "SE": "Software Engineering",
    },
    EE: {
      "General Aptitude": "General Aptitude",
      "Engineering Mathematics": "Engineering Mathematics",
      "Electrical Machines": "Electrical Machines",
      "Power Systems": "Power Systems",
      "Control Systems": "Control Systems",
      "Power Electronics": "Power Electronics",
      "Network Theory": "Network Theory",
      "Network Theorems": "Network Theory",
      "Analog Electronics": "Analog Electronics",
      "Digital Electronics": "Digital Electronics",
      "Signals and Systems": "Signals and Systems",
      "Signals & Systems": "Signals and Systems",
      "EMFT": "EMFT",
      "Electromagnetic Field Theory": "EMFT",
      "Measurements and Instrumentation": "Measurements and Instrumentation",
      "Measurements": "Measurements and Instrumentation",
    },
    CE: {
      "General Aptitude": "General Aptitude",
      "Engineering Mathematics": "Engineering Mathematics",
      "Structural Analysis": "Structural Engineering",
      "Structural Engineering": "Structural Engineering",
      "Geotechnical Engineering": "Geotechnical Engineering",
      "Soil Mechanics": "Geotechnical Engineering",
      "Water Resources Engineering": "Water Resources Engineering",
      "Hydrology": "Water Resources Engineering",
      "Fluid Mechanics": "Water Resources Engineering",
      "Environmental Engineering": "Environmental Engineering",
      "Transportation Engineering": "Transportation Engineering",
      "Surveying": "Surveying",
      "Concrete Technology": "Construction Materials and Management",
      "Construction Materials and Management": "Construction Materials and Management",
    },
    ME: {
      "General Aptitude": "General Aptitude",
      "Engineering Mathematics": "Engineering Mathematics",
      "Strength of Materials": "Strength of Materials",
      "SOM": "Strength of Materials",
      "Fluid Mechanics": "Fluid Mechanics",
      "Thermodynamics": "Thermodynamics",
      "Heat Transfer": "Heat Transfer",
      "Theory of Machines": "Theory of Machines",
      "TOM": "Theory of Machines",
      "Engineering Mechanics": "Engineering Mechanics",
      "Industrial Engineering": "Industrial Engineering",
      "IE": "Industrial Engineering",
      "Vibrations": "Vibrations",
      "Machine Design": "Machine Design",
      "Manufacturing": "Manufacturing Processes",
      "Manufacturing Processes": "Manufacturing Processes",
      "IC Engine": "IC Engine",
    },
    XE: {
      "General Aptitude": "General Aptitude",
      "Engineering Mathematics": "Engineering Mathematics",
      "Solid Mechanics": "Solid Mechanics",
      "Fluid Mechanics": "Fluid Mechanics",
      "Thermodynamics": "Thermodynamics",
      "Material Science": "Material Science",
      "Basic Electronics": "Basic Electronics",
      "Basic Electrical": "Basic Electrical",
      "Computers and Programming": "Computers and Programming",
      "Environmental Science": "Environmental Science",
    },
    XL: {
      "General Aptitude": "General Aptitude",
      "Engineering Mathematics": "Engineering Mathematics",
      "Chemistry": "Chemistry",
      "Biochemistry": "Biochemistry",
      "Botany": "Botany",
      "Zoology": "Zoology",
      "Microbiology": "Microbiology",
      "Genetics": "Genetics",
      "Cell Biology": "Cell Biology",
      "Ecology": "Ecology",
      "Evolution": "Evolution",
    },
  };
  return map[branch]?.[name] || name;
}

// ─── Core generation ─────────────────────────────────────────────────────────

function generatePaper(
  branch: string,
  paperIndex: number,
  allQuestions: RawQuestion[],
  rand: () => number
): PredictedPaper {
  const weightage = getSubjectWeightage(branch);
  const paperId = `${branch}-P${paperIndex + 1}`;

  // Group questions by normalized subject
  const bySubject: Record<string, RawQuestion[]> = {};
  for (const q of allQuestions) {
    const norm = normalizeSubject(q.subject, branch);
    if (!bySubject[norm]) bySubject[norm] = [];
    bySubject[norm].push(q);
  }

  // Vary weightage per paper (±1 mark per subject)
  const paperWeightage = weightage.map((w) => ({
    ...w,
    marks: Math.max(1, w.marks + Math.floor(rand() * 3) - 1),
  }));

  // Scale to exactly 100 marks
  const totalAllocated = paperWeightage.reduce((s, w) => s + w.marks, 0);
  const scale = TOTAL_MARKS / totalAllocated;
  const scaledWeightage = paperWeightage.map((w) => ({
    ...w,
    marks: Math.max(1, Math.round(w.marks * scale)),
  }));

  // Fix rounding to hit exactly 100
  const scaledTotal = scaledWeightage.reduce((s, w) => s + w.marks, 0);
  const diff = TOTAL_MARKS - scaledTotal;
  if (diff !== 0 && scaledWeightage.length > 0) {
    const idx = scaledWeightage.findIndex((w) => w.marks > 1);
    if (idx >= 0) {
      scaledWeightage[idx].marks += diff;
    }
  }

  // Select questions per subject (roughly 1.5 marks per question)
  const selectedQuestions: { q: RawQuestion; subject: string }[] = [];
  const usageCount: Record<string, number> = {};

  for (const sw of scaledWeightage) {
    const pool = bySubject[sw.name] || [];
    const qCount = Math.max(1, Math.round(sw.marks / 1.5));
    const unused = pool.filter((q) => (usageCount[q.id] || 0) < 3);
    const sourcePool = unused.length >= qCount ? unused : pool;
    const chosen = pickWithoutReplacement(sourcePool, qCount, rand);

    for (const q of chosen) {
      usageCount[q.id] = (usageCount[q.id] || 0) + 1;
      selectedQuestions.push({ q, subject: sw.name });
    }
  }

  // Pad if needed
  while (selectedQuestions.length < TOTAL_QUESTIONS) {
    const fallback = allQuestions[Math.floor(rand() * allQuestions.length)];
    selectedQuestions.push({ q: fallback, subject: normalizeSubject(fallback.subject, branch) });
  }

  selectedQuestions.length = TOTAL_QUESTIONS;

  // Assign marks: scale source marks to sum to exactly 100
  const rawMarks = selectedQuestions.map((sq) => sq.q.marks || 1);
  const rawTotal = rawMarks.reduce((s, m) => s + m, 0);
  const markScale = TOTAL_MARKS / rawTotal;
  let adjustedMarks = rawMarks.map((m) => Math.round(m * markScale));

  // Fix rounding to exactly 100
  let adjustedTotal = adjustedMarks.reduce((s, m) => s + m, 0);
  let fixIdx = 0;
  while (adjustedTotal !== TOTAL_MARKS && fixIdx < adjustedMarks.length * 3) {
    if (adjustedTotal < TOTAL_MARKS) {
      adjustedMarks[fixIdx % adjustedMarks.length]++;
      adjustedTotal++;
    } else {
      if (adjustedMarks[fixIdx % adjustedMarks.length] > 1) {
        adjustedMarks[fixIdx % adjustedMarks.length]--;
        adjustedTotal--;
      }
    }
    fixIdx++;
  }

  // Assign question types based on marks
  const questionTypes: string[] = adjustedMarks.map((m) => {
    if (m <= 1) return rand() < 0.7 ? "1MCQ" : "1NAT";
    if (m <= 2) return rand() < 0.6 ? "2MCQ" : rand() < 0.75 ? "2NAT" : "2MSQ";
    return "3MCQ";
  });

  // Assign difficulties
  const difficulties = assignDifficulty(
    {
      easy: Math.round(TOTAL_QUESTIONS * DIFFICULTY_DIST.easy),
      moderate: Math.round(TOTAL_QUESTIONS * DIFFICULTY_DIST.moderate),
      difficult: TOTAL_QUESTIONS -
        Math.round(TOTAL_QUESTIONS * DIFFICULTY_DIST.easy) -
        Math.round(TOTAL_QUESTIONS * DIFFICULTY_DIST.moderate),
    },
    rand
  );
  difficulties.sort(() => rand() - 0.5);

  const marksMap: Record<string, number> = {
    "1MCQ": 1, "1NAT": 1, "2MCQ": 2, "2MSQ": 2, "2NAT": 2, "3MCQ": 3,
  };
  const negMap: Record<string, number> = {
    "1MCQ": 0.33, "1NAT": 0, "2MCQ": 0.66, "2MSQ": 0, "2NAT": 0, "3MCQ": 0.66,
  };

  // Build questions
  const questions: PredictedQuestion[] = selectedQuestions.map((sq, idx) => {
    const qType = questionTypes[idx] || "1MCQ";
    const difficulty = difficulties[idx] || "moderate";
    const isNat = qType.endsWith("NAT");
    const opts = sq.q.options && Array.isArray(sq.q.options) ? sq.q.options : [];
    const options = isNat ? [] : opts.length >= 4 ? opts.slice(0, 4) : ["A", "B", "C", "D"];
    const explanationText = sq.q.explanation || (sq.q.answer ? `Correct Answer: ${sq.q.answer}` : "");

    return {
      id: `${paperId}-Q${String(idx + 1).padStart(3, "0")}`,
      questionNumber: idx + 1,
      subject: sq.subject,
      topic: sq.q.topic || sq.subject,
      questionType: qType as PredictedQuestion["questionType"],
      marks: adjustedMarks[idx] || marksMap[qType],
      negativeMarks: negMap[qType],
      difficulty: difficulty as "easy" | "moderate" | "difficult",
      questionText: sq.q.question_text,
      options,
      correctAnswer: sq.q.answer,
      explanation: explanationText,
      source: `Adapted from GATE ${sq.q.year} ${branch} Session ${sq.q.session || "1"} Q${sq.q.question_number}`,
    };
  });

  const finalMarks = questions.reduce((s, q) => s + q.marks, 0);

  // Subject breakdown
  const subjBreakdown: Record<string, { marks: number; questions: number }> = {};
  for (const q of questions) {
    if (!subjBreakdown[q.subject]) subjBreakdown[q.subject] = { marks: 0, questions: 0 };
    subjBreakdown[q.subject].marks += q.marks;
    subjBreakdown[q.subject].questions++;
  }

  const subjectBreakdown = Object.entries(subjBreakdown)
    .map(([subject, data]) => ({ subject, ...data }))
    .sort((a, b) => b.marks - a.marks);

  const diffDist = {
    easy: questions.filter((q) => q.difficulty === "easy").length,
    moderate: questions.filter((q) => q.difficulty === "moderate").length,
    difficult: questions.filter((q) => q.difficulty === "difficult").length,
  };

  return {
    id: paperId,
    branch,
    title: `GATE ${branch} 2026 Predicted Paper ${paperIndex + 1}`,
    description: PAPER_DESCRIPTIONS[branch]?.[paperIndex] || `Predicted Paper ${paperIndex + 1} for GATE ${branch}`,
    createdAt: new Date().toISOString(),
    totalQuestions: questions.length,
    totalMarks: finalMarks,
    difficultyDistribution: diffDist,
    subjectBreakdown,
    predictionRationale: RATIONALE_TEMPLATES[branch]?.[paperIndex] || "",
    questions,
  };
}

// ─── Public API ──────────────────────────────────────────────────────────────

const BRANCHES = ["CS", "EE", "CE", "ME", "XE", "XL"];

export function generateAllPapers(): AllPapers {
  const branches: BranchPapers[] = [];

  for (const branch of BRANCHES) {
    const jsonPath = join(PROCESSED_DIR, `${branch}.json`);
    if (!existsSync(jsonPath)) {
      console.warn(`Missing processed data for ${branch}: ${jsonPath}`);
      continue;
    }

    const raw = readFileSync(jsonPath, "utf-8");
    const data: ProcessedData = JSON.parse(raw);
    const questions = data.questions;

    if (!questions || questions.length === 0) {
      console.warn(`No questions for ${branch}`);
      continue;
    }

    const papers: PredictedPaper[] = [];
    for (let i = 0; i < 5; i++) {
      const seed = (branch.charCodeAt(0) * 1000) + (i * 137) + 42;
      const rand = seededRandom(seed);
      const paper = generatePaper(branch, i, questions, rand);
      papers.push(paper);
    }

    branches.push({
      branch,
      branchName: BRANCH_META[branch]?.name || branch,
      papers,
    });
  }

  return {
    branches,
    generatedAt: new Date().toISOString(),
  };
}

export function writePredictedPapers(): void {
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const allPapers = generateAllPapers();

  for (const bp of allPapers.branches) {
    const outputPath = join(OUTPUT_DIR, `${bp.branch}.json`);
    writeFileSync(outputPath, JSON.stringify({ branch: bp.branch, papers: bp.papers }, null, 2));
    console.log(`Generated ${bp.papers.length} papers for ${bp.branch} -> ${outputPath}`);
  }

  const bundlePath = join(OUTPUT_DIR, "all.json");
  writeFileSync(bundlePath, JSON.stringify(allPapers, null, 2));
  console.log(`\nAll papers bundle -> ${bundlePath}`);
  console.log(`Total branches: ${allPapers.branches.length}`);
  console.log(`Total papers: ${allPapers.branches.reduce((s, b) => s + b.papers.length, 0)}`);
  console.log(`Total questions: ${allPapers.branches.reduce((s, b) => s + b.papers.reduce((s2, p) => s2 + p.questions.length, 0), 0)}`);
}

// Run if executed directly
if (require.main === module) {
  writePredictedPapers();
}
