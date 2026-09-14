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

  // Pad if needed
  while (selectedQuestions.length < TOTAL_QUESTIONS) {
    const fallback = allQuestions[Math.floor(rand() * allQuestions.length)];
    const norm = normalizeSubject(fallback.subject, branch);
    selectedQuestions.push({ q: fallback, subject: norm });
  }

  selectedQuestions.length = TOTAL_QUESTIONS;

  // Assign marks: scale to sum to exactly 100
  const rawMarks = selectedQuestions.map((sq) => sq.q.marks || 1);
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
      correctAnswer: sq.q.answer || "",
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
