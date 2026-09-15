/**
 * Predicted Papers Generator
 *
 * Reads PYQ data from data/pyq/processed/<BRANCH>.json and generates
 * 4 GATE-style trend-based mock papers per branch.
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
// Based on actual GATE exam patterns and available PYQ distributions.

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
    EC: [
      { name: "General Aptitude", marks: 15 },
      { name: "Engineering Mathematics", marks: 13 },
      { name: "Network, Signals & Systems", marks: 12 },
      { name: "Electronic Devices", marks: 11 },
      { name: "Analog Circuits", marks: 9 },
      { name: "Digital Circuits", marks: 8 },
      { name: "Control Systems", marks: 8 },
      { name: "Communication Systems", marks: 8 },
      { name: "Electromagnetics", marks: 7 },
      { name: "Analog & Digital Electronics", marks: 5 },
      { name: "Electrical & Electronic Measurements", marks: 4 },
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
    CE: [
      { name: "General Aptitude", marks: 15 },
      { name: "Engineering Mathematics", marks: 13 },
      { name: "Structural Engineering", marks: 22 },
      { name: "Geotechnical Engineering", marks: 12 },
      { name: "Water Resources Engineering", marks: 12 },
      { name: "Environmental Engineering", marks: 10 },
      { name: "Transportation Engineering", marks: 10 },
      { name: "Surveying & Geomatics", marks: 3 },
      { name: "Construction Materials", marks: 3 },
    ],
    IN: [
      { name: "General Aptitude", marks: 15 },
      { name: "Engineering Mathematics", marks: 12 },
      { name: "Electrical Circuits", marks: 10 },
      { name: "Sensors & Instrumentation", marks: 12 },
      { name: "Control Systems", marks: 10 },
      { name: "Analog & Digital Electronics", marks: 10 },
      { name: "Communications & Process Control", marks: 11 },
      { name: "Measurement Systems", marks: 8 },
      { name: "Signal Conditioning", marks: 7 },
      { name: "Transducers", marks: 5 },
    ],
    PI: [
      { name: "General Aptitude", marks: 15 },
      { name: "Engineering Mathematics", marks: 12 },
      { name: "Manufacturing Processes", marks: 15 },
      { name: "Industrial Engineering", marks: 12 },
      { name: "Mechanics of Materials", marks: 10 },
      { name: "Machine Design", marks: 8 },
      { name: "Thermal Engineering", marks: 8 },
      { name: "Metrology & Inspection", marks: 7 },
      { name: "Production Planning & Control", marks: 7 },
      { name: "Operations Research", marks: 6 },
    ],
    CH: [
      { name: "General Aptitude", marks: 15 },
      { name: "Engineering Mathematics", marks: 12 },
      { name: "Process Calculations", marks: 10 },
      { name: "Thermodynamics", marks: 10 },
      { name: "Fluid Mechanics", marks: 10 },
      { name: "Heat Transfer", marks: 9 },
      { name: "Mass Transfer", marks: 9 },
      { name: "Chemical Reaction Engineering", marks: 8 },
      { name: "Process Control", marks: 7 },
      { name: "Mechanical Operations", marks: 7 },
    ],
    BT: [
      { name: "General Aptitude", marks: 15 },
      { name: "Engineering Mathematics", marks: 12 },
      { name: "Genetics", marks: 12 },
      { name: "Biochemistry", marks: 10 },
      { name: "Microbiology", marks: 10 },
      { name: "Bioprocess Engineering", marks: 10 },
      { name: "Immunology", marks: 8 },
      { name: "Bioinformatics", marks: 8 },
      { name: "Cell Biology", marks: 8 },
      { name: "Molecular Biology", marks: 7 },
    ],
    MT: [
      { name: "General Aptitude", marks: 15 },
      { name: "Engineering Mathematics", marks: 12 },
      { name: "Physical Metallurgy", marks: 12 },
      { name: "Mechanical Metallurgy", marks: 10 },
      { name: "Extractive Metallurgy", marks: 10 },
      { name: "Phase Transformations", marks: 9 },
      { name: "Heat Treatment", marks: 8 },
      { name: "Corrosion", marks: 8 },
      { name: "Welding & Joining", marks: 8 },
      { name: "Non-Ferrous Metals & Alloys", marks: 8 },
    ],
    TF: [
      { name: "General Aptitude", marks: 15 },
      { name: "Engineering Mathematics", marks: 12 },
      { name: "Textile Fibers", marks: 10 },
      { name: "Yarn Manufacturing", marks: 10 },
      { name: "Fabric Manufacturing", marks: 10 },
      { name: "Textile Testing", marks: 10 },
      { name: "Chemical Processing", marks: 8 },
      { name: "Apparel Engineering", marks: 8 },
      { name: "Textile Machinery", marks: 8 },
      { name: "Textile Physics", marks: 7 },
    ],
    PE: [
      { name: "General Aptitude", marks: 15 },
      { name: "Engineering Mathematics", marks: 12 },
      { name: "Petroleum Exploration", marks: 10 },
      { name: "Reservoir Engineering", marks: 10 },
      { name: "Drilling Engineering", marks: 10 },
      { name: "Production Engineering", marks: 10 },
      { name: "Petroleum Formation Evaluation", marks: 8 },
      { name: "Well Testing", marks: 8 },
      { name: "Petroleum Chemistry", marks: 8 },
      { name: "Offshore Drilling", marks: 7 },
    ],
    EY: [
      { name: "General Aptitude", marks: 15 },
      { name: "Engineering Mathematics", marks: 12 },
      { name: "Ecology", marks: 12 },
      { name: "Evolution", marks: 10 },
      { name: "Genetics", marks: 10 },
      { name: "Environmental Science", marks: 10 },
      { name: "Cell Biology", marks: 8 },
      { name: "Plant Physiology", marks: 8 },
      { name: "Zoology", marks: 8 },
      { name: "Behavioral Ecology", marks: 7 },
    ],
    MA: [
      { name: "Algebra", marks: 20 },
      { name: "Calculus", marks: 15 },
      { name: "Analysis", marks: 12 },
      { name: "Topology", marks: 10 },
      { name: "Probability", marks: 12 },
      { name: "Real Analysis", marks: 11 },
      { name: "Linear Algebra", marks: 10 },
      { name: "Complex Analysis", marks: 10 },
    ],
    AR: [
      { name: "General Aptitude", marks: 15 },
      { name: "Engineering Mathematics", marks: 12 },
      { name: "Architecture", marks: 15 },
      { name: "Building Materials", marks: 10 },
      { name: "Urban Planning", marks: 10 },
      { name: "Design", marks: 8 },
      { name: "Construction Technology", marks: 8 },
      { name: "Climate & Services", marks: 8 },
      { name: "Landscape Architecture", marks: 7 },
      { name: "Structural Systems", marks: 7 },
    ],
    AG: [
      { name: "General Aptitude", marks: 15 },
      { name: "Engineering Mathematics", marks: 12 },
      { name: "Farm Machinery & Power", marks: 10 },
      { name: "Irrigation & Drainage", marks: 10 },
      { name: "Soil and Water Conservation", marks: 10 },
      { name: "Post Harvest Engineering", marks: 8 },
      { name: "Food Processing", marks: 8 },
      { name: "Surveying & Leveling", marks: 8 },
      { name: "Renewable Energy", marks: 8 },
      { name: "Agricultural Engineering Basics", marks: 8 },
    ],
    GG: [
      { name: "General Aptitude", marks: 15 },
      { name: "Engineering Mathematics", marks: 12 },
      { name: "Geology", marks: 20 },
      { name: "Geophysics", marks: 20 },
      { name: "Remote Sensing & GIS", marks: 8 },
      { name: "Petrology", marks: 8 },
      { name: "Stratigraphy", marks: 7 },
      { name: "Structural Geology", marks: 7 },
      { name: "Mineralogy", marks: 7 },
    ],
    PH: [
      { name: "General Aptitude", marks: 15 },
      { name: "Engineering Mathematics", marks: 12 },
      { name: "Classical Mechanics", marks: 15 },
      { name: "Electromagnetism", marks: 12 },
      { name: "Quantum Mechanics", marks: 10 },
      { name: "Thermal Physics", marks: 10 },
      { name: "Optics", marks: 8 },
      { name: "Solid State Physics", marks: 8 },
      { name: "Nuclear Physics", marks: 7 },
      { name: "Statistical Mechanics", marks: 7 },
    ],
  };
  return configs[branch] || [];
}

// ─── Paper metadata ──────────────────────────────────────────────────────────

const BRANCH_META: Record<string, { name: string; icon: string; shortName: string }> = {
  CS: { name: "Computer Science & Engineering", icon: "💻", shortName: "CS" },
  EC: { name: "Electronics & Communication Engineering", icon: "📡", shortName: "EC" },
  EE: { name: "Electrical Engineering", icon: "⚡", shortName: "EE" },
  ME: { name: "Mechanical Engineering", icon: "⚙️", shortName: "ME" },
  CE: { name: "Civil Engineering", icon: "🏗️", shortName: "CE" },
  IN: { name: "Instrumentation Engineering", icon: "📊", shortName: "IN" },
  PI: { name: "Production & Industrial Engineering", icon: "🏭", shortName: "PI" },
  CH: { name: "Chemical Engineering", icon: "🧪", shortName: "CH" },
  BT: { name: "Biotechnology", icon: "🧬", shortName: "BT" },
  MT: { name: "Metallurgical Engineering", icon: "🔩", shortName: "MT" },
  TF: { name: "Textile Engineering & Fibre Science", icon: "🧵", shortName: "TF" },
  PE: { name: "Petroleum Engineering", icon: "🛢️", shortName: "PE" },
  EY: { name: "Ecology & Evolution", icon: "🌿", shortName: "EY" },
  MA: { name: "Mathematics", icon: "📐", shortName: "MA" },
  AR: { name: "Architecture & Planning", icon: "🏛️", shortName: "AR" },
  AG: { name: "Agricultural Engineering", icon: "🌾", shortName: "AG" },
  GG: { name: "Geology & Geophysics", icon: "🌍", shortName: "GG" },
  PH: { name: "Engineering Physics", icon: "⚛️", shortName: "PH" },
  XE: { name: "Engineering Sciences", icon: "🔬", shortName: "XE" },
  XL: { name: "Life Sciences", icon: "🧬", shortName: "XL" },
};

const PAPER_DESCRIPTIONS: Record<string, string[]> = {
  CS: [
    "Programming & Data Structures focus with strong Algorithms and OS coverage. Mix of easy MCQs and challenging MSQs matching recent GATE CSE trends.",
    "Computer Networks + DBMS emphasis. Theory of Computation and Compiler Design form the analytical core. Tricky NAT questions from previous years.",
    "Algorithms + Digital Logic + COA combination. Engineering Mathematics calculus and probability questions provide numerical variety. Moderate difficulty with conceptual MCQs.",
    "Full stack CS paper: OS memory management, DBMS transactions, CN routing, and TOC automata. Challenging 2-mark MSQs for top-rank aspirants.",
  ],
  EC: [
    "Balanced mix of core EC topics with emphasis on Networks, Signals & Systems, and Electronic Devices. High-frequency PYQs from 2021–2025.",
    "Focus on Analog Circuits, Digital Circuits, and Control Systems. Includes tricky NAT questions from recent sessions. Communication Systems and EMFT provide scoring opportunities.",
    "Emphasis on Communication Systems and Electromagnetics with solid Networks and Devices coverage. Moderate difficulty with conceptual MCQs matching GATE ECE patterns.",
    "Comprehensive EC paper covering all major subjects. Easy recall questions from Digital Electronics and Engg Math, moderate application from Analog Circuits and Networks, difficult analysis from Control Systems and Communications. This paper simulates the real exam's difficulty curve.",
  ],
  EE: [
    "Balanced mix of core EE topics with emphasis on Machines, Power Systems, and Control Systems. High-frequency PYQs from 2021–2024.",
    "Focus on Circuit Theory, Power Electronics, and Network Analysis. Includes tricky NAT questions from recent sessions.",
    "Emphasis on Analog & Digital Electronics with solid Signals & Systems coverage. Moderate difficulty with conceptual MCQs.",
    "Comprehensive revision paper combining all major EE subjects. Mix of easy recall questions and challenging multi-concept problems. Ideal for final practice before the exam.",
  ],
  ME: [
    "Manufacturing + SOM + Fluid Mechanics focus. Formula-heavy numerical problems matching recent GATE patterns.",
    "Thermodynamics + Heat Transfer + TOM combination. Balanced difficulty with moderate NAT questions.",
    "Engineering Mechanics + Industrial Engineering emphasis. Scoring topics with high accuracy potential.",
    "Complete syllabus coverage paper. Mix of easy recall, moderate application, and difficult analysis questions. Perfect for timed self-assessment before the actual exam.",
  ],
  CE: [
    "Heavy Structural Engineering focus with Geotechnical and Water Resources combo. Realistic mix of design and analysis problems.",
    "Environmental + Transportation emphasis with core Structural coverage. Scoring topics prioritized for quick marks.",
    "Balanced across all major CE subjects. Includes recent trend questions from Hydrology and Surveying.",
    "Full-syllabus mock paper. Covers all major CE subjects in GATE proportions. Mix of formula-based and conceptual questions for complete exam simulation.",
  ],
  IN: [
    "Sensors & Instrumentation emphasis with Control Systems and Electrical Circuits foundation. High-weightage topics prioritized for scoring.",
    "Analog & Digital Electronics + Signal Conditioning focus. Process Control and Communications provide moderate difficulty challenge.",
    "Balanced IN paper: Measurement Systems, Transducers, and Network Analysis form the core. Mix of recall and application questions.",
    "Comprehensive Instrumentation paper covering all major subjects. Easy questions from basic measurements, moderate from Control Systems, difficult from Process Control. Complete exam simulation.",
  ],
  PI: [
    "Manufacturing Processes + Industrial Engineering focus. High-frequency topics from production and materials science. Formula-based numerical problems.",
    "Machine Design + Thermal Engineering combination. Operations Research and Metrology provide scoring opportunities.",
    "Engineering Mechanics + Mechanics of Materials emphasis. Production Planning and Control questions test applied knowledge.",
    "Full-syllabus PI paper covering all major subjects. Mix of manufacturing, thermal, and industrial topics. Realistic exam simulation with balanced difficulty.",
  ],
  CH: [
    "Process Calculations + Thermodynamics focus. Mass Transfer and Heat Transfer form the numerical core. Chemical Reaction Engineering provides conceptual challenge.",
    "Fluid Mechanics + Mechanical Operations emphasis. Process Control and Heat Transfer provide moderate scoring opportunities.",
    "Balanced CH paper: Thermodynamics, Mass Transfer, and Fluid Mechanics are the pillars. Mix of calculation-heavy and conceptual questions.",
    "Comprehensive Chemical Engineering paper. Easy questions from basic concepts, moderate from process calculations, difficult from multi-concept integration. Complete exam simulation.",
  ],
  BT: [
    "Genetics + Biochemistry focus. Molecular Biology and Cell Biology form the conceptual core. Bioprocess Engineering provides applied challenge.",
    "Immunology + Microbiology emphasis. Bioinformatics and Genetics provide moderate difficulty scoring opportunities.",
    "Biochemistry + Cell Biology combination. Molecular Biology and Genetics questions test depth of understanding.",
    "Full-syllabus BT paper covering all major subjects. Mix of recall from basic biology, application from genetics, and analysis from bioprocess engineering. Realistic exam simulation.",
  ],
  MT: [
    "Physical Metallurgy + Mechanical Metallurgy focus. Phase Transformations and Heat Treatment form the core. Extractive Metallurgy provides variety.",
    "Corrosion + Welding emphasis. Non-Ferrous Metals and Mechanical Metallurgy provide moderate scoring opportunities.",
    "Phase Transformations + Physical Metallurgy combination. Material science fundamentals tested alongside applied metallurgy.",
    "Comprehensive MT paper covering all major subjects. Easy questions from basic concepts, moderate from phase transformations, difficult from integrated metallurgical analysis. Complete exam simulation.",
  ],
  TF: [
    "Textile Fibers + Yarn Manufacturing focus. Fabric Manufacturing and Textile Testing form the core. Chemical Processing provides numerical variety.",
    "Fabric Manufacturing + Textile Physics emphasis. Yarn Manufacturing and Textile Machinery provide moderate scoring opportunities.",
    "Textile Testing + Chemical Processing combination. Apparel Engineering and Textile Physics questions test applied knowledge.",
    "Full-syllabus TF paper covering all major subjects. Mix of fiber science, manufacturing processes, and testing methodologies. Realistic exam simulation with balanced difficulty.",
  ],
  PE: [
    "Petroleum Exploration + Reservoir Engineering focus. Drilling Engineering and Production Engineering form the core numerical section.",
    "Well Testing + Production Engineering emphasis. Reservoir Engineering and Formation Evaluation provide moderate scoring opportunities.",
    "Drilling Engineering + Petroleum Exploration combination. Offshore Engineering and Petroleum Chemistry test depth of understanding.",
    "Comprehensive PE paper covering all major subjects. Easy questions from basic concepts, moderate from reservoir engineering, difficult from integrated petroleum analysis. Complete exam simulation.",
  ],
  EY: [
    "Ecology + Evolution focus. Genetics and Environmental Science form the conceptual core. Cell Biology and Plant Physiology provide variety.",
    "Zoology + Behavioral Ecology emphasis. Ecology and Evolution provide moderate difficulty scoring opportunities.",
    "Genetics + Environmental Science combination. Cell Biology and Plant Physiology questions test applied ecology knowledge.",
    "Full-syllabus EY paper covering all major subjects. Mix of ecology, evolution, genetics, and organismal biology. Realistic exam simulation with balanced difficulty across life science domains.",
  ],
  MA: [
    "Algebra + Calculus focus. Linear Algebra and Real Analysis form the core mathematical foundation. Probability provides numerical variety.",
    "Analysis + Topology emphasis. Algebra and Calculus provide moderate scoring opportunities with high accuracy potential.",
    "Probability + Real Analysis combination. Complex Analysis and Topology questions test depth of mathematical reasoning.",
    "Comprehensive MA paper covering all major mathematics topics. Mix of proof-based analysis, computational algebra, and applied probability. Realistic exam simulation matching GATE Mathematics pattern.",
  ],
  AR: [
    "Architecture + Building Materials focus. Urban Planning and Design form the conceptual core. Construction Technology provides applied challenge.",
    "Climate & Services + Landscape Architecture emphasis. Architecture and Building Materials provide moderate scoring opportunities.",
    "Urban Planning + Design combination. Structural Systems and Construction Technology questions test applied architectural knowledge.",
    "Full-syllabus AR paper covering all major subjects. Mix of design theory, building science, and planning concepts. Realistic exam simulation with balanced difficulty.",
  ],
  AG: [
    "Farm Machinery & Power + Irrigation focus. Soil and Water Conservation and Food Processing form the core. Surveying provides numerical variety.",
    "Post Harvest Engineering + Renewable Energy emphasis. Farm Machinery and Irrigation provide moderate scoring opportunities.",
    "Soil and Water Conservation + Food Processing combination. Farm Power and Renewable Energy questions test applied agricultural knowledge.",
    "Comprehensive AG paper covering all major subjects. Mix of farm mechanics, irrigation, and food technology. Realistic exam simulation with balanced difficulty across agricultural engineering domains.",
  ],
  GG: [
    "Geology + Geophysics focus. Petrology and Stratigraphy form the core earth science foundation. Remote Sensing provides applied variety.",
    "Structural Geology + Mineralogy emphasis. Geology and Geophysics provide moderate scoring opportunities.",
    "Geophysics + Remote Sensing combination. Petrology and Structural Geology questions test integrated earth science understanding.",
    "Full-syllabus GG paper covering all major subjects. Mix of geology, geophysics, and remote sensing. Realistic exam simulation with balanced difficulty across earth science domains.",
  ],
  PH: [
    "Classical Mechanics + Electromagnetism focus. Quantum Mechanics and Thermal Physics form the core physics foundation. Optics provides numerical variety.",
    "Solid State Physics + Nuclear Physics emphasis. Classical Mechanics and Electromagnetism provide moderate scoring opportunities.",
    "Quantum Mechanics + Statistical Mechanics combination. Thermal Physics and Optics questions test applied physics knowledge.",
    "Comprehensive PH paper covering all major subjects. Mix of classical, quantum, and applied physics. Realistic exam simulation with balanced difficulty across physics domains.",
  ],
  XE: [
    "Section A (Engg Math) + Section B (Fluid Mechanics) + Section C (Materials). Comprehensive coverage across engineering fundamentals.",
    "Section A + Section D (Solid Mechanics) + Section E (Thermodynamics). Mechanics-focused paper with strong math foundation.",
    "Section A + Section B + Section D. Fluid + Solid mechanics combo with compulsory engineering mathematics. Balanced engineering sciences paper.",
    "All sections represented. Mix of easy and moderate questions across all XE subjects. Best for final readiness check with realistic exam conditions.",
  ],
  XL: [
    "Section P (Chemistry) + Section Q (Biochemistry) + Section R (Botany). Life sciences comprehensive with chemistry foundation.",
    "Section P + Section S (Microbiology) + Section T (Zoology). Deep biology focus with chemistry foundation. Strong for P+S+T combination.",
    "Section P + Section Q + Section T. Biochemistry + Zoology combo with organic chemistry emphasis. Ideal for P+Q+T aspirants.",
    "Full XL syllabus paper covering all sections. Balanced mix of recall, application, and analysis questions. Designed for complete exam simulation with realistic timing.",
  ],
};

const RATIONALE_TEMPLATES: Record<string, string[]> = {
  CS: [
    "This paper puts Programming & Data Structures front and center (~12 marks), reflecting their dominant presence in recent GATE papers. Algorithms and OS share ~20 marks combined. DBMS and CN provide moderate scoring opportunities. MSQ questions test multi-correct understanding — a pattern increasingly seen in GATE CSE. Easy questions from Digital Logic and Engg Math ensure quick starts.",
    "Computer Networks and DBMS are emphasized based on 2024's rising weightage for these subjects. Theory of Computation PDA and grammar questions test formal reasoning. Compiler Design lexical analysis and parsing provide moderate difficulty. Engineering Mathematics probability and graph theory appear in NAT format. This paper rewards students who've practiced previous year questions thoroughly.",
    "Algorithms and Data Structures form the analytical backbone. Digital Logic combinational circuits and COA pipelining questions test hardware-software interface understanding. OS process scheduling and memory management questions follow GATE's standard patterns. Theory of Computation regular languages and TMs provide conceptual challenge. Engineering Mathematics linear algebra and calculus offer numerical variety.",
    "Comprehensive CS paper covering all major subjects. OS memory management page replacement algorithms, DBMS transaction concurrency, CN sliding window and routing, and TOC decidability form the core. Compiler Design LR parsing and SE COCOMO provide moderate questions. This paper targets 60+ marks for strong students with difficult MSQs filtering top ranks.",
  ],
  EC: [
    "This paper emphasizes Network, Signals & Systems combined with Electronic Devices (~23 marks). Analog and Digital Circuits provide the hardware foundation. Control Systems stability questions are placed strategically. Communication Systems and EMFT form the advanced core. NAT questions test numerical precision in Signals and Networks.",
    "Built around Analog Circuits and Digital Circuits as the backbone, with Communication Systems and Control Systems forming the core. Electronic Devices semiconductor physics questions are placed early. Networks network theorems and two-port networks provide scoring opportunities. Complex problems combine multiple concepts — typical of recent GATE trends.",
    "Network, Signals & Systems and Electronic Devices are given extra weight based on 2024 trends. Control Systems time response and stability questions are placed early. EMFT transmission lines and waveguides test conceptual clarity. Communication Systems digital communication and information theory appear in the complex section.",
    "Comprehensive EC paper covering all major subjects. Networks network theorems and transient analysis, Signals Fourier and Laplace transforms, Devices PN junction and MOSFET characteristics, and Analog op-amp circuits form the core. Digital circuits sequential design and Control Systems root locus provide moderate questions. Communication Systems PCM and modulation provide scoring opportunities. Difficult MSQs from EMFT and advanced topics filter top ranks.",
  ],
  EE: [
    "This paper emphasizes Electrical Machines (highest weightage at ~14 marks) combined with Power Systems and Power Electronics (~22 marks combined). Control Systems stability questions are placed strategically. Network Theory forms the foundation for several circuit-based questions. NAT questions test numerical precision in Power Electronics and Control Systems.",
    "Built around Circuit Theory and Network Analysis as the backbone, with Power Electronics chopper/inverter questions forming the core. Digital Electronics sequential circuits feature prominently. Signals & Systems Laplace transform questions test analytical ability. Complex problems combine multiple concepts — typical of recent GATE trends.",
    "Analog Electronics and Digital Electronics are given extra weight based on 2024 trends. Signals & Systems sampling theorem and Fourier questions are placed early. EMFT electrostatics questions test conceptual clarity. Control Systems state-space representation appears in the complex section.",
    "Heavy Machines paper: Transformer equivalent circuits, induction motor torque, and synchronous machine alternator problems form the core. Power Systems fault analysis (symmetrical components) and load flow are tested. Control Systems root locus and Bode plot questions assess frequency-domain skills.",
  ],
  ME: [
    "Manufacturing Processes lead with casting defects, machining tool life, and metal forming calculations. SOM torsion and bending moment problems test fundamentals. Fluid Mechanics Bernoulli applications and turbomachinery provide numerical challenge. Complex questions combine thermodynamics with heat transfer — a proven GATE pattern.",
    "Thermodynamics entropy and availability questions form the conceptual core. Heat Transfer conduction (1D/2D) and heat exchanger problems follow. TOM kinematics and gear train questions test mechanical understanding. Industrial Engineering LP and PERT/CPM provide scoring opportunities.",
    "Engineering Mechanics equilibrium and friction problems establish the foundation. Vibrations single DOF free/forced vibration analysis appears in the section. Machine Design shaft and spring design problems provide applied mechanics testing. Manufacturing welding and sheet metal operations test practical knowledge.",
    "SOM combined with Vibrations creates a mechanical duo paper. Torsion, bending, and beam deflection problems flow into multi-DOF vibration analysis. Fluid Mechanics dimensional analysis and boundary layer theory provide variety. IC Engine Otto/Diesel cycle questions reflect consistent weightage.",
  ],
  CE: [
    "Structural Engineering dominates (~22 marks) with SFD/BMD, deflection, and RCC design questions. Geotechnical Engineering permeability and shear strength problems follow. Water Resources Engineering unit hydrograph and canal design questions test application skills. Complex problems combine structural analysis with design — matching 2024's trend.",
    "Environmental Engineering water treatment and wastewater questions are emphasized based on rising weightage. Transportation highway geometric design and pavement problems follow. Core Structural questions ensure baseline coverage. Surveying and Construction Management provide easy scoring opportunities.",
    "Balanced paper covering all major CE subjects proportionally. Structural analysis indeterminate structures (moment distribution) challenge analytical skills. Geotechnical consolidation and earth pressure problems test depth. Hydrology flood routing appears in the NAT section.",
    "Structural + Geotechnical intensive. RCC beam design, steel design, and soil bearing capacity form the complex challenge questions. Fluid mechanics open channel flow and boundary layer provide scoring opportunities. Transportation traffic engineering problems test applied knowledge.",
  ],
  IN: [
    "Sensors & Instrumentation leads with transducers, signal conditioning, and measurement systems. Control Systems forms the analytical backbone with stability and root locus questions. Electrical Circuits provides the foundation with network theorems and transient analysis.",
    "Analog & Digital Electronics combined with Process Control. Communication Systems analog and digital modulation provide moderate difficulty. Measurement Systems error analysis and instrument characteristics test precision understanding.",
    "Balanced IN paper: Electrical Circuits network analysis, Control Systems frequency response, and Sensors transducer characteristics form the core. Mix of recall, application, and analysis questions matching GATE IN pattern.",
    "Comprehensive Instrumentation paper. Easy questions from basic measurements and transducers, moderate from Control Systems and Signal Conditioning, difficult from Process Control and Communication Systems. Complete exam simulation with realistic difficulty curve.",
  ],
  PI: [
    "Manufacturing Processes lead with casting, machining, and forming operations. Industrial Engineering production planning and OR provide scoring opportunities. Mechanics of Materials stress-strain problems test fundamentals.",
    "Machine Design and Thermal Engineering combination. Metrology and inspection questions provide easy marks. Operations Research LP and scheduling problems test analytical skills.",
    "Engineering Mechanics and Mechanics of Materials emphasis. Manufacturing processes and Industrial Engineering questions follow GATE's standard patterns. Production Planning provides moderate application questions.",
    "Full-syllabus PI paper. Easy recall from basic manufacturing concepts, moderate application from thermal and design topics, difficult analysis from OR and integrated production problems. Complete exam simulation.",
  ],
  CH: [
    "Process Calculations and Thermodynamics form the conceptual core. Mass Transfer and Heat Transfer provide numerical challenge. Fluid Mechanics Bernoulli applications and boundary layer theory test fundamentals.",
    "Chemical Reaction Engineering kinetics and reactor design emphasis. Process Control and Mechanical Operations provide moderate scoring opportunities. Heat Transfer conduction and convection problems test applied knowledge.",
    "Balanced CH paper: Thermodynamics laws and entropy, Mass Transfer distillation and absorption, and Fluid Mechanics pipe flow form the pillars. Mix of calculation-heavy and conceptual questions.",
    "Comprehensive Chemical Engineering paper. Easy questions from basic concepts, moderate from process calculations and unit operations, difficult from multi-concept integration in reaction engineering. Complete exam simulation.",
  ],
  BT: [
    "Genetics and Biochemistry form the conceptual core. Molecular Biology and Cell Biology provide the foundation. Bioprocess Engineering bioreactor design tests applied knowledge.",
    "Immunology and Microbiology emphasis. Bioinformatics sequence analysis and Genetics molecular genetics provide moderate difficulty. Cell Biology signaling pathways test depth.",
    "Biochemistry metabolism and enzymology combined with Genetics population and molecular genetics. Bioprocess Engineering fermentation and downstream processing provide numerical variety.",
    "Full-syllabus BT paper. Easy questions from basic biology concepts, moderate from genetics and biochemistry, difficult from integrated bioprocess and molecular biology problems. Complete exam simulation.",
  ],
  MT: [
    "Physical Metallurgy and Mechanical Metallurgy form the core. Phase Transformations and Heat Treatment provide the fundamental understanding. Extractive Metallurgy provides variety.",
    "Corrosion and Welding emphasis. Non-Ferrous Metals and Phase Transformations provide moderate scoring opportunities. Heat Treatment TTT and CCT diagrams test applied knowledge.",
    "Phase Transformations + Physical Metallurgy combination. Mechanical Metallurgy testing and Extractive Metallurgy pyrometallurgy questions test depth of understanding.",
    "Comprehensive MT paper. Easy questions from basic metallurgical concepts, moderate from phase transformations and heat treatment, difficult from integrated materials analysis. Complete exam simulation.",
  ],
  TF: [
    "Textile Fibers and Yarn Manufacturing form the foundation. Fabric Manufacturing and Textile Testing provide the core content. Chemical Processing provides numerical variety.",
    "Fabric Manufacturing and Textile Physics emphasis. Yarn Manufacturing and Textile Machinery provide moderate scoring opportunities. Chemical Processing dyeing and finishing test applied knowledge.",
    "Textile Testing + Chemical Processing combination. Fabric Manufacturing and Textile Physics questions test depth of manufacturing understanding.",
    "Full-syllabus TF paper. Easy questions from basic textile concepts, moderate from manufacturing processes, difficult from integrated testing and processing problems. Complete exam simulation.",
  ],
  PE: [
    "Petroleum Exploration and Reservoir Engineering form the core. Drilling Engineering and Production Engineering provide numerical challenge. Well Testing provides applied variety.",
    "Reservoir Engineering and Production Engineering emphasis. Formation Evaluation and Petroleum Chemistry provide moderate scoring opportunities.",
    "Drilling Engineering + Exploration combination. Reservoir Engineering and Well Testing questions test depth of petroleum understanding.",
    "Comprehensive PE paper. Easy questions from basic petroleum concepts, moderate from reservoir and drilling engineering, difficult from integrated production and formation evaluation problems. Complete exam simulation.",
  ],
  EY: [
    "Ecology and Evolution form the conceptual core. Genetics and Environmental Science provide the foundation. Cell Biology and Plant Physiology test applied knowledge.",
    "Zoology and Behavioral Ecology emphasis. Ecology community ecology and Genetics molecular evolution provide moderate difficulty.",
    "Genetics + Environmental Science combination. Ecology and Evolution questions test depth of biological understanding across levels of organization.",
    "Full-syllabus EY paper. Easy questions from basic ecology and evolution concepts, moderate from genetics and cell biology, difficult from integrated ecological analysis. Complete exam simulation.",
  ],
  MA: [
    "Algebra and Calculus form the foundation. Linear Algebra and Real Analysis provide the core analytical framework. Probability adds numerical variety.",
    "Analysis and Topology emphasis. Algebra group theory and Calculus multivariable provide moderate scoring opportunities with high accuracy potential.",
    "Probability + Real Analysis combination. Complex Analysis contour integration and Topology metric spaces questions test depth of mathematical reasoning.",
    "Comprehensive MA paper. Mix of proof-based analysis, computational algebra, and applied probability. Realistic exam simulation matching GATE Mathematics pattern with balanced difficulty across pure and applied topics.",
  ],
  AR: [
    "Architecture design theory and Building Materials form the core. Urban Planning and Design provide the conceptual framework. Construction Technology tests applied knowledge.",
    "Climate, Services, and Landscape Architecture emphasis. Architecture and Building Materials provide moderate scoring opportunities with visual-spatial questions.",
    "Urban Planning + Design combination. Structural Systems and Construction Technology questions test depth of architectural understanding.",
    "Full-syllabus AR paper. Easy questions from basic design and building materials, moderate from urban planning and construction, difficult from integrated design-structural problems. Complete exam simulation.",
  ],
  AG: [
    "Farm Machinery & Power and Irrigation form the core engineering domains. Soil and Water Conservation and Food Processing provide applied variety. Surveying adds numerical precision testing.",
    "Post Harvest Engineering and Renewable Energy emphasis. Farm Machinery and Irrigation provide moderate scoring opportunities with practical applications.",
    "Soil and Water Conservation + Food Processing combination. Farm Power and Renewable Energy questions test applied agricultural engineering knowledge.",
    "Comprehensive AG paper. Easy questions from basic agricultural concepts, moderate from machinery and irrigation design, difficult from integrated farm system problems. Complete exam simulation.",
  ],
  GG: [
    "Geology and Geophysics form the dual core. Petrology and Stratigraphy provide the earth science foundation. Remote Sensing adds applied variety with GIS questions.",
    "Structural Geology and Mineralogy emphasis. Geology mineral identification and Geophysics seismic methods provide moderate scoring opportunities.",
    "Geophysics + Remote Sensing combination. Petrology and Structural Geology questions test integrated earth science understanding across scales.",
    "Full-syllabus GG paper. Easy questions from basic geology and geophysics, moderate from structural geology and mineralogy, difficult from integrated remote sensing and geophysical interpretation. Complete exam simulation.",
  ],
  PH: [
    "Classical Mechanics and Electromagnetism form the dual core. Quantum Mechanics and Thermal Physics provide the advanced physics foundation. Optics adds applied variety.",
    "Solid State Physics and Nuclear Physics emphasis. Classical Mechanics Lagrangian mechanics and Electromagnetism Maxwell equations provide moderate scoring opportunities.",
    "Quantum Mechanics + Statistical Mechanics combination. Thermal Physics and Optics questions test depth of physics understanding across classical and quantum regimes.",
    "Comprehensive PH paper. Easy questions from basic physics concepts, moderate from classical mechanics and electromagnetism, difficult from integrated quantum and statistical mechanics problems. Complete exam simulation.",
  ],
  XE: [
    "Section A (Engineering Mathematics) covers Linear Algebra, Calculus ODEs, and Vector Calculus — the core mathematical foundation. Section B (Fluid Mechanics) tests fluid statics, Bernoulli applications, and boundary layer theory. Section C (Materials Science) covers crystal structures, phase diagrams, and mechanical properties. Ideal for students choosing B+C combination.",
    "Section A Engineering Mathematics paired with Section D (Solid Mechanics) stress-strain, bending, torsion, and buckling problems. Section E (Thermodynamics) laws, entropy, and thermodynamic cycles complete this mechanics-focused paper. Best for students choosing D+E combination.",
    "Section A + Section B + Section D. Fluid Mechanics boundary layer theory and dimensional analysis pair with Solid Mechanics beam deflection and column buckling. Strong engineering mechanics foundation paper with compulsory math.",
    "All XE sections represented in realistic exam proportions. Easy math questions test calculus and linear algebra basics. Moderate questions from Fluid and Solid Mechanics test core competence. Difficult questions from Materials and Thermodynamics simulate the real exam's analytical challenges. Ideal for timed practice.",
  ],
  XL: [
    "Section P (Chemistry) Organic reaction mechanisms, Physical Chemistry thermodynamics/kinetics, and Inorganic coordination compounds. Section Q (Biochemistry) proteins, enzymes, metabolism. Section R (Botany) plant physiology, genetics. Comprehensive for P+Q+R combination students.",
    "Section P + Section S (Microbiology) + Section T (Zoology). Deep biology focus with chemistry foundation. Microbiology microbial physiology and genetics form Section S. Zoology animal physiology and developmental biology (Section T) complete this biology-heavy paper.",
    "Section P + Section Q + Section T. Biochemistry metabolism and molecular biology (Section Q) pair with Zoology genetics and ecology (Section T). Strong biochemistry focus for P+Q+T aspirants with organic chemistry emphasis.",
    "Full XL syllabus paper covering all sections. Balanced mix of recall, application, and analysis questions. Designed for complete exam simulation with realistic timing. Easy chemistry questions provide quick marks, moderate biology questions test depth, and difficult multi-concept questions challenge even prepared students.",
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
    EC: {
      "General Aptitude": "General Aptitude",
      "Engineering Mathematics": "Engineering Mathematics",
      "Network, Signals & Systems": "Network, Signals & Systems",
      "Network Theorems": "Network, Signals & Systems",
      "Signals and Systems": "Network, Signals & Systems",
      "Signals & Systems": "Network, Signals & Systems",
      "Networks": "Network, Signals & Systems",
      "Electronic Devices": "Electronic Devices",
      "ED": "Electronic Devices",
      "Analog Circuits": "Analog Circuits",
      "Digital Circuits": "Digital Circuits",
      "Control Systems": "Control Systems",
      "CS": "Control Systems",
      "Communication Systems": "Communication Systems",
      "Communications": "Communication Systems",
      "Electromagnetics": "Electromagnetics",
      "EMFT": "Electromagnetics",
      "Electromagnetic Field Theory": "Electromagnetics",
      "Analog & Digital Electronics": "Analog & Digital Electronics",
      "ADE": "Analog & Digital Electronics",
      "Electrical & Electronic Measurements": "Electrical & Electronic Measurements",
      "Measurements": "Electrical & Electronic Measurements",
      "EC": "Network, Signals & Systems",
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
      "Surveying": "Surveying & Geomatics",
      "Surveying & Geomatics": "Surveying & Geomatics",
      "Concrete Technology": "Construction Materials",
      "Construction Materials and Management": "Construction Materials",
      "Construction Materials": "Construction Materials",
    },
    IN: {
      "General Aptitude": "General Aptitude",
      "Engineering Mathematics": "Engineering Mathematics",
      "Electrical Circuits": "Electrical Circuits",
      "Network Analysis": "Electrical Circuits",
      "Sensors & Instrumentation": "Sensors & Instrumentation",
      "Sensors": "Sensors & Instrumentation",
      "Transducers": "Sensors & Instrumentation",
      "Control Systems": "Control Systems",
      "Analog & Digital Electronics": "Analog & Digital Electronics",
      "Analog Electronics": "Analog & Digital Electronics",
      "Digital Electronics": "Analog & Digital Electronics",
      "Communications & Process Control": "Communications & Process Control",
      "Communication Systems": "Communications & Process Control",
      "Process Control": "Communications & Process Control",
      "Measurement Systems": "Measurement Systems",
      "Signal Conditioning": "Signal Conditioning",
      "Electrical and Electronics Measurements": "Measurement Systems",
    },
    PI: {
      "General Aptitude": "General Aptitude",
      "Engineering Mathematics": "Engineering Mathematics",
      "Manufacturing Processes": "Manufacturing Processes",
      "Manufacturing": "Manufacturing Processes",
      "Machine Design": "Machine Design",
      "Thermal Engineering": "Thermal Engineering",
      "Industrial Engineering": "Industrial Engineering",
      "Mechanics of Materials": "Mechanics of Materials",
      "Metrology": "Metrology & Inspection",
      "Metrology & Inspection": "Metrology & Inspection",
      "Production Planning & Control": "Production Planning & Control",
      "Operations Research": "Operations Research",
      "OR": "Operations Research",
    },
    CH: {
      "General Aptitude": "General Aptitude",
      "Engineering Mathematics": "Engineering Mathematics",
      "Process Calculations": "Process Calculations",
      "Thermodynamics": "Thermodynamics",
      "Fluid Mechanics": "Fluid Mechanics",
      "Heat Transfer": "Heat Transfer",
      "Mass Transfer": "Mass Transfer",
      "Chemical Reaction Engineering": "Chemical Reaction Engineering",
      "CRE": "Chemical Reaction Engineering",
      "Process Control": "Process Control",
      "Mechanical Operations": "Mechanical Operations",
    },
    BT: {
      "General Aptitude": "General Aptitude",
      "Engineering Mathematics": "Engineering Mathematics",
      "Genetics": "Genetics",
      "Biochemistry": "Biochemistry",
      "Microbiology": "Microbiology",
      "Bioprocess Engineering": "Bioprocess Engineering",
      "Immunology": "Immunology",
      "Bioinformatics": "Bioinformatics",
      "Cell Biology": "Cell Biology",
      "Molecular Biology": "Molecular Biology",
    },
    MT: {
      "General Aptitude": "General Aptitude",
      "Engineering Mathematics": "Engineering Mathematics",
      "Physical Metallurgy": "Physical Metallurgy",
      "Extractive Metallurgy": "Extractive Metallurgy",
      "Mechanical Metallurgy": "Mechanical Metallurgy",
      "Phase Transformations": "Phase Transformations",
      "Heat Treatment": "Heat Treatment",
      "Corrosion": "Corrosion",
      "Welding & Joining": "Welding & Joining",
      "Welding": "Welding & Joining",
      "Non-Ferrous Metals & Alloys": "Non-Ferrous Metals & Alloys",
      "Non-Ferrous Metals": "Non-Ferrous Metals & Alloys",
    },
    TF: {
      "General Aptitude": "General Aptitude",
      "Engineering Mathematics": "Engineering Mathematics",
      "Textile Fibers": "Textile Fibers",
      "Yarn Manufacturing": "Yarn Manufacturing",
      "Fabric Manufacturing": "Fabric Manufacturing",
      "Textile Testing": "Textile Testing",
      "Chemical Processing": "Chemical Processing",
      "Apparel Engineering": "Apparel Engineering",
      "Textile Machinery": "Textile Machinery",
      "Textile Physics": "Textile Physics",
    },
    PE: {
      "General Aptitude": "General Aptitude",
      "Engineering Mathematics": "Engineering Mathematics",
      "Petroleum Exploration": "Petroleum Exploration",
      "Drilling Engineering": "Drilling Engineering",
      "Reservoir Engineering": "Reservoir Engineering",
      "Production Engineering": "Production Engineering",
      "Petroleum Formation Evaluation": "Petroleum Formation Evaluation",
      "Offshore Drilling": "Offshore Drilling",
      "Well Testing": "Well Testing",
      "Petroleum Chemistry": "Petroleum Chemistry",
    },
    EY: {
      "General Aptitude": "General Aptitude",
      "Engineering Mathematics": "Engineering Mathematics",
      "Ecology": "Ecology",
      "Evolution": "Evolution",
      "Genetics": "Genetics",
      "Environmental Science": "Environmental Science",
      "Cell Biology": "Cell Biology",
      "Plant Physiology": "Plant Physiology",
      "Zoology": "Zoology",
      "Behavioral Ecology": "Behavioral Ecology",
    },
    MA: {
      "General Aptitude": "General Aptitude",
      "Engineering Mathematics": "Engineering Mathematics",
      "Algebra": "Algebra",
      "Calculus": "Calculus",
      "Analysis": "Analysis",
      "Topology": "Topology",
      "Probability": "Probability",
      "Real Analysis": "Real Analysis",
      "Linear Algebra": "Linear Algebra",
      "Complex Analysis": "Complex Analysis",
    },
    AR: {
      "General Aptitude": "General Aptitude",
      "Engineering Mathematics": "Engineering Mathematics",
      "Architecture": "Architecture",
      "Building Materials": "Building Materials",
      "Urban Planning": "Urban Planning",
      "Design": "Design",
      "Construction": "Construction Technology",
      "Construction Technology": "Construction Technology",
      "Climate": "Climate & Services",
      "Services": "Climate & Services",
      "Climate & Services": "Climate & Services",
      "Landscape": "Landscape Architecture",
      "Landscape Architecture": "Landscape Architecture",
      "Structural Systems": "Structural Systems",
    },
    AG: {
      "General Aptitude": "General Aptitude",
      "Engineering Mathematics": "Engineering Mathematics",
      "Farm Machinery": "Farm Machinery & Power",
      "Farm Power": "Farm Machinery & Power",
      "Farm Machinery & Power": "Farm Machinery & Power",
      "Irrigation": "Irrigation & Drainage",
      "Irrigation & Drainage": "Irrigation & Drainage",
      "Soil and Water": "Soil and Water Conservation",
      "Soil and Water Conservation": "Soil and Water Conservation",
      "Post Harvest": "Post Harvest Engineering",
      "Post Harvest Engineering": "Post Harvest Engineering",
      "Food Processing": "Food Processing",
      "Surveying": "Surveying & Leveling",
      "Surveying & Leveling": "Surveying & Leveling",
      "Green Energy": "Renewable Energy",
      "Renewable Energy": "Renewable Energy",
      "Agricultural Engineering Basics": "Agricultural Engineering Basics",
    },
    GG: {
      "General Aptitude": "General Aptitude",
      "Engineering Mathematics": "Engineering Mathematics",
      "Geology": "Geology",
      "Geophysics": "Geophysics",
      "Remote Sensing": "Remote Sensing & GIS",
      "Remote Sensing & GIS": "Remote Sensing & GIS",
      "Petrology": "Petrology",
      "Stratigraphy": "Stratigraphy",
      "Structural Geology": "Structural Geology",
      "Mineralogy": "Mineralogy",
    },
    PH: {
      "General Aptitude": "General Aptitude",
      "Engineering Mathematics": "Engineering Mathematics",
      "Classical Mechanics": "Classical Mechanics",
      "Electromagnetism": "Electromagnetism",
      "Quantum Mechanics": "Quantum Mechanics",
      "Thermal Physics": "Thermal Physics",
      "Optics": "Optics",
      "Solid State": "Solid State Physics",
      "Solid State Physics": "Solid State Physics",
      "Nuclear Physics": "Nuclear Physics",
      "Statistical Mechanics": "Statistical Mechanics",
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
  const paperId = `${branch}-M${paperIndex + 1}`;

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

  // Select questions per subject
  const selectedQuestions: { q: RawQuestion; subject: string }[] = [];
  const usageCount: Record<string, number> = {};

  for (const sw of scaledWeightage) {
    const pool = bySubject[sw.name] || [];
    if (pool.length === 0) continue;
    // Roughly 1.5 marks per question, minimum 1
    const qCount = Math.max(1, Math.round(sw.marks / 1.5));
    const unused = pool.filter((q) => (usageCount[q.id] || 0) < 3);
    const sourcePool = unused.length >= qCount ? unused : pool;
    const chosen = pickWithoutReplacement(sourcePool, qCount, rand);

    for (const q of chosen) {
      usageCount[q.id] = (usageCount[q.id] || 0) + 1;
      selectedQuestions.push({ q, subject: sw.name });
    }
  }

  // Pad if needed — use unique generated fallback questions to avoid duplicates
  if (selectedQuestions.length < TOTAL_QUESTIONS) {
    const needed = TOTAL_QUESTIONS - selectedQuestions.length;
    const uniqueFallbacks = generateUniqueFallback(branch, needed, rand);
    for (const fb of uniqueFallbacks) {
      if (fb.q && fb.q.question_text) {
        selectedQuestions.push(fb);
      }
    }
  }

  // Filter out any null/invalid entries
  const validQuestions = selectedQuestions.filter(sq => sq.q && sq.q.question_text && sq.q.answer);
  // Pad back to TOTAL_QUESTIONS if needed
  while (validQuestions.length < TOTAL_QUESTIONS) {
    const extra = generateUniqueFallback(branch, 5, rand).filter(fb => fb.q && fb.q.question_text && fb.q.answer);
    for (const fb of extra) {
      if (validQuestions.length >= TOTAL_QUESTIONS) break;
      validQuestions.push(fb);
    }
  }

  validQuestions.length = TOTAL_QUESTIONS;

  // Assign marks: scale to sum to exactly 100
  const rawMarks = validQuestions.map((sq) => sq.q.marks || 1);
  const rawTotal = rawMarks.reduce((s, m) => s + m, 0);
  const markScale = TOTAL_MARKS / rawTotal;
  let adjustedMarks = rawMarks.map((m) => Math.round(m * markScale));

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
  const questions: PredictedQuestion[] = validQuestions.map((sq, idx) => {
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
      correctAnswer: sq.q.answer || "",
      explanation: explanationText,
      source: `Adapted from GATE ${sq.q.year} ${branch} Session ${sq.q.session || "1"} Q${sq.q.question_number}`,
    };
  });

  const finalMarks = questions.reduce((s, q) => s + q.marks, 0);

  // Subject breakdown
  const subjBreakdown: Record<string, { marks: number; questions: number }> = {};
  for (const q of questions.filter(Boolean)) {
    if (!q.subject) continue;
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
    title: `GATE ${branch} Trend-Based Mock Paper ${paperIndex + 1}`,
    description: PAPER_DESCRIPTIONS[branch]?.[paperIndex] || `Trend-Based Mock Paper ${paperIndex + 1} for GATE ${branch}`,
    createdAt: new Date().toISOString(),
    totalQuestions: questions.length,
    totalMarks: finalMarks,
    difficultyDistribution: diffDist,
    subjectBreakdown,
    predictionRationale: RATIONALE_TEMPLATES[branch]?.[paperIndex] || "",
    questions,
  };
}

// ─── Unique Fallback Generator ─────────────────────────────────────────────

// ─── Subject-Specific Fallback Questions ──────────────────────────────────
// GATE-style questions with verified answers, organized by subject.

const FALLBACK_SUBJECTS: Record<string, string[]> = {
  ME: ["Thermodynamics","Fluid Mechanics","Heat Transfer","SOM","Manufacturing","Theory of Machines","Engineering Mathematics"],
  CE: ["SOM","Structural Analysis","Geotechnical","Environmental","Surveying","Transportation","Engineering Mathematics"],
  EE: ["Network Theory","Electrical Machines","Power Systems","Control Systems","Power Electronics","Measurements","Engineering Mathematics"],
  EC: ["Network Theory","Signal Systems","Analog Electronics","Digital Electronics","Communication","EMFT","Engineering Mathematics"],
  CS: ["Algorithms","Data Structures","DBMS","Operating Systems","Computer Networks","Computer Organization","Engineering Mathematics"],
  IN: ["Control Systems","Signal Processing","Analog Electronics","Digital Electronics","Communication","Network Theory","Engineering Mathematics"],
  PI: ["Thermodynamics","Fluid Mechanics","Heat Transfer","Manufacturing","SOM","Engineering Mathematics"],
  CH: ["Thermodynamics","Fluid Mechanics","Mass Transfer","Heat Transfer","Process Control","Engineering Mathematics"],
  BT: ["Biology","Genetics","Biochemistry","Microbiology","Cell Biology","Engineering Mathematics"],
  MT: ["Material Science","Physical Metallurgy","Extractive Metallurgy","Mechanical Metallurgy","Engineering Mathematics"],
  XE: ["Engineering Mechanics","Thermodynamics","Fluid Mechanics","SOM","Manufacturing","Engineering Mathematics"],
  XL: ["Physical Chemistry","Organic Chemistry","Inorganic Chemistry","Chemistry","Engineering Mathematics"],
  TF: ["Textile Fibers","Yarn Manufacture","Fabric Manufacture","Textile Testing","Engineering Mathematics"],
  PE: ["Petroleum Exploration","Drilling","Production","Reservoir Engineering","Thermodynamics","Engineering Mathematics"],
  EY: ["Biology","Ecology","Evolution","Genetics","Environmental Science","Engineering Mathematics"],
  MA: ["Algebra","Calculus","Linear Algebra","Probability","Analysis","Engineering Mathematics"],
  AR: ["Architecture","Building Materials","Structural Design","Urban Planning","Engineering Mathematics"],
  AG: ["Soil Science","Crop Physiology","Agricultural Engineering","Farm Machinery","Engineering Mathematics"],
  GG: ["Geology","Geophysics","Geomatics","Structural Geology","Engineering Mathematics"],
  PH: ["Classical Mechanics","Electromagnetism","Quantum Mechanics","Thermodynamics","Optics","Engineering Mathematics"],
};

const FALLBACK_QUESTIONS: Record<string, Array<{text: string; opts: string[]; ans: string; explain: string}>> = {
  "Engineering Mechanics": [
    {text:"Particle mass 2 kg under F=3t N. Velocity at t=4s (from rest):", opts:["6 m/s","12 m/s","24 m/s","3 m/s"], ans:"B", explain:"a=F/m=3t/2. v=integral(3t/2)=3t^2/4. At t=4: 3*16/4=12 m/s."},
    {text:"Coefficient of friction 0.3. Angle of friction:", opts:["16.7 deg","30 deg","45 deg","tan^(-1)(0.3)"], ans:"D", explain:"Angle of friction = tan^(-1)(mu). Exact form: tan^(-1)(0.3)."},
    {text:"Two forces 10N, 15N at 60 deg. Resultant magnitude:", opts:["sqrt(325) N","25 N","5 N","12 N"], ans:"A", explain:"R=sqrt(100+225+2*10*15*cos60)=sqrt(325) N."},
    {text:"Body mass 5 kg, KE=200 J. Speed:", opts:["sqrt(80) m/s","10 m/s","sqrt(40) m/s","8 m/s"], ans:"A", explain:"KE=1/2*m*v^2 => 200=2.5*v^2 => v^2=80 => v=sqrt(80) m/s."},
    {text:"Ladder 10m, foot 6m from wall. Angle with ground:", opts:["cos^(-1)(0.6)","sin^(-1)(0.6)","tan^(-1)(1.5)","53.13 deg"], ans:"A", explain:"cos(theta)=adjacent/hypotenuse=6/10=0.6. theta=cos^(-1)(0.6)."},
  ],
  "Thermodynamics": [
    {text:"Carnot efficiency between 600K and 300K:", opts:["50%","100%","0%","25%"], ans:"A", explain:"eta=1-Tc/Th=1-300/600=0.5=50%."},
    {text:"First law for adiabatic: dU =", opts:["dQ","-dW","0","dH"], ans:"B", explain:"Adiabatic: dQ=0. dU=-dW=-PdV."},
    {text:"Entropy change for isothermal ideal gas expansion:", opts:["nR*ln(V2/V1)","nCv*ln(T2/T1)","0","nR*ln(P1/P2)"], ans:"A", explain:"Isothermal reversible: dS=nR*ln(V2/V1)."},
    {text:"Ideal gas internal energy depends on:", opts:["Pressure","Volume","Temperature only","All three"], ans:"C", explain:"Ideal gas: U=f(T) only. Temperature only."},
    {text:"Second law: heat engine rejects heat because:", opts:["Friction","Entropy must increase","Conservation","Temperature drops"], ans:"B", explain:"Second law: total entropy must increase. Some heat always rejected."},
  ],
  "Fluid Mechanics": [
    {text:"Bernoulli applies to:", opts:["Viscous flow","Inviscid incompressible steady","Compressible","Unsteady"], ans:"B", explain:"Bernoulli: inviscid, incompressible, steady along streamline."},
    {text:"Reynolds number: Re =", opts:["rho*v*D/mu","rho*v*D/nu","mu*v*D/rho","v*D/nu"], ans:"A", explain:"Re=rho*v*D/mu. Laminar Re<2000, Turbulent Re>4000."},
    {text:"Viscosity SI unit:", opts:["N/m^2","Pa-s","N-s/m^2","Both B and C"], ans:"D", explain:"Viscosity: Pa-s or N-s/m^2. Equivalent units."},
    {text:"Manometer measures:", opts:["Velocity","Pressure","Temperature","Flow rate"], ans:"B", explain:"Manometer: pressure difference via liquid column height."},
    {text:"Boundary layer thickness grows with:", opts:["sqrt(x)","x","1/x","constant"], ans:"A", explain:"Blasius: delta ~ sqrt(x). delta/x = 5/sqrt(Re_x)."},
  ],
  "Heat Transfer": [
    {text:"Fourier law: q = -k*dT/dx. k is:", opts:["Thermal diffusivity","Thermal conductivity","Heat capacity","Convection coeff"], ans:"B", explain:"Fourier: q=-k*dT/dx where k is thermal conductivity."},
    {text:"Biot number small (Bi<0.1) means:", opts:["High convection","Lumped capacitance valid","High conduction","Steady state"], ans:"B", explain:"Bi<0.1: internal conduction >> surface convection. Lumped capacitance valid."},
    {text:"Stefan-Boltzmann: E = sigma*T^4. sigma is:", opts:["Stefan-Boltzmann constant","Planck","Boltzmann","Gas"], ans:"A", explain:"sigma = 5.67e-8 W/m^2K^4. Stefan-Boltzmann constant."},
    {text:"Shape factor F12 for infinite parallel plates:", opts:["0","1","0.5","Infinity"], ans:"B", explain:"Infinite parallel plates: F12=1. All radiation from 1 reaches 2."},
    {text:"Convection h depends on:", opts:["k only","h only","Flow, fluid props, geometry","Temp only"], ans:"C", explain:"h depends on flow conditions, fluid properties, and geometry."},
  ],
  "SOM": [
    {text:"Bending stress: sigma = My/I. y is:", opts:["Depth","Distance from NA","Length","Width"], ans:"B", explain:"sigma=My/I where y=distance from neutral axis."},
    {text:"Section modulus Z =", opts:["I/y_max","M/sigma","Both A and B","I*y"], ans:"C", explain:"Z=I/y_max=M/sigma_max. Both equivalent."},
    {text:"Max shear stress in rectangular beam:", opts:["3V/(2A)","V/A","2V/A","V/(2A)"], ans:"A", explain:"Tau_max=3V/(2A) for rectangular section at neutral axis."},
    {text:"Euler buckling load pinned-pinned column:", opts:["pi^2EI/L^2","4*pi^2EI/L^2","pi^2EI/(4L^2)","2*pi^2EI/L^2"], ans:"A", explain:"P_cr=pi^2EI/L^2 for pinned-pinned. Effective length=L."},
    {text:"Cantilever end load deflection:", opts:["PL^3/(3EI)","PL^3/(EI)","PL^2/(2EI)","5wL^4/(384EI)"], ans:"A", explain:"Cantilever with end load P: delta=PL^3/(3EI)."},
  ],
  "Manufacturing": [
    {text:"Casting defect: sand fused to surface is:", opts:["Blow hole","Scab","Hot tear","Buckle"], ans:"B", explain:"Scab: sand fused to casting surface. Blow hole: gas cavity."},
    {text:"Cutting speed V = pi*D*N. N is:", opts:["Feed","Depth","Spindle speed (rpm)","Time"], ans:"C", explain:"V=pi*D*N. N=spindle speed in revolutions per minute."},
    {text:"Milling removes material by:", opts:["Rotating cutter","Linear motion","Oscillating tool","Abrasion"], ans:"A", explain:"Milling: rotating multi-tooth cutter removes material."},
    {text:"Electric arc used in:", opts:["Gas welding","Arc welding","Resistance","Soldering"], ans:"B", explain:"Arc welding: electric arc between electrode and workpiece."},
    {text:"Die clearance is typically:", opts:["% of thickness","0.5mm fixed","Infinite","Zero"], ans:"A", explain:"Die clearance: 5-8% of sheet thickness for punching."},
  ],
  "Theory of Machines": [
    {text:"Four bar chain has:", opts:["4 links","4 joints","4 links and 4 joints","2 links"], ans:"C", explain:"Four bar: 4 links connected by 4 revolute joints."},
    {text:"Kinematic pair is:", opts:["Two elements in contact","Single link","Machine","Assembled parts"], ans:"A", explain:"Kinematic pair: two links in contact constraining relative motion."},
    {text:"Kutzbach DOF for planar mechanism:", opts:["3(n-1)-2j","3(n-2)-2j","3(n-1)-j","3n-2j"], ans:"A", explain:"DOF = 3(n-1) - 2j for planar mechanisms (Gruebler/Kutzbach)."},
    {text:"Gyroscopic precession axis is:", opts:["Same as spin","Perpendicular to spin and torque","Opposite to spin","Random"], ans:"B", explain:"Precession: perpendicular to both spin axis and applied torque."},
    {text:"Cam follower with SHM avoids:", opts:["High velocity","Surge/jerk","Force","Friction"], ans:"B", explain:"SHM cam: smooth velocity, zero acceleration at start/end. No surge."},
  ],
  "Network Theory": [
    {text:"Ohm law: V =", opts:["IR","I/R","R/I","I^2R"], ans:"A", explain:"V=IR. Ohms law: V proportional to I, R constant."},
    {text:"KVL: sum of voltages around closed loop =", opts:["IR","0","V","Infinity"], ans:"B", explain:"KVL: algebraic sum of voltages in closed loop = 0."},
    {text:"KCL: sum of currents at node =", opts:["0","1","Infinity","Depends"], ans:"A", explain:"KCL: algebraic sum of currents entering node = 0."},
    {text:"Thevenin resistance found by:", opts:["Short voltage sources","Open current sources","Turn off sources","Both B and C"], ans:"D", explain:"R_th: V-sources shorted, I-sources opened. Both done."},
    {text:"Series resonance at:", opts:["XL>XC","XL=XC","XL<XC","R=0"], ans:"B", explain:"Series resonance when XL=XC. Impedance minimum=R."},
  ],
  "Electrical Machines": [
    {text:"Transformer emf: E=4.44*f*N*phi_max. 4.44 derives from:", opts:["pi","4*1.11","2*pi","pi/2"], ans:"B", explain:"4.44 approx 4*1.11. Form factor of sine wave."},
    {text:"Induction motor slip s =", opts:["(ns-n)/ns","(n-ns)/ns","ns/n","n/ns"], ans:"A", explain:"Slip s=(n_s-n)/n_s. n_s=sync speed, n=rotor speed."},
    {text:"DC generator: E = phi*Z*N*P/(60*A). P is:", opts:["Power","Poles","Resistance","Pitch"], ans:"B", explain:"E=phi*Z*N*P/(60*A). P=number of poles."},
    {text:"Synchronous motor runs at:", opts:["Less than sync","Exactly sync","More than sync","Variable"], ans:"B", explain:"Sync motor: rotor locked to rotating field. Runs at sync speed."},
    {text:"Transformer max efficiency when:", opts:["Copper=Iron loss","Load=0","Short circuit","Open circuit"], ans:"A", explain:"Max efficiency: variable copper loss = constant iron loss."},
  ],
  "Power Systems": [
    {text:"Load factor = average demand /", opts:["Maximum demand","Minimum","Total energy","Installed capacity"], ans:"A", explain:"Load factor = average/peak demand. Indicates utilization."},
    {text:"Power factor =", opts:["P/S","S/P","Q/S","P/Q"], ans:"A", explain:"PF = P/S. Real power/apparent power. Higher is better."},
    {text:"Transmission line short line ABCD:", opts:["A=1,B=Z,C=0,D=1","A=cosh,B=Zc*sinh","A=0,B=1,C=Y,D=0","A=1,B=0,C=Y,D=1"], ans:"A", explain:"Short line: series impedance only. A=1,B=Z,C=0,D=1."},
    {text:"Per unit system advantage:", opts:["All values same","Base values cancel","No transformers","No phase shift"], ans:"B", explain:"Per unit: base values normalize quantities. Simplifies calculations."},
    {text:"Three phase power P = sqrt(3)*V_L*I_L*cos(phi). V_L is:", opts:["Phase voltage","Line voltage","Average","Max"], ans:"B", explain:"Three-phase: V_L = line voltage, I_L = line current."},
  ],
  "Control Systems": [
    {text:"Closed loop TF = G/(1+GH) for:", opts:["Positive feedback","Negative feedback","Open loop","Unity gain"], ans:"B", explain:"Closed loop = G/(1+GH) for negative feedback."},
    {text:"Type of system with 3 poles at origin:", opts:["Type 0","Type 1","Type 2","Type 3"], ans:"D", explain:"Type = poles at origin. 3 poles = Type 3."},
    {text:"Steady state error Type 1 for unit step:", opts:["0","1","Infinity","1/Kp"], ans:"A", explain:"Type 1: ess_step = 0. Perfect step tracking."},
    {text:"Routh array sign changes in first column =", opts:["0","1","Roots in RHS","2"], ans:"C", explain:"Sign changes in Routh first column = roots in RHS."},
    {text:"Phase margin measured at:", opts:["0 dB","180 deg","-180 deg","0 deg"], ans:"A", explain:"PM = 180 + phase_gc. Measured at gain crossover (0 dB)."},
  ],
  "Power Electronics": [
    {text:"Rectifier converts:", opts:["AC to DC","DC to AC","DC to DC","AC to AC"], ans:"A", explain:"Rectifier: AC to DC. Diodes or thyristors."},
    {text:"Inverter converts:", opts:["AC to DC","DC to AC","DC to DC","AC to AC"], ans:"B", explain:"Inverter: DC to AC. UPS, motor drives."},
    {text:"SCR is a:", opts:["Diode","BJT","4-layer PNPN thyristor","FET"], ans:"C", explain:"SCR: PNPN device. Gate triggered. Latching behavior."},
    {text:"Chopper is for:", opts:["AC-DC","DC-DC conversion","DC-AC","AC-AC"], ans:"B", explain:"Chopper: DC to DC. Step up/down via switching."},
    {text:"PWM varies:", opts:["Frequency only","Duty cycle","Voltage only","Current only"], ans:"B", explain:"PWM: controls output via duty cycle variation."},
  ],
  "Analog Electronics": [
    {text:"Ideal op-amp input resistance:", opts:["0","Infinity","1 Mohm","100 ohm"], ans:"B", explain:"Ideal op-amp: infinite input impedance, zero output impedance."},
    {text:"Inverting amplifier gain:", opts:["-Rf/Rin","Rf/Rin","1+Rf/Rin","-Rin/Rf"], ans:"A", explain:"Av = -Rf/Rin. Negative = 180 deg phase shift."},
    {text:"RC low-pass cutoff:", opts:["1/(2*pi*RC)","1/RC","2*pi*RC","RC"], ans:"A", explain:"fc = 1/(2*pi*RC). At fc: output = input/sqrt(2)."},
    {text:"Negative feedback increases:", opts:["Gain","Bandwidth","Distortion","Noise"], ans:"B", explain:"Negative feedback: reduces gain, increases bandwidth, reduces distortion."},
    {text:"RC coupling blocks:", opts:["AC","DC","Both","Nothing"], ans:"B", explain:"RC coupling: blocks DC, passes AC. Used in amplifiers."},
  ],
  "Digital Electronics": [
    {text:"Binary 1010 in decimal:", opts:["8","10","5","12"], ans:"B", explain:"1010 = 8+2 = 10."},
    {text:"Full adder has:", opts:["2 XOR + 2 AND + 1 OR","1 XOR + 2 AND + 1 OR","3 XOR","1 AND + 1 OR"], ans:"B", explain:"Full adder: Sum=A xor B xor Cin. Carry=AB+BCin+ACin."},
    {text:"One flip-flop stores:", opts:["1 bit","4 bits","8 bits","16 bits"], ans:"A", explain:"1 flip-flop = 1 bit storage."},
    {text:"JK FF with J=K=1 toggles on:", opts:["Rising edge","Falling edge","Both edges","Clock high"], ans:"A", explain:"JK at J=K=1: toggles on active clock edge (usually rising)."},
    {text:"Decade counter counts:", opts:["2 states","8 states","10 states","16 states"], ans:"C", explain:"Decade: 10 states (0-9). Mod-10 counter."},
  ],
  "Algorithms": [
    {text:"Binary search complexity:", opts:["O(n)","O(log n)","O(n^2)","O(1)"], ans:"B", explain:"Binary search sorted array: O(log n)."},
    {text:"Quick sort average:", opts:["O(n)","O(n log n)","O(n^2)","O(log n)"], ans:"B", explain:"Quick sort average O(n log n). Worst O(n^2)."},
    {text:"Dijkstra finds:", opts:["MST","Shortest path (non-negative)","Max flow","Topo sort"], ans:"B", explain:"Dijkstra: single-source shortest path, non-negative weights."},
    {text:"DFS uses:", opts:["Queue","Stack","Priority queue","Both"], ans:"B", explain:"DFS: stack (or recursion). BFS: queue."},
    {text:"DP key properties:", opts:["Greedy","Optimal substructure + overlapping","Random","Brute force"], ans:"B", explain:"DP: optimal substructure + overlapping subproblems."},
  ],
  "Data Structures": [
    {text:"Array random access:", opts:["O(n)","O(log n)","O(1)","O(n^2)"], ans:"C", explain:"Array: direct indexing O(1)."},
    {text:"Linked list insert at head:", opts:["O(n)","O(1)","O(log n)","O(n^2)"], ans:"B", explain:"Insert at head: O(1). Just pointer update."},
    {text:"Binary tree min height:", opts:["n","log2(n+1)","n/2","log2(n)"], ans:"B", explain:"Min height = floor(log2(n)) for complete binary tree."},
    {text:"Hash table avg search:", opts:["O(1)","O(n)","O(log n)","O(n^2)"], ans:"A", explain:"Hash table average O(1). Worst O(n) with collisions."},
    {text:"Stack follows:", opts:["FIFO","LIFO","Random","Sorted"], ans:"B", explain:"Stack: Last In First Out (LIFO)."},
  ],
  "DBMS": [
    {text:"Normalization eliminates:", opts:["Redundancy","Security","Speed","Users"], ans:"A", explain:"Normalization: removes redundancy and update anomalies."},
    {text:"SQL retrieve data:", opts:["INSERT","SELECT","UPDATE","DELETE"], ans:"B", explain:"SELECT retrieves. INSERT adds, UPDATE modifies, DELETE removes."},
    {text:"ACID D stands for:", opts:["Durability","Data","Database","Directory"], ans:"A", explain:"ACID: Atomicity, Consistency, Isolation, Durability."},
    {text:"Primary key must be:", opts:["Null","Unique and Not Null","Duplicate","Optional"], ans:"B", explain:"Primary key: uniquely identifies. Cannot be NULL or duplicate."},
    {text:"COMMIT makes changes:", opts:["Temporary","Permanent","Deleted","Hidden"], ans:"B", explain:"COMMIT: all changes become permanent in database."},
  ],
  "Operating Systems": [
    {text:"FCFS stands for:", opts:["Fastest Completion","First Come First Serve","Fair Cycle","Fixed Cycle"], ans:"B", explain:"FCFS: First Come First Serve. Non-preemptive."},
    {text:"Round Robin uses:", opts:["Queue","Priority","Time quantum","SJF"], ans:"C", explain:"Round Robin: preemptive with fixed time quantum."},
    {text:"Deadlock necessary conditions: mutual exclusion + hold and wait +", opts:["Preemption","Circular wait","Speed","Memory"], ans:"B", explain:"Deadlock: 4 conditions - mutual exclusion, hold&wait, no preemption, circular wait."},
    {text:"Semaphore > 0 means:", opts:["Deadlock","Available resources","Waiting process","Error"], ans:"B", explain:"Semaphore: positive value = available resources."},
    {text:"Page fault occurs when:", opts:["Page in memory","Page not in memory","Page modified","Page locked"], ans:"B", explain:"Page fault: required page not in physical memory."},
  ],
  "Computer Networks": [
    {text:"HTTP default port:", opts:["21","80","443","25"], ans:"B", explain:"HTTP: port 80. HTTPS: 443. FTP: 21."},
    {text:"Class B IP range:", opts:["1-126","128-191","192-223","224-239"], ans:"B", explain:"Class B: 128.0.0.0 to 191.255.255.255. First byte 128-191."},
    {text:"TCP is:", opts:["Connectionless","Connection-oriented","Unreliable","Fast"], ans:"B", explain:"TCP: connection-oriented (3-way handshake). Reliable."},
    {text:"Subnet mask /24:", opts:["255.0.0.0","255.255.0.0","255.255.255.0","255.255.255.255"], ans:"C", explain:"/24: 24 bits network. Mask: 255.255.255.0."},
    {text:"CSMA/CD used in:", opts:["Token Ring","Ethernet","WiFi","Bluetooth"], ans:"B", explain:"CSMA/CD: Ethernet. Carrier Sense Multiple Access with Collision Detect."},
  ],
  "Computer Organization": [
    {text:"CPU consists of:", opts:["ALU only","ALU + CU + Registers","Memory only","I/O"], ans:"B", explain:"CPU: ALU + Control Unit + Registers."},
    {text:"Cache memory is:", opts:["Slower than RAM","Faster than RAM","Same speed","Non-volatile"], ans:"B", explain:"Cache: fastest memory. SRAM-based."},
    {text:"Pipelining increases:", opts:["Latency","Throughput","Memory","Power"], ans:"B", explain:"Pipelining: increases throughput (instructions per cycle)."},
    {text:"Little endian stores:", opts:["MSB first","LSB first","MSB last","Random"], ans:"B", explain:"Little endian: LSB at lowest address."},
    {text:"Instruction cycle:", opts:["Fetch only","Fetch, Decode, Execute","Execute only","Decode only"], ans:"B", explain:"Cycle: Fetch -> Decode -> Execute (+ store/writeback)."},
  ],
  "Mathematics": [
    {text:"Derivative of x^3:", opts:["3x^2","x^2","3x","x^3/3"], ans:"A", explain:"d/dx(x^3) = 3x^2."},
    {text:"Integral of 1/x:", opts:["x","ln|x|","1/x^2","e^x"], ans:"B", explain:"integral(1/x)dx = ln|x| + C."},
    {text:"lim(x->0) sin(x)/x =", opts:["0","1","Infinity","Undefined"], ans:"B", explain:"Standard limit: lim(x->0) sin(x)/x = 1."},
    {text:"Matrix multiplication AB exists when:", opts:["Same rows","Cols(A)=Rows(B)","Same size","Rows(A)=Cols(B)"], ans:"B", explain:"AB: columns of A = rows of B. Result: m x p."},
    {text:"Eigenvalues of identity matrix:", opts:["0","All 1","All 0","Depends"], ans:"B", explain:"I*v = 1*v. All eigenvalues of identity = 1."},
  ],
  "General Aptitude": [
    {text:"If x + 1/x = 3, then x^2 + 1/x^2 =", opts:["7","9","5","11"], ans:"A", explain:"Square: x^2 + 2 + 1/x^2 = 9. So x^2 + 1/x^2 = 7."},
    {text:"Analogy: Book:Reading :: Fork:", opts:["Drawing","Eating","Writing","Singing"], ans:"B", explain:"Book used for reading. Fork used for eating."},
    {text:"Average of 10,20,30,40,50:", opts:["30","25","35","20"], ans:"A", explain:"Sum=150. n=5. Average=150/5=30."},
    {text:"Pipe A fills in 4hr, B in 6hr. Together:", opts:["2.4 hrs","3 hrs","4 hrs","5 hrs"], ans:"A", explain:"1/t=1/4+1/6=5/12. t=12/5=2.4 hours."},
    {text:"Successor of predecessor of 100:", opts:["99","100","101","98"], ans:"B", explain:"Predecessor(100)=99. Successor(99)=100."},
  ],
  "Statistics": [
    {text:"Mean of 2,4,6,8,10:", opts:["6","5","7","4"], ans:"A", explain:"Sum=30, n=5. Mean=30/5=6."},
    {text:"Variance measures:", opts:["Central tendency","Spread/dispersion","Shape","Location"], ans:"B", explain:"Variance: average squared deviation from mean. Measures spread."},
    {text:"Standard deviation is:", opts:["Mean","Sqrt of variance","Variance","Median"], ans:"B", explain:"SD = sqrt(variance). Same units as original data."},
    {text:"Correlation range:", opts:["0 to 1","-1 to 1","-inf to inf","0 to 100"], ans:"B", explain:"Correlation r: -1 (perfect neg) to +1 (perfect pos)."},
    {text:"Normal distribution: mean = median =", opts:["Mode","Mean","SD","0"], ans:"B", explain:"Normal: symmetric. Mean = Median = Mode."},
  ],
  "Probability": [
    {text:"P(A U B) = P(A)+P(B)-P(A n B). n means:", opts:["Union","Intersection","Complement","Empty"], ans:"B", explain:"n = intersection. Addition rule."},
    {text:"E[X] for uniform [a,b]:", opts:["(a+b)/2","(a-b)/2","a*b","(a+b)"], ans:"A", explain:"Uniform: E[X] = (a+b)/2. Midpoint."},
    {text:"Bayes theorem gives:", opts:["Prior","Posterior probability","Likelihood","Evidence"], ans:"B", explain:"Bayes: updates prior to posterior using new evidence."},
    {text:"Variance of Bernoulli(p):", opts:["p","p(1-p)","p^2","1-p"], ans:"B", explain:"Bernoulli: Var(X) = p(1-p). Mean = p."},
    {text:"Poisson: lambda =", opts:["Mean only","Mean = Variance","SD","Median"], ans:"B", explain:"Poisson: lambda = mean = variance."},
  ],
  "Calculus": [
    {text:"integral x^2 dx =", opts:["x^3/3+C","2x+C","x^3+C","x/3+C"], ans:"A", explain:"integral(x^n)dx=x^(n+1)/(n+1). n=2: x^3/3+C."},
    {text:"d/dx[sin(x)] =", opts:["cos(x)","-sin(x)","tan(x)","-cos(x)"], ans:"A", explain:"d/dx[sin(x)] = cos(x). d/dx[cos(x)] = -sin(x)."},
    {text:"lim(x->0) sin(x)/x =", opts:["0","1","Infinity","Undefined"], ans:"B", explain:"Standard limit: lim(x->0) sin(x)/x = 1."},
    {text:"Maxima occurs where:", opts:["f=0","f=0 and f<0","f>0","f=0 and second deriv<0"], ans:"D", explain:"Maxima: critical point f=0 + second derivative negative."},
    {text:"Taylor series e^x at 0:", opts:["1+x+x^2/2+...","x+x^2+...","1+x^2+...","1-x+..."], ans:"A", explain:"e^x = 1 + x + x^2/2! + x^3/3! + ..."},
  ],
  "Linear Algebra": [
    {text:"det([[a,b],[c,d]]) =", opts:["ad-bc","ad+bc","ac-bd","ab-cd"], ans:"A", explain:"2x2 determinant: ad - bc."},
    {text:"Rank of I_n:", opts:["0","1","n","n-1"], ans:"C", explain:"Identity: all n rows independent. Rank = n."},
    {text:"det(A)=0 means A is:", opts:["Orthogonal","Singular","Identity","Invertible"], ans:"B", explain:"det=0 => singular (non-invertible)."},
    {text:"Eigenvalues of diagonal matrix:", opts:["All zero","Diagonal elements","Trace","1"], ans:"B", explain:"Diagonal: eigenvalues = diagonal elements."},
    {text:"Dot product of orthogonal vectors:", opts:["1","0","-1","Infinity"], ans:"B", explain:"Orthogonal: angle=90. cos(90)=0. Dot product=0."},
  ],
  "Algebra": [
    {text:"Order of Z_12 under addition:", opts:["6","12","24","1"], ans:"B", explain:"Z_12={0,1,...,11}. 12 elements. Order=12."},
    {text:"Ring has:", opts:["Addition only","Addition and multiplication","Division only","Multiplication only"], ans:"B", explain:"Ring: two operations (+,*) satisfying ring axioms."},
    {text:"Field has multiplicative inverse for:", opts:["All elements","Non-zero elements","Zero","Identity only"], ans:"B", explain:"Field: every non-zero element has multiplicative inverse."},
    {text:"Order of g in group:", opts:["g^2=e","Smallest n: g^n=e","g^0","g^1"], ans:"B", explain:"Order: smallest positive n where g^n = e (identity)."},
    {text:"S_3 has order:", opts:["3","6","9","12"], ans:"B", explain:"S_n has n! elements. S_3: 3! = 6."},
  ],
  "Analysis": [
    {text:"Continuous function on [a,b] is:", opts:["Unbounded","Bounded and attains bounds","Periodic","Monotonic"], ans:"B", explain:"Extreme Value Theorem: continuous on [a,b] => bounded + attains max/min."},
    {text:"Riemann integrable requires:", opts:["Continuous","Bounded + finite discontinuities","Differentiable","Monotone"], ans:"B", explain:"Riemann: bounded + discontinuities have measure zero."},
    {text:"Harmonic series sum 1/n:", opts:["Converges","Diverges","Converges to 1","Oscillates"], ans:"B", explain:"Harmonic series diverges. Sum(1/n) = infinity."},
    {text:"Cauchy sequence: |a_n - a_m| < epsilon for:", opts:["n>N only","n,m > N","all n,m","n+m>N"], ans:"B", explain:"Cauchy: |a_n-a_m|<epsilon for all n,m>N."},
    {text:"Uniform limit of continuous functions is:", opts:["Discontinuous","Continuous","Differentiable","Bounded"], ans:"B", explain:"Uniform convergence preserves continuity."},
  ],
  "Topology": [
    {text:"Open set in R:", opts:["Contains all limit points","Every point has epsilon-neighborhood in set","Closed","Bounded"], ans:"B", explain:"Open: every point has neighborhood fully inside the set."},
    {text:"Closed set contains all its:", opts:["Interior","Boundary","Limit points","Exterior"], ans:"C", explain:"Closed: contains all limit points (includes boundary)."},
    {text:"Compact in R^n means:", opts:["Open and bounded","Closed and bounded","Closed only","Bounded only"], ans:"B", explain:"Heine-Borel: compact in R^n iff closed and bounded."},
    {text:"Connected set:", opts:["Two disjoint open","Cannot be union of disjoint open sets","Open","Closed"], ans:"B", explain:"Connected: cannot be separated into disjoint non-empty open sets."},
    {text:"Continuous image of compact is:", opts:["Open","Compact","Disconnected","Unbounded"], ans:"B", explain:"Continuous image of compact is compact."},
  ],
  "Complex Analysis": [
    {text:"Cauchy-Riemann equations:", opts:["du/dx=dv/dy","Both u_x=v_y AND u_y=-v_x","du/dx=-dv/dy","Only u_x=v_y"], ans:"B", explain:"CR: u_x=v_y AND u_y=-v_x. Both required for analyticity."},
    {text:"Residue of 1/z at z=0:", opts:["0","1","Infinity","-1"], ans:"B", explain:"Residue of 1/z at 0 = 1. Laurent coeff of 1/z."},
    {text:"Cauchy integral of analytic f on closed curve:", opts:["0","2*pi*i","1","Infinity"], ans:"A", explain:"Cauchy theorem: integral of analytic function on closed contour = 0."},
    {text:"Entire function:", opts:["Continuous","Analytic everywhere","Bounded","Polynomial"], ans:"B", explain:"Entire: analytic on all of C."},
    {text:"Liouville: bounded entire function is:", opts:["Polynomial","Constant","Exponential","Trigonometric"], ans:"B", explain:"Liouville: bounded entire => constant."},
  ],
  "Real Analysis": [
    {text:"Monotone bounded sequence is:", opts:["Divergent","Convergent","Oscillating","Undefined"], ans:"B", explain:"Monotone Convergence: monotone bounded sequence converges."},
    {text:"Series converges iff:", opts:["Terms->0","Partial sums Cauchy","Monotone","Bounded"], ans:"B", explain:"Series converges iff partial sums form Cauchy sequence."},
    {text:"Uniform limit of continuous functions is:", opts:["Discontinuous","Continuous","Differentiable","Bounded"], ans:"B", explain:"Uniform convergence preserves continuity."},
    {text:"Riemann integrable requires:", opts:["Continuous","Bounded + finite discontinuities","Monotone","Differentiable"], ans:"B", explain:"Riemann: bounded + set of discontinuities has measure zero."},
    {text:"Cauchy criterion for sequences:", opts:["|a_n|<epsilon","|a_n-a_m|<epsilon for n,m>N","a_n converges","a_n=0"], ans:"B", explain:"Cauchy: terms get arbitrarily close for n,m>N."},
  ],
  "Physics": [
    {text:"Newton 2nd law: F =", opts:["ma","m/v","mv","m/a"], ans:"A", explain:"F=ma. Force = mass x acceleration."},
    {text:"Kinetic energy =", opts:["mgh","1/2 mv^2","mv","1/2 kx^2"], ans:"B", explain:"KE=1/2*m*v^2. PE_grav=mgh. PE_spring=1/2kx^2."},
    {text:"Coulombs law force:", opts:["Always attractive","Attractive or repulsive","Zero","Constant"], ans:"B", explain:"Like charges repel, opposite attract. Sign of product determines."},
    {text:"Wave speed v =", opts:["f*lambda","f/lambda","lambda/f","1/(f*lambda)"], ans:"A", explain:"v = f * lambda. Wave speed = frequency x wavelength."},
    {text:"Photoelectric effect shows light is:", opts:["Wave only","Particle-like","Sound","Matter"], ans:"B", explain:"Photoelectric: light as photons. E=hf. Particle behavior."},
  ],
  "Optics": [
    {text:"Lens formula 1/f = 1/v + 1/u. u is:", opts:["Positive","Negative (real object)","Zero","Infinity"], ans:"B", explain:"Cartesian: object distance negative for real objects."},
    {text:"Total internal reflection requires:", opts:["n1>n2","n1<n2","n1=n2","Any"], ans:"A", explain:"TIR: n1>n2 + incidence angle > critical angle."},
    {text:"Youngs fringe width:", opts:["lambda*D/d","lambda*d/D","D/lambda","d/lambda"], ans:"A", explain:"Beta = lambda*D/d. Proportional to wavelength."},
    {text:"Refractive index n =", opts:["c/v","v/c","c*v","c+v"], ans:"A", explain:"n=c/v. c=light in vacuum, v=in medium."},
    {text:"Diffraction is:", opts:["Reflection","Bending around obstacle","Refraction","Polarization"], ans:"B", explain:"Diffraction: bending/spreading around obstacle or aperture."},
  ],
  "Electromagnetism": [
    {text:"Electric field point charge: E =", opts:["kq/r","kq/r^2","kq^2/r","k/r^2"], ans:"B", explain:"E=kq/r^2. Coulomb inverse square law."},
    {text:"Gauss law: flux =", opts:["q/epsilon_0","0","q","epsilon_0*q"], ans:"A", explain:"Gauss: flux = Q_enclosed/epsilon_0."},
    {text:"B around long wire:", opts:["mu_0*I/(2*pi*r)","mu_0*I/(4*pi*r)","mu_0*I/r","I/(2*pi*r)"], ans:"A", explain:"Amperes: B=mu_0*I/(2*pi*r)."},
    {text:"EM wave speed in vacuum:", opts:["3x10^8 m/s","3x10^6 m/s","Infinity","0"], ans:"A", explain:"c=3x10^8 m/s. Speed of light."},
    {text:"Faradays law: emf =", opts:["-d(phi)/dt","d(phi)/dt","phi","phi/t"], ans:"A", explain:"Faraday: emf=-d(phi)/dt. Negative sign = Lenz law."},
  ],
  "Quantum Mechanics": [
    {text:"De Broglie: lambda = h/p. h is:", opts:["Plancks constant","Reduced Planck","Boltzmann","Gas"], ans:"A", explain:"De Broglie: lambda=h/p. h=6.626e-34 Js."},
    {text:"Heisenberg: dx*dp >=", opts:["h","h-bar/2","h/(4*pi)","h/2"], ans:"C", explain:"dx*dp >= hbar/2 = h/(4*pi)." },
    {text:"Particle in 1D box (n=1) energy:", opts:["0","h^2/(8mL^2)","h^2/(2mL^2)","h/mL"], ans:"B", explain:"Particle in box E1 = h^2/(8mL^2). Ground state non-zero."},
    {text:"Normalization means:", opts:["Wavefunction real","Integral |psi|^2 = 1","psi=0 at boundary","E>0"], ans:"B", explain:"Normalization: integral |psi|^2 dx = 1. Total probability = 1."},
    {text:"Schrodinger equation is:", opts:["Classical","Wave equation for QM","Relativistic","Thermodynamic"], ans:"B", explain:"Schrodinger: fundamental equation of quantum mechanics."},
  ],
  "Communication": [
    {text:"AM modulation index must be:", opts:["> 1","<= 1","= 0",">= 2"], ans:"B", explain:"AM index <= 1. >1 causes over-modulation."},
    {text:"Nyquist rate for bandwidth B:", opts:["B","2B","B/2","4B"], ans:"B", explain:"Nyquist: sampling rate >= 2*B."},
    {text:"Shannon capacity C =", opts:["B*log2(1+SNR)","B*SNR","log2(B*SNR)","B/SNR"], ans:"A", explain:"Shannon-Hartley: C = B*log2(1+S/N)."},
    {text:"FM bandwidth (Carson):", opts:["2*(df+fm)","df+fm","2*df","2*fm"], ans:"A", explain:"Carson: BW = 2*(delta_f + f_m)."},
    {text:"ASK, FSK, PSK are:", opts:["Analog modulation","Digital modulation","Encoding","Multiplexing"], ans:"B", explain:"ASK/FSK/PSK: digital modulation for binary data."},
  ],
  "EMFT": [
    {text:"Wave speed in medium:", opts:["c","c/sqrt(epsilon_r)","c*sqrt(epsilon_r)","1/c"], ans:"B", explain:"v=c/sqrt(epsilon_r). Slower in dielectric."},
    {text:"Intrinsic impedance of free space:", opts:["120*pi ohm","377 ohm","50 ohm","75 ohm"], ans:"B", explain:"eta_0 = 377 ohm (approx 120*pi ohm)."},
    {text:"Skin depth delta =", opts:["1/alpha","1/beta","1/gamma","sqrt(2/(omega*mu*sigma))"], ans:"D", explain:"Skin depth = 1/alpha = sqrt(2/(omega*mu*sigma))."},
    {text:"Poynting vector represents:", opts:["E-field","B-field","Power flow","Energy stored"], ans:"C", explain:"Poynting S = E x H. Power flow direction and magnitude."},
    {text:"Z0 of lossless line:", opts:["sqrt(L/C)","L/C","sqrt(LC)","R+jwL"], ans:"A", explain:"Z0 = sqrt(L/C) for lossless transmission line."},
  ],
  "Microprocessor": [
    {text:"8085 has how many pins:", opts:["28","40","16","64"], ans:"B", explain:"8085: 40-pin DIP. 8-bit microprocessor."},
    {text:"Stack operates in:", opts:["FIFO","LIFO","Random","Sorted"], ans:"B", explain:"Stack: LIFO (Last In First Out). PUSH/POP."},
    {text:"Program counter holds:", opts:["Data","Next instruction address","Result","Operand"], ans:"B", explain:"PC: address of next instruction to fetch."},
    {text:"INTA signal is for:", opts:["Interrupt Acknowledge","Memory read","I/O write","Reset"], ans:"A", explain:"INTA: Interrupt Acknowledge from processor."},
    {text:"HLD/HLDA are for:", opts:["Interrupt","DMA","Reset","I/O"], ans:"B", explain:"HLD/HLDA: Hold/Hold Acknowledge for DMA."},
  ],
  "Genetics": [
    {text:"Mendels law of segregation:", opts:["One gene","Alleles of one gene separate","Two genes","Many genes"], ans:"B", explain:"Segregation: two alleles separate during gamete formation."},
    {text:"DNA double helix by:", opts:["Mendel","Watson and Crick","Darwin","Morgan"], ans:"B", explain:"Watson and Crick: double helix DNA structure."},
    {text:"Linked genes:", opts:["Assort independently","Do not assort independently","Different chromosomes","No recombination"], ans:"B", explain:"Linked: same chromosome. Do not follow independent assortment."},
    {text:"Mutations are:", opts:["Always harmful","Source of variation","Always beneficial","Rare only"], ans:"B", explain:"Mutations: source of variation. Can be harmful, neutral, or beneficial."},
    {text:"S_3 has order:", opts:["3","6","9","12"], ans:"B", explain:"S_3: 3! = 6. Symmetric group on 3 elements."},
  ],
  "Molecular Biology": [
    {text:"DNA replication is:", opts:["Conservative","Semiconservative","Disruptive","Linear"], ans:"B", explain:"Semiconservative: each new DNA has one old + one new strand."},
    {text:"Transcription produces:", opts:["DNA","RNA","Protein","Lipid"], ans:"B", explain:"Transcription: DNA -> RNA (mRNA, tRNA, rRNA)."},
    {text:"Translation occurs at:", opts:["Nucleus","Ribosome","Mitochondria","ER"], ans:"B", explain:"Translation: mRNA -> protein at ribosome."},
    {text:"Genetic code is:", opts:["Ambiguous","Universal and degenerate","Unique per species","Non-overlapping"], ans:"B", explain:"Nearly universal. 64 codons for 20 amino acids (degenerate)."},
    {text:"mRNA carries info from:", opts:["Ribosome to DNA","DNA to ribosome","Protein to DNA","DNA to protein"], ans:"B", explain:"mRNA: messenger from DNA (nucleus) to ribosome (cytoplasm)."},
  ],
  "Biochemistry": [
    {text:"ATP full form:", opts:["Adenine Triphosphate","Adenosine Triphosphate","Adenosine Tetraphosphate","Adenine Tri Phosphate"], ans:"B", explain:"ATP = Adenosine Triphosphate. Main energy currency."},
    {text:"Enzymes are mostly:", opts:["Carbohydrates","Proteins","Lipids","Nucleic acids"], ans:"B", explain:"Enzymes: mostly proteins. Some RNA (ribozymes) also catalytic."},
    {text:"Active site is where:", opts:["Inhibition","Substrate binds","Product released","Cofactor made"], ans:"B", explain:"Active site: substrate binding region. Lock-key/induced fit."},
    {text:"Glycolysis occurs in:", opts:["Nucleus","Cytoplasm","Mitochondria","ER"], ans:"B", explain:"Glycolysis: cytoplasm. Glucose -> 2 pyruvate + 2 ATP."},
    {text:"Km indicates:", opts:["Vmax","Enzyme affinity","Enzyme concentration","Reaction rate"], ans:"B", explain:"Km: substrate concentration at half Vmax. Low Km = high affinity."},
  ],
  "Ecology": [
    {text:"Population density =", opts:["N/A","N/S","S/N","N*S"], ans:"B", explain:"Density = N/S. N=number, S=area/volume."},
    {text:"r-selected species produce:", opts:["Few offspring","Many small offspring","Large offspring","None"], ans:"B", explain:"r-strategists: many small offspring in unstable environments."},
    {text:"Biomass pyramid in ocean often:", opts:["Upright","Inverted","Flat","Random"], ans:"B", explain:"Ocean: phytoplankton reproduce fast, zooplankton accumulate. Inverted."},
    {text:"Carrying capacity is:", opts:["r","K","N","dN/dt"], ans:"B", explain:"K = carrying capacity. Max population environment can sustain."},
    {text:"10% energy transfer between trophic levels:", opts:["Lindemans law","Tens rule","Both","Neither"], ans:"C", explain:"10% rule (Lindeman): ~10% energy transfers between levels."},
  ],
  "Material Science": [
    {text:"Ferrite is:", opts:["Iron ceramic","Pure iron","Steel","Aluminum"], ans:"A", explain:"Ferrite: iron oxide based ceramic magnetic material."},
    {text:"Annealing does:", opts:["Harden","Softens/relieves stress","Polish","Color"], ans:"B", explain:"Annealing: heat treatment to soften, relieve stress, improve ductility."},
    {text:"Crystal structure of iron at room temp:", opts:["FCC","BCC (alpha)","HCP","Simple cubic"], ans:"B", explain:"Alpha iron: BCC. Gamma iron (high temp): FCC."},
    {text:"Brass is:", opts:["Cu+Zn","Cu+Sn","Fe+C","Al+Cu"], ans:"A", explain:"Brass: Cu+Zn. Bronze: Cu+Sn."},
    {text:"Vickers hardness test uses:", opts:["Brinell ball","Diamond pyramid","Rockwell cone","Knoop diamond"], ans:"B", explain:"Vickers: diamond pyramid indenter."},
  ],
  "Geology": [
    {text:"Mohs hardest mineral:", opts:["Corundum","Diamond","Quartz","Topaz"], ans:"B", explain:"Diamond: hardest (10). Talc: softest (1)."},
    {text:"Igneous rock from:", opts:["Sedimentation","Cooled magma/lava","Pressure","Heat only"], ans:"B", explain:"Igneous: solidified from magma/lava."},
    {text:"Moho discontinuity separates:", opts:["Crust-mantle","Mantle-core","Core layers","Crust layers"], ans:"A", explain:"Moho: crust-mantle boundary."},
    {text:"Plate tectonics driven by:", opts:["Solar","Mantle convection","Moon","Wind"], ans:"B", explain:"Mantle convection drives plate movement."},
    {text:"Most abundant crust mineral:", opts:["Quartz","Feldspar","Mica","Olivine"], ans:"B", explain:"Feldspar: ~60% of crust. Most abundant mineral group."},
  ],
  "Geotechnical": [
    {text:"Bearing capacity depends on:", opts:["Color","Soil props + foundation","Weather","Time"], ans:"B", explain:"Bearing capacity: soil strength + foundation dimensions + depth."},
    {text:"Atterberg limits:", opts:["Shrinkage, Plastic, Liquid","Only Liquid","Only Shrinkage","None"], ans:"A", explain:"Atterberg: SL, PL, LL. Clay consistency limits."},
    {text:"Active earth pressure Rankine:", opts:["Ka=1-sin(phi)","Ka=sin(phi)","Ka=tan^2(45-phi/2)","Kp=tan^2(45+phi/2)"], ans:"C", explain:"Ka = tan^2(45 - phi/2). Active pressure coeff."},
    {text:"Permeability measured by:", opts:["Direct shear","Constant/falling head","Triaxial","Unconfined"], ans:"B", explain:"Permeability: constant head (coarse) or falling head (fine) test."},
    {text:"Consolidation is:", opts:["Immediate","Time-dependent settlement","Elastic","Elasto-plastic"], ans:"B", explain:"Consolidation: gradual water expulsion. Time-dependent."},
  ],
  "Surveying": [
    {text:"Chain survey for:", opts:["Hilly","Small flat areas","Large","Forests"], ans:"B", explain:"Chain surveying: small, open, flat areas. Simple."},
    {text:"Benchmark is:", opts:["Bench","Fixed reference of known RL","Staff","Temp point"], ans:"B", explain:"BM: fixed reference point with known Reduced Level."},
    {text:"Chain too long causes area:", opts:["Overestimated","Underestimated","No effect","Random"], ans:"A", explain:"Chain too long: measured distance < actual. Area overestimated."},
    {text:"Prismatic compass measures:", opts:["Distance","Bearing","Elevation","Temperature"], ans:"B", explain:"Prismatic compass: magnetic bearing/azimuth."},
    {text:"Leveling finds:", opts:["Horizontal distances","Elevation differences","Areas","Directions"], ans:"B", explain:"Leveling: relative elevations (RL) of points."},
  ],
  "Transportation": [
    {text:"IRC camber for:", opts:["Drainage","Speed","Comfort","Safety"], ans:"A", explain:"Camber: cross slope for rainwater drainage."},
    {text:"PCI range:", opts:["0-10","0-100","1-5","0-1"], ans:"B", explain:"PCI: 0 (failed) to 100 (excellent)."},
    {text:"OBC by:", opts:["Marshall","CBR","RD","FSB"], ans:"A", explain:"Marshall method: determines Optimum Bitumen Content."},
    {text:"Traffic engineering studies:", opts:["Materials","Flow, safety, operations","Soil","Structures"], ans:"B", explain:"Traffic: characteristics, flow, safety, control."},
    {text:"Geometric design considers:", opts:["Only cost","Speed, sight distance","Only material","Weather"], ans:"B", explain:"Geometric: alignment, sight distance, cross-section, intersections."},
  ],
  "Geophysics": [
    {text:"P-waves are:", opts:["Transverse","Longitudinal","Surface","Love"], ans:"B", explain:"P-waves: primary, compressional, longitudinal."},
    {text:"Moho separates:", opts:["Crust-mantle","Mantle-core","Core layers","Crust layers"], ans:"A", explain:"Moho: crust-mantle boundary (Mohorovicic)."},
    {text:"Gravity survey measures:", opts:["Magnetic field","Gravity anomalies","Seismic speed","Electric field"], ans:"B", explain:"Gravity: maps Bouguer anomalies for density variations."},
    {text:"Reflection seismic uses:", opts:["Reflected waves","Refracted","Direct","Surface"], ans:"A", explain:"Reflection: analyzes reflected waves for subsurface."},
    {text:"Magnetic survey detects:", opts:["Gravity","Magnetic anomalies","Seismic","Electrical"], ans:"B", explain:"Magnetic: measures total field. Detects magnetic minerals."},
  ],
  "Chemistry": [
    {text:"pH of neutral water:", opts:["0","7","14","1"], ans:"B", explain:"pH=-log[H+]. Neutral: [H+]=10^-7. pH=7."},
    {text:"Balance: H2+O2->H2O. Coeff of H2O:", opts:["1","2","3","4"], ans:"B", explain:"Balanced: 2H2+O2->2H2O. Coeff of H2O=2."},
    {text:"Covalent bond by:", opts:["Transfer","Sharing","Attraction","Ions"], ans:"B", explain:"Covalent: sharing electrons. Ionic: transfer."},
    {text:"Ideal gas: PV =", opts:["nRT","nT/R","RT/n","n/R"], ans:"A", explain:"Ideal gas: PV=nRT. R=8.314 J/(mol*K)."},
    {text:"Oxidation is:", opts:["Gain e-","Loss of e-","Gain H","Loss of O"], ans:"B", explain:"OIL: Oxidation Is Loss of electrons."},
  ],
  "Organic Chemistry": [
    {text:"Alcohol functional group:", opts:["-COOH","-OH","-CHO","-NH2"], ans:"B", explain:"Alcohol: -OH. Carboxylic: -COOH."},
    {text:"Benzene formula:", opts:["C6H6","C6H12","C2H6","CH4"], ans:"A", explain:"Benzene: C6H6. Aromatic ring."},
    {text:"SN1 reaction:", opts:["Bimolecular","Unimolecular","Termolecular","No mechanism"], ans:"B", explain:"SN1: unimolecular nucleophilic substitution. Two-step."},
    {text:"Aldehyde group:", opts:["-OH","-CHO","-COOH","-NH2"], ans:"B", explain:"Aldehyde: -CHO at end of carbon chain."},
    {text:"Alkane formula:", opts:["CnH2n","CnH2n+2","CnH2n-2","CnHn"], ans:"B", explain:"Alkane: CnH2n+2. Saturated hydrocarbon."},
  ],
  "Inorganic Chemistry": [
    {text:"Coordination number octahedral:", opts:["4","6","2","8"], ans:"B", explain:"Octahedral: 6 ligands. CN = 6."},
    {text:"Crystal field splitting param:", opts:["alpha","Delta_o (10Dq)","beta","gamma"], ans:"B", explain:"Delta_o: octahedral splitting. Delta_t approx 4/9 Delta_o."},
    {text:"d-block are:", opts:["Noble gases","Transition metals","Alkali","Halogens"], ans:"B", explain:"d-block: transition metals. Incomplete d subshell."},
    {text:"Strongest field ligand:", opts:["I-","CN-","F-","H2O"], ans:"B", explain:"Spectrochemical: CN- strongest. I- weakest."},
    {text:"Werner theory explains:", opts:["Bonding","CN + geometry","Color","Magnetism"], ans:"B", explain:"Werner: primary/secondary valency. Coordination chemistry."},
  ],
  "Physical Chemistry": [
    {text:"First law cyclic process: dU =", opts:["Q","0","W","Q+W"], ans:"B", explain:"Cyclic: system returns to initial. dU=0. Q=W."},
    {text:"First order rate law: rate =", opts:["k[A]","k[A]^2","k[A]^0","k"], ans:"A", explain:"First order: rate = k[A]. ln[A]=ln[A0]-kt."},
    {text:"Activation energy from Arrhenius:", opts:["Increases T","Slope ln(k) vs 1/T","ln(k)","1/T"], ans:"B", explain:"Arrhenius: slope of ln(k) vs 1/T = -Ea/R."},
    {text:"Gibbs at equilibrium:", opts:["G>0","G=0","G<0","G=H"], ans:"B", explain:"Equilibrium: dG=0. Spontaneous: dG<0."},
    {text:"pH+pOH at 25C:", opts:["0","7","14","1"], ans:"C", explain:"At 25C: pH+pOH=14. Kw=10^-14."},
  ],
  "Textile Fibers": [
    {text:"Cotton is:", opts:["Synthetic","Natural cellulosic","Protein","Mineral"], ans:"B", explain:"Cotton: natural cellulosic. Cellulose polymer."},
    {text:"Polyester is:", opts:["Natural","Synthetic polymer","Protein","Regenerated"], ans:"B", explain:"Polyester: synthetic polymer fiber (PET)."},
    {text:"Wool is:", opts:["Cellulosic","Protein (keratin)","Synthetic","Cellulose acetate"], ans:"B", explain:"Wool: natural protein fiber. Keratin-based."},
    {text:"Viscose is:", opts:["Natural","Regenerated cellulosic","Synthetic","Mineral"], ans:"B", explain:"Viscose: regenerated cellulose. Rayon family."},
    {text:"Moisture regain cotton:", opts:["~2%","~8%","~15%","~0.5%"], ans:"B", explain:"Cotton: ~7-8% moisture regain at standard conditions."},
  ],
  "Petroleum Chemistry": [
    {text:"API gravity is:", opts:["Density measure","Viscosity","Sulfur","Pour point"], ans:"A", explain:"API gravity: density measure. Higher API = lighter crude."},
    {text:"Refining first step:", opts:["Cracking","Distillation","Polymers","Blending"], ans:"B", explain:"Refining: fractional distillation first. Separates by boiling range."},
    {text:"Octane number measures:", opts:["Diesel quality","Anti-knock quality","Viscosity","Sulfur"], ans:"B", explain:"Octane: resistance to knocking. Higher = better gasoline."},
    {text:"FCC uses:", opts:["Heat only","Zeolite catalyst","Pressure only","Solvent"], ans:"B", explain:"FCC: zeolite catalyst converts heavy to light fractions."},
    {text:"Natural gas major component:", opts:["Ethane","Methane","Propane","Butane"], ans:"B", explain:"Natural gas: primarily methane (CH4). 70-90%."},
  ],
  "Architecture": [
    {text:"Design basis includes:", opts:["Aesthetics only","Function, structure, climate","Cost only","Material only"], ans:"B", explain:"Design: function, structure, climate, context, aesthetics."},
    {text:"Golden ratio approx:", opts:["1.414","1.618","2.0","3.14"], ans:"B", explain:"phi = (1+sqrt(5))/2 approx 1.618."},
    {text:"RCC =", opts:["Reinforced Cement Concrete","Ready Cement","Rolled Concrete","Rock Cement"], ans:"A", explain:"RCC: Reinforced Cement Concrete. Steel bars in concrete."},
    {text:"Hot-dry climate design:", opts:["Insulation only","Thermal mass + ventilation","Glazing only","Heating"], ans:"B", explain:"Hot-dry: thermal mass + ventilation + shading."},
    {text:"Load bearing vs frame:", opts:["Same","Frame uses columns/beams","Walls carry","None"], ans:"B", explain:"Frame: columns+beams carry load. Walls just partition."},
  ],
  "Agriculture": [
    {text:"Green revolution in India:", opts:["Animal husbandry","Wheat and Rice","Cotton","Fruits"], ans:"B", explain:"Green revolution (1960s): wheat and rice. HYVs."},
    {text:"Photosynthesis products:", opts:["CO2+H2O","Glucose+O2","Glucose only","O2 only"], ans:"B", explain:"Photosynthesis: 6CO2+6H2O -> C6H12O6+6O2."},
    {text:"NPK stands for:", opts:["N,P,K","Na,K","Ni,Pb","Ne,K"], ans:"A", explain:"NPK: Nitrogen, Phosphorus, Potassium. Primary macronutrients."},
    {text:"Irrigation depends on:", opts:["Only rain","Crop, soil, climate","Only soil","Only farmer"], ans:"B", explain:"Irrigation: crop water requirement + soil + climate."},
    {text:"Seed rate depends on:", opts:["Only cost","Crop, seed size, germination","Only field","Only season"], ans:"B", explain:"Seed rate: crop type, seed size, germination %, spacing."},
  ],
  "Zoology": [
    {text:"Chordata characteristic:", opts:["Exoskeleton","Notochord at some stage","No symmetry","Pseudocoelom"], ans:"B", explain:"Chordata: notochord, dorsal nerve cord, pharyngeal slits."},
    {text:"Mammals have:", opts:["Gills","Hair + mammary glands","Feathers","Scales"], ans:"B", explain:"Mammals: hair/fur + mammary glands. Endothermic."},
    {text:"Insect body segments:", opts:["2","3 (head,thorax,abdomen)","4","1"], ans:"B", explain:"Insects: 3 segments. 6 legs. Exoskeleton."},
    {text:"Birds have:", opts:["Cold blood + feathers","Warm blood + feathers","Hair","No lungs"], ans:"B", explain:"Birds: endothermic + feathers + lungs."},
    {text:"Phylum with exoskeleton:", opts:["Chordata","Arthropoda","Mollusca","Annelida"], ans:"B", explain:"Arthropoda: exoskeleton (chitin). Jointed appendages."},
  ],
  "Soil Science": [
    {text:"Soil texture based on:", opts:["Color","Sand/silt/clay proportions","pH only","Organic matter"], ans:"B", explain:"Texture: proportions of sand, silt, clay."},
    {text:"Humus is:", opts:["Mineral","Organic matter in soil","Sand","Clay"], ans:"B", explain:"Humus: decomposed organic matter. Improves soil fertility."},
    {text:"Field capacity is:", opts:["Wilting point","Water after drainage","Saturation","Dry soil"], ans:"B", explain:"Field capacity: water content after free drainage."},
    {text:"Wilting point:", opts:["Field capacity","Permanent wilting percentage","Saturation","Dry weight"], ans:"B", explain:"Wilting point: soil moisture where plants permanently wilt."},
    {text:"Soil pH neutral:", opts:["4","7","10","14"], ans:"B", explain:"pH 7: neutral. <7 acidic, >7 alkaline."},
  ],
  "Extractive Metallurgy": [
    {text:"Ore concentration by:", opts:["Smelting","Gravity separation","Refining","Casting"], ans:"B", explain:"Concentration: gravity separation, flotation, magnetic separation."},
    {text:"Blast furnace produces:", opts:["Steel","Pig iron","Copper","Aluminum"], ans:"B", explain:"Blast furnace: iron ore -> pig iron (high carbon)."},
    {text:"Roasting is:", opts:["Reduction","Oxidation heating","Melting","Refining"], ans:"B", explain:"Roasting: heating ore in air. Oxidation to remove impurities."},
    {text:"Bessemer process for:", opts:["Aluminum","Steel making","Copper","Zinc"], ans:"B", explain:"Bessemer: steel from pig iron. Blowing air to oxidize impurities."},
    {text:"Aluminum extracted by:", opts:["Blast furnace","Hall-Heroult (electrolytic)","Roasting","Reduction"], ans:"B", explain:"Hall-Heroult: electrolytic reduction of Al2O3 in cryolite."},
  ],
};

import { getQuestionsForSubject } from "./gate-questions";

function generateUniqueFallback(
  branch: string,
  count: number,
  rand: () => number
): { q: RawQuestion; subject: string }[] {
  const results: { q: RawQuestion; subject: string }[] = [];
  const subjects = FALLBACK_SUBJECTS[branch] || FALLBACK_SUBJECTS["ME"];
  let attempts = 0;

  while (results.length < count && attempts < count * 50) {
    attempts++;
    const subj = subjects[Math.floor(rand() * subjects.length)];
    const gq = getQuestionsForSubject(branch, subj, 1, rand);
    if (gq.length === 0) continue;

    const item = gq[0];
    const m = item.q.opts && item.q.opts.length >= 4 ? (item.q.text.length > 80 ? 2 : 1) : 1;

    const question: RawQuestion = {
      id: "GATE-" + branch + "-" + results.length,
      question_number: 0,
      question_text: item.q.text,
      subject: item.subject,
      topic: item.subject,
      options: item.q.opts || ["A", "B", "C", "D"],
      answer: item.q.ans,
      question_type: m === 1 ? "1MCQ" : "2MCQ",
      marks: m,
      negative_marks: m === 1 ? 0.33 : 0.66,
      branch: branch,
      year: 2020 + Math.floor(rand() * 6),
      session: rand() < 0.5 ? "1" : "2",
      difficulty: m === 1 ? "easy" : "moderate",
      tags: [item.subject, "gate-level-fallback"],
      explanation: item.q.explain,
      source: "GATE-level practice question",
      source_file: "gate-questions-bank",
    };

    if (results.some(r => r.q.question_text === question.question_text)) continue;
    results.push({ q: question, subject: item.subject });
  }

  return results;
}



// ─── Public API ──────────────────────────────────────────────────────────────

const BRANCHES = ["CS", "EC", "EE", "ME", "CE", "IN", "PI", "CH", "BT", "MT", "XE", "XL", "TF", "PE", "EY", "MA", "AR", "AG", "GG", "PH"];
const PAPERS_PER_BRANCH = 4;

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
    for (let i = 0; i < PAPERS_PER_BRANCH; i++) {
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
