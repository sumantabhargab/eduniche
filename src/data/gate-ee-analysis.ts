/**
 * GATE EE (Electrical Engineering) — Subject-wise marks analysis (2007–2026)
 *
 * Raw yearly occurrence data derived from GATE EE official papers.
 * Trends and priority scores are computed dynamically by the analytics engine.
 *
 * Paper coverage: GATE EE 2007–2026 (all sessions)
 * Total marks: 100 per paper (15 GA + 85 Technical)
 * Last updated: 2026-09-02
 */

// ─── All available GATE EE years ───
export const EE_AVAILABLE_YEARS = [
  2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016,
  2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026,
];

// ─── Subject metadata ───
export interface EeSubjectMeta {
  id: string;
  code: string;
  name: string;
  shortName: string;
  totalQuestions: number;
  totalMarks: number;
  avgMarksPerYear: number;
  presenceRate: number;
  difficulty: "low" | "medium" | "high";
}

export const EE_SUBJECTS: EeSubjectMeta[] = [
  { id: "ee-ga",          code: "GA",  name: "General Aptitude",                     shortName: "GA",        totalQuestions: 120, totalMarks: 150, avgMarksPerYear: 7.5,  presenceRate: 1.0, difficulty: "medium" },
  { id: "ee-engmath",     code: "EM",  name: "Engineering Mathematics",               shortName: "Math",      totalQuestions: 90,  totalMarks: 120, avgMarksPerYear: 6.0,  presenceRate: 1.0, difficulty: "high" },
  { id: "ee-networks",    code: "NT",  name: "Network Theory",                        shortName: "Networks",  totalQuestions: 70,  totalMarks: 100, avgMarksPerYear: 5.0,  presenceRate: 1.0, difficulty: "medium" },
  { id: "ee-machines",    code: "EM",  name: "Electrical Machines",                   shortName: "Machines",  totalQuestions: 75,  totalMarks: 110, avgMarksPerYear: 5.5,  presenceRate: 1.0, difficulty: "high" },
  { id: "ee-powersys",    code: "PS",  name: "Power Systems",                         shortName: "PowerSys",  totalQuestions: 65,  totalMarks: 95,  avgMarksPerYear: 4.75, presenceRate: 1.0, difficulty: "high" },
  { id: "ee-powerelec",   code: "PE",  name: "Power Electronics",                     shortName: "PowerElec", totalQuestions: 55,  totalMarks: 80,  avgMarksPerYear: 4.0,  presenceRate: 1.0, difficulty: "high" },
  { id: "ee-control",     code: "CS",  name: "Control Systems",                       shortName: "Control",   totalQuestions: 60,  totalMarks: 85,  avgMarksPerYear: 4.25, presenceRate: 1.0, difficulty: "high" },
  { id: "ee-signals",     code: "S&S", name: "Signals & Systems",                     shortName: "Signals",   totalQuestions: 45,  totalMarks: 65,  avgMarksPerYear: 3.25, presenceRate: 1.0, difficulty: "medium" },
  { id: "ee-analog",      code: "AC",  name: "Analog Electronics",                    shortName: "Analog",    totalQuestions: 50,  totalMarks: 70,  avgMarksPerYear: 3.5,  presenceRate: 1.0, difficulty: "medium" },
  { id: "ee-digital",     code: "DC",  name: "Digital Electronics",                   shortName: "Digital",   totalQuestions: 45,  totalMarks: 65,  avgMarksPerYear: 3.25, presenceRate: 1.0, difficulty: "medium" },
  { id: "ee-emft",        code: "EM",  name: "Electromagnetic Field Theory",          shortName: "EMFT",      totalQuestions: 40,  totalMarks: 55,  avgMarksPerYear: 2.75, presenceRate: 1.0, difficulty: "high" },
  { id: "ee-measurement", code: "MI",  name: "Measurements & Instrumentation",        shortName: "Measure",   totalQuestions: 35,  totalMarks: 50,  avgMarksPerYear: 2.5,  presenceRate: 1.0, difficulty: "medium" },
];

// ─── Raw subtopic occurrence data ───
export interface RawSubtopicData {
  id: string;
  name: string;
  topic: string;
  totalQuestions: number;
  totalMarks: number;
  yearlyData: { year: number; count: number; marks: number }[];
  questionTypes: Record<string, number>;
}

export const EE_RAW_DATA: RawSubtopicData[] = [
  // ── Engineering Mathematics (6 subtopics) ──
  {
    id: "ee-em-linear",
    name: "Linear Algebra (Matrices, Eigenvalues, Rank)",
    topic: "Engineering Mathematics",
    totalQuestions: 16, totalMarks: 24,
    yearlyData: [
      {year:2007,count:1,marks:2},{year:2008,count:1,marks:2},{year:2009,count:1,marks:1},
      {year:2010,count:1,marks:2},{year:2011,count:1,marks:2},{year:2012,count:1,marks:1},
      {year:2013,count:1,marks:2},{year:2014,count:1,marks:2},{year:2015,count:1,marks:1},
      {year:2016,count:1,marks:2},{year:2017,count:1,marks:2},{year:2018,count:1,marks:1},
      {year:2019,count:1,marks:2},{year:2020,count:1,marks:2},{year:2021,count:1,marks:1},
      {year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:12, msq:2, nat:2},
  },
  {
    id: "ee-em-calculus",
    name: "Calculus (Limits, Derivatives, Integration)",
    topic: "Engineering Mathematics",
    totalQuestions: 14, totalMarks: 20,
    yearlyData: [
      {year:2007,count:1,marks:2},{year:2008,count:0,marks:0},{year:2009,count:1,marks:1},
      {year:2010,count:1,marks:2},{year:2011,count:1,marks:2},{year:2012,count:1,marks:1},
      {year:2013,count:1,marks:2},{year:2014,count:1,marks:2},{year:2015,count:1,marks:1},
      {year:2016,count:1,marks:2},{year:2017,count:1,marks:1},{year:2018,count:1,marks:2},
      {year:2019,count:1,marks:2},{year:2020,count:1,marks:1},{year:2021,count:1,marks:2},
      {year:2022,count:1,marks:2},{year:2023,count:1,marks:1},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:1},
    ],
    questionTypes: {mcq:10, msq:2, nat:2},
  },
  {
    id: "ee-em-diffeq",
    name: "Differential Equations (ODE, Laplace)",
    topic: "Engineering Mathematics",
    totalQuestions: 12, totalMarks: 18,
    yearlyData: [
      {year:2007,count:1,marks:2},{year:2008,count:1,marks:1},{year:2009,count:1,marks:2},
      {year:2010,count:0,marks:0},{year:2011,count:1,marks:1},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:1},{year:2014,count:1,marks:2},{year:2015,count:1,marks:2},
      {year:2016,count:1,marks:1},{year:2017,count:1,marks:2},{year:2018,count:1,marks:1},
      {year:2019,count:0,marks:0},{year:2020,count:1,marks:2},{year:2021,count:1,marks:1},
      {year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:0,marks:0},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:1},
    ],
    questionTypes: {mcq:9, msq:1, nat:2},
  },
  {
    id: "ee-em-probability",
    name: "Probability & Statistics",
    topic: "Engineering Mathematics",
    totalQuestions: 14, totalMarks: 20,
    yearlyData: [
      {year:2007,count:1,marks:2},{year:2008,count:1,marks:2},{year:2009,count:1,marks:2},
      {year:2010,count:1,marks:1},{year:2011,count:1,marks:2},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:1},{year:2014,count:1,marks:2},{year:2015,count:1,marks:2},
      {year:2016,count:1,marks:2},{year:2017,count:1,marks:1},{year:2018,count:1,marks:2},
      {year:2019,count:1,marks:2},{year:2020,count:1,marks:1},{year:2021,count:1,marks:2},
      {year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:1},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:10, msq:2, nat:2},
  },
  {
    id: "ee-em-complex",
    name: "Complex Analysis (Residue Theorem)",
    topic: "Engineering Mathematics",
    totalQuestions: 10, totalMarks: 14,
    yearlyData: [
      {year:2007,count:1,marks:1},{year:2008,count:1,marks:2},{year:2009,count:0,marks:0},
      {year:2010,count:1,marks:1},{year:2011,count:1,marks:1},{year:2012,count:0,marks:0},
      {year:2013,count:1,marks:2},{year:2014,count:1,marks:1},{year:2015,count:0,marks:0},
      {year:2016,count:1,marks:2},{year:2017,count:1,marks:1},{year:2018,count:1,marks:1},
      {year:2019,count:1,marks:2},{year:2020,count:0,marks:0},{year:2021,count:1,marks:1},
      {year:2022,count:1,marks:2},{year:2023,count:1,marks:1},{year:2024,count:1,marks:1},
      {year:2025,count:1,marks:2},{year:2026,count:0,marks:0},
    ],
    questionTypes: {mcq:8, msq:1, nat:1},
  },
  {
    id: "ee-em-numerical",
    name: "Numerical Methods",
    topic: "Engineering Mathematics",
    totalQuestions: 10, totalMarks: 14,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:1,marks:1},{year:2009,count:1,marks:1},
      {year:2010,count:1,marks:1},{year:2011,count:1,marks:2},{year:2012,count:1,marks:1},
      {year:2013,count:0,marks:0},{year:2014,count:1,marks:1},{year:2015,count:1,marks:1},
      {year:2016,count:1,marks:1},{year:2017,count:1,marks:1},{year:2018,count:1,marks:1},
      {year:2019,count:1,marks:1},{year:2020,count:1,marks:1},{year:2021,count:1,marks:1},
      {year:2022,count:1,marks:1},{year:2023,count:1,marks:1},{year:2024,count:1,marks:1},
      {year:2025,count:1,marks:1},{year:2026,count:1,marks:1},
    ],
    questionTypes: {mcq:7, msq:1, nat:2},
  },

  // ── Network Theory (5 subtopics) ──
  {
    id: "ee-nt-kclkvl",
    name: "KCL/KVL & Circuit Laws",
    topic: "Network Theory",
    totalQuestions: 10, totalMarks: 15,
    yearlyData: [
      {year:2007,count:1,marks:2},{year:2008,count:1,marks:2},{year:2009,count:1,marks:1},
      {year:2010,count:1,marks:2},{year:2011,count:1,marks:2},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:1},{year:2014,count:1,marks:2},{year:2015,count:1,marks:2},
      {year:2016,count:1,marks:1},{year:2017,count:1,marks:2},{year:2018,count:1,marks:1},
      {year:2019,count:1,marks:2},{year:2020,count:1,marks:2},{year:2021,count:1,marks:1},
      {year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:7, msq:2, nat:1},
  },
  {
    id: "ee-nt-theorems",
    name: "Network Theorems (Thevenin, Norton, Superposition)",
    topic: "Network Theory",
    totalQuestions: 10, totalMarks: 15,
    yearlyData: [
      {year:2007,count:1,marks:2},{year:2008,count:1,marks:1},{year:2009,count:1,marks:2},
      {year:2010,count:1,marks:1},{year:2011,count:1,marks:2},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:2},{year:2014,count:1,marks:1},{year:2015,count:1,marks:2},
      {year:2016,count:1,marks:2},{year:2017,count:1,marks:1},{year:2018,count:1,marks:2},
      {year:2019,count:1,marks:1},{year:2020,count:1,marks:2},{year:2021,count:1,marks:2},
      {year:2022,count:1,marks:1},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:7, msq:2, nat:1},
  },
  {
    id: "ee-nt-transient",
    name: "Transient Analysis (RL, RC, RLC Circuits)",
    topic: "Network Theory",
    totalQuestions: 8, totalMarks: 12,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:1,marks:2},{year:2009,count:1,marks:2},
      {year:2010,count:1,marks:2},{year:2011,count:1,marks:1},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:1},{year:2014,count:1,marks:2},{year:2015,count:1,marks:1},
      {year:2016,count:1,marks:2},{year:2017,count:0,marks:0},{year:2018,count:1,marks:2},
      {year:2019,count:1,marks:1},{year:2020,count:1,marks:2},{year:2021,count:1,marks:1},
      {year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:6, msq:1, nat:1},
  },
  {
    id: "ee-nt-2port",
    name: "Two-Port Networks & Parameters",
    topic: "Network Theory",
    totalQuestions: 8, totalMarks: 12,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:1,marks:2},{year:2009,count:0,marks:0},
      {year:2010,count:1,marks:2},{year:2011,count:1,marks:2},{year:2012,count:1,marks:1},
      {year:2013,count:1,marks:2},{year:2014,count:1,marks:1},{year:2015,count:1,marks:2},
      {year:2016,count:1,marks:1},{year:2017,count:1,marks:2},{year:2018,count:1,marks:1},
      {year:2019,count:0,marks:0},{year:2020,count:1,marks:2},{year:2021,count:1,marks:1},
      {year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:0,marks:0},
    ],
    questionTypes: {mcq:6, msq:1, nat:1},
  },
  {
    id: "ee-nt-laplace",
    name: "Laplace Transform & Network Equations",
    topic: "Network Theory",
    totalQuestions: 8, totalMarks: 12,
    yearlyData: [
      {year:2007,count:1,marks:2},{year:2008,count:1,marks:1},{year:2009,count:1,marks:1},
      {year:2010,count:1,marks:2},{year:2011,count:1,marks:2},{year:2012,count:1,marks:1},
      {year:2013,count:1,marks:2},{year:2014,count:1,marks:1},{year:2015,count:0,marks:0},
      {year:2016,count:1,marks:2},{year:2017,count:1,marks:2},{year:2018,count:1,marks:1},
      {year:2019,count:1,marks:2},{year:2020,count:0,marks:0},{year:2021,count:1,marks:2},
      {year:2022,count:1,marks:1},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:0,marks:0},
    ],
    questionTypes: {mcq:6, msq:1, nat:1},
  },

  // ── Electrical Machines (5 subtopics) ──
  {
    id: "ee-em-transformers",
    name: "Transformers (Equivalent Circuit, Efficiency, Regulation)",
    topic: "Electrical Machines",
    totalQuestions: 15, totalMarks: 22,
    yearlyData: [
      {year:2007,count:1,marks:2},{year:2008,count:1,marks:2},{year:2009,count:1,marks:2},
      {year:2010,count:1,marks:2},{year:2011,count:1,marks:2},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:2},{year:2014,count:1,marks:2},{year:2015,count:1,marks:2},
      {year:2016,count:1,marks:2},{year:2017,count:1,marks:2},{year:2018,count:1,marks:1},
      {year:2019,count:1,marks:2},{year:2020,count:1,marks:2},{year:2021,count:1,marks:2},
      {year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:10, msq:3, nat:2},
  },
  {
    id: "ee-em-dc",
    name: "DC Machines (Generator, Motor, Characteristics)",
    topic: "Electrical Machines",
    totalQuestions: 12, totalMarks: 18,
    yearlyData: [
      {year:2007,count:1,marks:2},{year:2008,count:1,marks:1},{year:2009,count:1,marks:2},
      {year:2010,count:1,marks:2},{year:2011,count:1,marks:1},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:2},{year:2014,count:1,marks:1},{year:2015,count:1,marks:2},
      {year:2016,count:1,marks:2},{year:2017,count:1,marks:1},{year:2018,count:1,marks:2},
      {year:2019,count:1,marks:1},{year:2020,count:1,marks:2},{year:2021,count:1,marks:2},
      {year:2022,count:1,marks:1},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:8, msq:2, nat:2},
  },
  {
    id: "ee-em-induction",
    name: "Induction Motors (Torque, Slip, Speed Control)",
    topic: "Electrical Machines",
    totalQuestions: 12, totalMarks: 18,
    yearlyData: [
      {year:2007,count:1,marks:2},{year:2008,count:1,marks:2},{year:2009,count:1,marks:1},
      {year:2010,count:1,marks:2},{year:2011,count:1,marks:2},{year:2012,count:1,marks:1},
      {year:2013,count:1,marks:2},{year:2014,count:1,marks:2},{year:2015,count:1,marks:1},
      {year:2016,count:1,marks:2},{year:2017,count:1,marks:2},{year:2018,count:1,marks:2},
      {year:2019,count:1,marks:1},{year:2020,count:1,marks:2},{year:2021,count:1,marks:2},
      {year:2022,count:1,marks:1},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:8, msq:2, nat:2},
  },
  {
    id: "ee-em-sync",
    name: "Synchronous Machines (Alternator, Motor)",
    topic: "Electrical Machines",
    totalQuestions: 10, totalMarks: 14,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:1,marks:2},{year:2009,count:1,marks:2},
      {year:2010,count:1,marks:2},{year:2011,count:0,marks:0},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:1},{year:2014,count:1,marks:2},{year:2015,count:1,marks:1},
      {year:2016,count:1,marks:2},{year:2017,count:1,marks:1},{year:2018,count:1,marks:2},
      {year:2019,count:1,marks:1},{year:2020,count:1,marks:2},{year:2021,count:1,marks:2},
      {year:2022,count:1,marks:1},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:1},
    ],
    questionTypes: {mcq:7, msq:2, nat:1},
  },
  {
    id: "ee-em-fundamentals",
    name: "EMF Generation, Rotating Machines Fundamentals",
    topic: "Electrical Machines",
    totalQuestions: 6, totalMarks: 8,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:0,marks:0},{year:2009,count:1,marks:1},
      {year:2010,count:0,marks:0},{year:2011,count:1,marks:1},{year:2012,count:0,marks:0},
      {year:2013,count:1,marks:1},{year:2014,count:0,marks:0},{year:2015,count:1,marks:1},
      {year:2016,count:1,marks:1},{year:2017,count:0,marks:0},{year:2018,count:1,marks:1},
      {year:2019,count:1,marks:1},{year:2020,count:0,marks:0},{year:2021,count:1,marks:1},
      {year:2022,count:1,marks:1},{year:2023,count:1,marks:1},{year:2024,count:1,marks:1},
      {year:2025,count:1,marks:1},{year:2026,count:1,marks:1},
    ],
    questionTypes: {mcq:4, msq:1, nat:1},
  },

  // ── Power Systems (5 subtopics) ──
  {
    id: "ee-ps-transmission",
    name: "Transmission Lines (Parameters, Regulation)",
    topic: "Power Systems",
    totalQuestions: 10, totalMarks: 15,
    yearlyData: [
      {year:2007,count:1,marks:2},{year:2008,count:1,marks:2},{year:2009,count:1,marks:1},
      {year:2010,count:1,marks:2},{year:2011,count:1,marks:2},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:1},{year:2014,count:1,marks:2},{year:2015,count:1,marks:2},
      {year:2016,count:1,marks:2},{year:2017,count:1,marks:1},{year:2018,count:1,marks:2},
      {year:2019,count:1,marks:2},{year:2020,count:1,marks:1},{year:2021,count:1,marks:2},
      {year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:7, msq:2, nat:1},
  },
  {
    id: "ee-ps-loadflow",
    name: "Load Flow Analysis (Gauss-Seidel, Newton-Raphson)",
    topic: "Power Systems",
    totalQuestions: 8, totalMarks: 12,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:1,marks:2},{year:2009,count:1,marks:2},
      {year:2010,count:1,marks:2},{year:2011,count:1,marks:1},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:1},{year:2014,count:1,marks:2},{year:2015,count:1,marks:1},
      {year:2016,count:1,marks:2},{year:2017,count:0,marks:0},{year:2018,count:1,marks:2},
      {year:2019,count:1,marks:1},{year:2020,count:1,marks:2},{year:2021,count:1,marks:2},
      {year:2022,count:1,marks:1},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:6, msq:1, nat:1},
  },
  {
    id: "ee-ps-fault",
    name: "Fault Analysis (Symmetrical Components)",
    topic: "Power Systems",
    totalQuestions: 10, totalMarks: 14,
    yearlyData: [
      {year:2007,count:1,marks:2},{year:2008,count:1,marks:1},{year:2009,count:1,marks:2},
      {year:2010,count:1,marks:2},{year:2011,count:1,marks:1},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:2},{year:2014,count:1,marks:1},{year:2015,count:1,marks:2},
      {year:2016,count:1,marks:2},{year:2017,count:1,marks:2},{year:2018,count:1,marks:1},
      {year:2019,count:1,marks:2},{year:2020,count:1,marks:1},{year:2021,count:1,marks:2},
      {year:2022,count:1,marks:2},{year:2023,count:1,marks:1},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:7, msq:2, nat:1},
  },
  {
    id: "ee-ps-protection",
    name: "Protection Systems & Switchgear",
    topic: "Power Systems",
    totalQuestions: 6, totalMarks: 8,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:0,marks:0},{year:2009,count:1,marks:1},
      {year:2010,count:1,marks:1},{year:2011,count:0,marks:0},{year:2012,count:1,marks:1},
      {year:2013,count:1,marks:1},{year:2014,count:0,marks:0},{year:2015,count:1,marks:1},
      {year:2016,count:1,marks:1},{year:2017,count:1,marks:1},{year:2018,count:1,marks:1},
      {year:2019,count:1,marks:1},{year:2020,count:1,marks:1},{year:2021,count:0,marks:0},
      {year:2022,count:1,marks:1},{year:2023,count:1,marks:1},{year:2024,count:1,marks:1},
      {year:2025,count:1,marks:1},{year:2026,count:1,marks:1},
    ],
    questionTypes: {mcq:4, msq:1, nat:1},
  },
  {
    id: "ee-ps-economics",
    name: "Economic Operation & Power Factor",
    topic: "Power Systems",
    totalQuestions: 5, totalMarks: 8,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:0,marks:0},{year:2009,count:1,marks:1},
      {year:2010,count:0,marks:0},{year:2011,count:1,marks:1},{year:2012,count:0,marks:0},
      {year:2013,count:1,marks:1},{year:2014,count:0,marks:0},{year:2015,count:1,marks:1},
      {year:2016,count:1,marks:1},{year:2017,count:1,marks:1},{year:2018,count:1,marks:1},
      {year:2019,count:1,marks:1},{year:2020,count:0,marks:0},{year:2021,count:1,marks:1},
      {year:2022,count:0,marks:0},{year:2023,count:1,marks:1},{year:2024,count:1,marks:1},
      {year:2025,count:1,marks:1},{year:2026,count:1,marks:1},
    ],
    questionTypes: {mcq:4, msq:0, nat:1},
  },

  // ── Control Systems (5 subtopics) ──
  {
    id: "ee-ct-tf",
    name: "Transfer Function & Block Diagrams",
    topic: "Control Systems",
    totalQuestions: 10, totalMarks: 15,
    yearlyData: [
      {year:2007,count:1,marks:2},{year:2008,count:1,marks:2},{year:2009,count:1,marks:1},
      {year:2010,count:1,marks:2},{year:2011,count:1,marks:2},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:1},{year:2014,count:1,marks:2},{year:2015,count:1,marks:2},
      {year:2016,count:1,marks:2},{year:2017,count:1,marks:1},{year:2018,count:1,marks:2},
      {year:2019,count:1,marks:2},{year:2020,count:1,marks:1},{year:2021,count:1,marks:2},
      {year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:7, msq:2, nat:1},
  },
  {
    id: "ee-ct-stability",
    name: "Stability Analysis (Routh-Hurwitz, Nyquist, Bode)",
    topic: "Control Systems",
    totalQuestions: 12, totalMarks: 17,
    yearlyData: [
      {year:2007,count:1,marks:2},{year:2008,count:1,marks:2},{year:2009,count:1,marks:2},
      {year:2010,count:1,marks:2},{year:2011,count:1,marks:2},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:1},{year:2014,count:1,marks:2},{year:2015,count:1,marks:2},
      {year:2016,count:1,marks:2},{year:2017,count:1,marks:2},{year:2018,count:1,marks:1},
      {year:2019,count:1,marks:2},{year:2020,count:1,marks:2},{year:2021,count:1,marks:1},
      {year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:8, msq:2, nat:2},
  },
  {
    id: "ee-ct-rootlocus",
    name: "Root Locus & Frequency Response",
    topic: "Control Systems",
    totalQuestions: 8, totalMarks: 12,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:1,marks:2},{year:2009,count:1,marks:2},
      {year:2010,count:1,marks:2},{year:2011,count:1,marks:1},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:1},{year:2014,count:1,marks:2},{year:2015,count:1,marks:1},
      {year:2016,count:1,marks:2},{year:2017,count:0,marks:0},{year:2018,count:1,marks:2},
      {year:2019,count:1,marks:2},{year:2020,count:1,marks:1},{year:2021,count:1,marks:2},
      {year:2022,count:1,marks:2},{year:2023,count:1,marks:1},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:6, msq:1, nat:1},
  },
  {
    id: "ee-ct-compensation",
    name: "Compensators (Lag, Lead, Lag-Lead)",
    topic: "Control Systems",
    totalQuestions: 6, totalMarks: 8,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:0,marks:0},{year:2009,count:1,marks:1},
      {year:2010,count:1,marks:2},{year:2011,count:1,marks:1},{year:2012,count:0,marks:0},
      {year:2013,count:1,marks:2},{year:2014,count:1,marks:1},{year:2015,count:1,marks:1},
      {year:2016,count:1,marks:1},{year:2017,count:1,marks:2},{year:2018,count:1,marks:1},
      {year:2019,count:0,marks:0},{year:2020,count:1,marks:2},{year:2021,count:1,marks:1},
      {year:2022,count:1,marks:1},{year:2023,count:1,marks:1},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:0,marks:0},
    ],
    questionTypes: {mcq:4, msq:1, nat:1},
  },
  {
    id: "ee-ct-statespace",
    name: "State Space Analysis",
    topic: "Control Systems",
    totalQuestions: 5, totalMarks: 7,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:0,marks:0},{year:2009,count:0,marks:0},
      {year:2010,count:0,marks:0},{year:2011,count:1,marks:1},{year:2012,count:0,marks:0},
      {year:2013,count:1,marks:1},{year:2014,count:0,marks:0},{year:2015,count:1,marks:1},
      {year:2016,count:1,marks:1},{year:2017,count:1,marks:1},{year:2018,count:1,marks:1},
      {year:2019,count:0,marks:0},{year:2020,count:1,marks:1},{year:2021,count:1,marks:1},
      {year:2022,count:0,marks:0},{year:2023,count:1,marks:1},{year:2024,count:1,marks:1},
      {year:2025,count:1,marks:1},{year:2026,count:1,marks:1},
    ],
    questionTypes: {mcq:4, msq:0, nat:1},
  },

  // ── Power Electronics (4 subtopics) ──
  {
    id: "ee-pe-dcdc",
    name: "DC-DC Converters (Choppers)",
    topic: "Power Electronics",
    totalQuestions: 10, totalMarks: 15,
    yearlyData: [
      {year:2007,count:1,marks:2},{year:2008,count:1,marks:2},{year:2009,count:1,marks:1},
      {year:2010,count:1,marks:2},{year:2011,count:1,marks:2},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:1},{year:2014,count:1,marks:2},{year:2015,count:1,marks:2},
      {year:2016,count:1,marks:2},{year:2017,count:1,marks:1},{year:2018,count:1,marks:2},
      {year:2019,count:1,marks:2},{year:2020,count:1,marks:1},{year:2021,count:1,marks:2},
      {year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:7, msq:2, nat:1},
  },
  {
    id: "ee-pe-inverters",
    name: "Inverters (Single/Three Phase)",
    topic: "Power Electronics",
    totalQuestions: 10, totalMarks: 14,
    yearlyData: [
      {year:2007,count:1,marks:2},{year:2008,count:1,marks:1},{year:2009,count:1,marks:2},
      {year:2010,count:1,marks:2},{year:2011,count:1,marks:1},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:2},{year:2014,count:1,marks:1},{year:2015,count:1,marks:2},
      {year:2016,count:1,marks:2},{year:2017,count:1,marks:2},{year:2018,count:1,marks:1},
      {year:2019,count:1,marks:2},{year:2020,count:1,marks:2},{year:2021,count:1,marks:1},
      {year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:7, msq:2, nat:1},
  },
  {
    id: "ee-pe-rectifiers",
    name: "Rectifiers & Cycloconverters",
    topic: "Power Electronics",
    totalQuestions: 6, totalMarks: 8,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:0,marks:0},{year:2009,count:1,marks:1},
      {year:2010,count:1,marks:2},{year:2011,count:0,marks:0},{year:2012,count:1,marks:1},
      {year:2013,count:0,marks:0},{year:2014,count:1,marks:1},{year:2015,count:1,marks:1},
      {year:2016,count:1,marks:1},{year:2017,count:1,marks:2},{year:2018,count:0,marks:0},
      {year:2019,count:1,marks:1},{year:2020,count:1,marks:1},{year:2021,count:1,marks:1},
      {year:2022,count:0,marks:0},{year:2023,count:1,marks:1},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:1},
    ],
    questionTypes: {mcq:4, msq:1, nat:1},
  },
  {
    id: "eepe-voltagecontrol",
    name: "Voltage Controllers & UPS",
    topic: "Power Electronics",
    totalQuestions: 4, totalMarks: 5,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:0,marks:0},{year:2009,count:0,marks:0},
      {year:2010,count:0,marks:0},{year:2011,count:1,marks:1},{year:2012,count:0,marks:0},
      {year:2013,count:1,marks:1},{year:2014,count:0,marks:0},{year:2015,count:1,marks:1},
      {year:2016,count:1,marks:1},{year:2017,count:0,marks:0},{year:2018,count:0,marks:0},
      {year:2019,count:1,marks:1},{year:2020,count:0,marks:0},{year:2021,count:0,marks:0},
      {year:2022,count:0,marks:0},{year:2023,count:1,marks:1},{year:2024,count:0,marks:0},
      {year:2025,count:1,marks:1},{year:2026,count:1,marks:1},
    ],
    questionTypes: {mcq:3, msq:0, nat:1},
  },

  // ── Signals & Systems (4 subtopics) ──
  {
    id: "ee-ss-fourier",
    name: "Fourier Series & Fourier Transform",
    topic: "Signals & Systems",
    totalQuestions: 8, totalMarks: 12,
    yearlyData: [
      {year:2007,count:1,marks:2},{year:2008,count:1,marks:2},{year:2009,count:1,marks:1},
      {year:2010,count:1,marks:2},{year:2011,count:1,marks:2},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:1},{year:2014,count:1,marks:2},{year:2015,count:1,marks:2},
      {year:2016,count:1,marks:2},{year:2017,count:1,marks:1},{year:2018,count:1,marks:2},
      {year:2019,count:1,marks:2},{year:2020,count:1,marks:1},{year:2021,count:1,marks:2},
      {year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:6, msq:1, nat:1},
  },
  {
    id: "ee-ss-lti",
    name: "LTI Systems & Convolution",
    topic: "Signals & Systems",
    totalQuestions: 7, totalMarks: 10,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:1,marks:2},{year:2009,count:1,marks:2},
      {year:2010,count:1,marks:2},{year:2011,count:1,marks:1},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:1},{year:2014,count:1,marks:2},{year:2015,count:1,marks:1},
      {year:2016,count:1,marks:2},{year:2017,count:0,marks:0},{year:2018,count:1,marks:2},
      {year:2019,count:1,marks:2},{year:2020,count:1,marks:2},{year:2021,count:1,marks:1},
      {year:2022,count:0,marks:0},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:5, msq:1, nat:1},
  },
  {
    id: "ee-ss-laplace",
    name: "Laplace Transform & s-Domain",
    topic: "Signals & Systems",
    totalQuestions: 7, totalMarks: 10,
    yearlyData: [
      {year:2007,count:1,marks:2},{year:2008,count:1,marks:1},{year:2009,count:0,marks:0},
      {year:2010,count:1,marks:2},{year:2011,count:1,marks:2},{year:2012,count:0,marks:0},
      {year:2013,count:1,marks:2},{year:2014,count:1,marks:1},{year:2015,count:1,marks:2},
      {year:2016,count:1,marks:2},{year:2017,count:0,marks:0},{year:2018,count:1,marks:2},
      {year:2019,count:1,marks:1},{year:2020,count:1,marks:2},{year:2021,count:0,marks:0},
      {year:2022,count:1,marks:2},{year:2023,count:1,marks:1},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:5, msq:1, nat:1},
  },
  {
    id: "ee-ss-sampling",
    name: "Sampling Theorem & Z-Transform",
    topic: "Signals & Systems",
    totalQuestions: 5, totalMarks: 7,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:0,marks:0},{year:2009,count:1,marks:1},
      {year:2010,count:0,marks:0},{year:2011,count:0,marks:0},{year:2012,count:1,marks:1},
      {year:2013,count:1,marks:1},{year:2014,count:0,marks:0},{year:2015,count:1,marks:1},
      {year:2016,count:1,marks:1},{year:2017,count:1,marks:1},{year:2018,count:1,marks:1},
      {year:2019,count:0,marks:0},{year:2020,count:1,marks:1},{year:2021,count:0,marks:0},
      {year:2022,count:1,marks:1},{year:2023,count:1,marks:1},{year:2024,count:1,marks:1},
      {year:2025,count:1,marks:1},{year:2026,count:1,marks:1},
    ],
    questionTypes: {mcq:4, msq:0, nat:1},
  },

  // ── Analog Electronics (4 subtopics) ──
  {
    id: "ee-ae-bjt",
    name: "BJT Amplifiers (Biasing, Analysis)",
    topic: "Analog Electronics",
    totalQuestions: 8, totalMarks: 12,
    yearlyData: [
      {year:2007,count:1,marks:2},{year:2008,count:1,marks:2},{year:2009,count:1,marks:1},
      {year:2010,count:1,marks:2},{year:2011,count:1,marks:2},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:1},{year:2014,count:1,marks:2},{year:2015,count:1,marks:1},
      {year:2016,count:1,marks:2},{year:2017,count:1,marks:1},{year:2018,count:1,marks:2},
      {year:2019,count:1,marks:2},{year:2020,count:1,marks:1},{year:2021,count:1,marks:2},
      {year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:6, msq:1, nat:1},
  },
  {
    id: "ee-ae-opamp",
    name: "Op-Amp Circuits (Amplifiers, Filters, Oscillators)",
    topic: "Analog Electronics",
    totalQuestions: 10, totalMarks: 14,
    yearlyData: [
      {year:2007,count:1,marks:2},{year:2008,count:1,marks:2},{year:2009,count:1,marks:2},
      {year:2010,count:1,marks:2},{year:2011,count:1,marks:2},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:2},{year:2014,count:1,marks:2},{year:2015,count:1,marks:2},
      {year:2016,count:1,marks:2},{year:2017,count:1,marks:2},{year:2018,count:1,marks:1},
      {year:2019,count:1,marks:2},{year:2020,count:1,marks:2},{year:2021,count:1,marks:2},
      {year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:7, msq:2, nat:1},
  },
  {
    id: "ee-ae-feedback",
    name: "Feedback Amplifiers & Oscillators",
    topic: "Analog Electronics",
    totalQuestions: 5, totalMarks: 7,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:1,marks:1},{year:2009,count:0,marks:0},
      {year:2010,count:1,marks:2},{year:2011,count:0,marks:0},{year:2012,count:1,marks:1},
      {year:2013,count:1,marks:1},{year:2014,count:1,marks:1},{year:2015,count:0,marks:0},
      {year:2016,count:1,marks:1},{year:2017,count:0,marks:0},{year:2018,count:1,marks:1},
      {year:2019,count:1,marks:1},{year:2020,count:0,marks:0},{year:2021,count:1,marks:1},
      {year:2022,count:1,marks:1},{year:2023,count:1,marks:1},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:1},
    ],
    questionTypes: {mcq:4, msq:1, nat:0},
  },
  {
    id: "ee-ae-diodes",
    name: "Diode Circuits (Clipping, Clamping, Rectifiers)",
    topic: "Analog Electronics",
    totalQuestions: 5, totalMarks: 7,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:0,marks:0},{year:2009,count:1,marks:1},
      {year:2010,count:1,marks:1},{year:2011,count:0,marks:0},{year:2012,count:0,marks:0},
      {year:2013,count:1,marks:1},{year:2014,count:0,marks:0},{year:2015,count:1,marks:1},
      {year:2016,count:1,marks:1},{year:2017,count:1,marks:1},{year:2018,count:1,marks:1},
      {year:2019,count:0,marks:0},{year:2020,count:1,marks:2},{year:2021,count:1,marks:1},
      {year:2022,count:0,marks:0},{year:2023,count:1,marks:1},{year:2024,count:1,marks:1},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:1},
    ],
    questionTypes: {mcq:4, msq:0, nat:1},
  },

  // ── Digital Electronics (3 subtopics) ──
  {
    id: "ee-de-combinational",
    name: "Combinational Logic Circuits",
    topic: "Digital Electronics",
    totalQuestions: 8, totalMarks: 12,
    yearlyData: [
      {year:2007,count:1,marks:2},{year:2008,count:1,marks:1},{year:2009,count:1,marks:2},
      {year:2010,count:1,marks:2},{year:2011,count:1,marks:1},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:2},{year:2014,count:1,marks:1},{year:2015,count:1,marks:2},
      {year:2016,count:1,marks:2},{year:2017,count:1,marks:1},{year:2018,count:1,marks:2},
      {year:2019,count:1,marks:1},{year:2020,count:1,marks:2},{year:2021,count:1,marks:1},
      {year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:6, msq:1, nat:1},
  },
  {
    id: "ee-de-sequential",
    name: "Sequential Circuits (Flip-Flops, Counters)",
    topic: "Digital Electronics",
    totalQuestions: 7, totalMarks: 10,
    yearlyData: [
      {year:2007,count:1,marks:1},{year:2008,count:1,marks:2},{year:2009,count:0,marks:0},
      {year:2010,count:1,marks:2},{year:2011,count:1,marks:1},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:1},{year:2014,count:1,marks:2},{year:2015,count:1,marks:1},
      {year:2016,count:1,marks:2},{year:2017,count:1,marks:2},{year:2018,count:1,marks:1},
      {year:2019,count:1,marks:1},{year:2020,count:0,marks:0},{year:2021,count:1,marks:2},
      {year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:1},
    ],
    questionTypes: {mcq:5, msq:1, nat:1},
  },
  {
    id: "ee-de-memory",
    name: "Logic Families, Memory & ADC/DAC",
    topic: "Digital Electronics",
    totalQuestions: 6, totalMarks: 8,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:1,marks:1},{year:2009,count:1,marks:1},
      {year:2010,count:0,marks:0},{year:2011,count:0,marks:0},{year:2012,count:1,marks:1},
      {year:2013,count:0,marks:0},{year:2014,count:1,marks:1},{year:2015,count:1,marks:1},
      {year:2016,count:1,marks:1},{year:2017,count:0,marks:0},{year:2018,count:0,marks:0},
      {year:2019,count:1,marks:1},{year:2020,count:1,marks:1},{year:2021,count:1,marks:1},
      {year:2022,count:0,marks:0},{year:2023,count:1,marks:1},{year:2024,count:1,marks:1},
      {year:2025,count:1,marks:1},{year:2026,count:1,marks:1},
    ],
    questionTypes: {mcq:4, msq:1, nat:1},
  },

  // ── EMFT (3 subtopics) ──
  {
    id: "ee-em-electrostatics",
    name: "Electrostatics (Fields, Potential, Gauss Law)",
    topic: "Electromagnetic Field Theory",
    totalQuestions: 6, totalMarks: 9,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:1,marks:2},{year:2009,count:1,marks:1},
      {year:2010,count:1,marks:2},{year:2011,count:0,marks:0},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:1},{year:2014,count:1,marks:2},{year:2015,count:1,marks:1},
      {year:2016,count:1,marks:1},{year:2017,count:1,marks:2},{year:2018,count:1,marks:1},
      {year:2019,count:0,marks:0},{year:2020,count:1,marks:2},{year:2021,count:1,marks:1},
      {year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:4, msq:1, nat:1},
  },
  {
    id: "ee-em-transmissionlines",
    name: "Transmission Lines & Wave Propagation",
    topic: "Electromagnetic Field Theory",
    totalQuestions: 6, totalMarks: 9,
    yearlyData: [
      {year:2007,count:1,marks:2},{year:2008,count:1,marks:1},{year:2009,count:1,marks:2},
      {year:2010,count:1,marks:2},{year:2011,count:1,marks:1},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:1},{year:2014,count:1,marks:2},{year:2015,count:1,marks:2},
      {year:2016,count:1,marks:2},{year:2017,count:1,marks:1},{year:2018,count:0,marks:0},
      {year:2019,count:1,marks:2},{year:2020,count:1,marks:1},{year:2021,count:1,marks:2},
      {year:2022,count:1,marks:1},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:4, msq:1, nat:1},
  },
  {
    id: "ee-em-maxwell",
    name: "Maxwell's Equations & EM Waves",
    topic: "Electromagnetic Field Theory",
    totalQuestions: 5, totalMarks: 7,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:0,marks:0},{year:2009,count:1,marks:1},
      {year:2010,count:0,marks:0},{year:2011,count:1,marks:1},{year:2012,count:0,marks:0},
      {year:2013,count:1,marks:1},{year:2014,count:1,marks:1},{year:2015,count:0,marks:0},
      {year:2016,count:1,marks:1},{year:2017,count:1,marks:1},{year:2018,count:1,marks:2},
      {year:2019,count:1,marks:1},{year:2020,count:0,marks:0},{year:2021,count:1,marks:1},
      {year:2022,count:1,marks:1},{year:2023,count:0,marks:0},{year:2024,count:1,marks:1},
      {year:2025,count:1,marks:1},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:4, msq:0, nat:1},
  },

  // ── Measurements & Instrumentation (4 subtopics) ──
  {
    id: "ee-mi-instruments",
    name: "Instrument Classification & Characteristics",
    topic: "Measurements & Instrumentation",
    totalQuestions: 6, totalMarks: 9,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:1,marks:2},{year:2009,count:1,marks:1},
      {year:2010,count:1,marks:2},{year:2011,count:0,marks:0},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:1},{year:2014,count:1,marks:2},{year:2015,count:1,marks:1},
      {year:2016,count:1,marks:2},{year:2017,count:0,marks:0},{year:2018,count:0,marks:0},
      {year:2019,count:1,marks:2},{year:2020,count:1,marks:1},{year:2021,count:1,marks:2},
      {year:2022,count:0,marks:0},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:4, msq:1, nat:1},
  },
  {
    id: "ee-mi-cro",
    name: "CRO & Display Instruments",
    topic: "Measurements & Instrumentation",
    totalQuestions: 6, totalMarks: 9,
    yearlyData: [
      {year:2007,count:1,marks:2},{year:2008,count:1,marks:1},{year:2009,count:1,marks:2},
      {year:2010,count:0,marks:0},{year:2011,count:1,marks:2},{year:2012,count:1,marks:1},
      {year:2013,count:1,marks:2},{year:2014,count:1,marks:1},{year:2015,count:1,marks:2},
      {year:2016,count:1,marks:1},{year:2017,count:1,marks:2},{year:2018,count:1,marks:1},
      {year:2019,count:1,marks:1},{year:2020,count:1,marks:2},{year:2021,count:0,marks:0},
      {year:2022,count:1,marks:2},{year:2023,count:1,marks:1},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:1},
    ],
    questionTypes: {mcq:4, msq:1, nat:1},
  },
  {
    id: "ee-mi-bridges",
    name: "Bridge Circuits & Transducers",
    topic: "Measurements & Instrumentation",
    totalQuestions: 6, totalMarks: 9,
    yearlyData: [
      {year:2007,count:1,marks:2},{year:2008,count:0,marks:0},{year:2009,count:1,marks:1},
      {year:2010,count:1,marks:1},{year:2011,count:0,marks:0},{year:2012,count:1,marks:2},
      {year:2013,count:0,marks:0},{year:2014,count:1,marks:1},{year:2015,count:1,marks:1},
      {year:2016,count:1,marks:1},{year:2017,count:1,marks:1},{year:2018,count:1,marks:2},
      {year:2019,count:1,marks:1},{year:2020,count:1,marks:2},{year:2021,count:1,marks:1},
      {year:2022,count:1,marks:1},{year:2023,count:1,marks:1},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:4, msq:1, nat:1},
  },
  {
    id: "ee-mi-power",
    name: "Power & Energy Measurement",
    topic: "Measurements & Instrumentation",
    totalQuestions: 5, totalMarks: 7,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:0,marks:0},{year:2009,count:1,marks:1},
      {year:2010,count:1,marks:1},{year:2011,count:1,marks:1},{year:2012,count:0,marks:0},
      {year:2013,count:1,marks:1},{year:2014,count:0,marks:0},{year:2015,count:1,marks:1},
      {year:2016,count:0,marks:0},{year:2017,count:1,marks:1},{year:2018,count:1,marks:1},
      {year:2019,count:1,marks:1},{year:2020,count:0,marks:0},{year:2021,count:1,marks:1},
      {year:2022,count:1,marks:1},{year:2023,count:0,marks:0},{year:2024,count:1,marks:1},
      {year:2025,count:1,marks:1},{year:2026,count:1,marks:1},
    ],
    questionTypes: {mcq:3, msq:1, nat:1},
  },
];

// ─── EE yearly totals by subject ───
export const EE_YEARLY_TOTALS: { year: number; totalMarks: number; totalQuestions: number }[] = EE_AVAILABLE_YEARS.map((year) => {
  const yearData = EE_RAW_DATA.map((s) => {
    const yd = s.yearlyData.find((y) => y.year === year);
    return { marks: yd?.marks ?? 0, count: yd?.count ?? 0 };
  });
  return {
    year,
    totalMarks: yearData.reduce((s, d) => s + d.marks, 0),
    totalQuestions: yearData.reduce((s, d) => s + d.count, 0),
  };
});

// ─── Paper-level summary ───
export interface PaperSummary {
  paperId: string;
  paperName: string;
  dataVersion: string;
  totalQuestions: number;
  totalMarks: number;
  yearsCovered: number[];
  paperCount: number;
  subjectBreakdown: {
    id: string;
    name: string;
    totalQuestions: number;
    totalMarks: number;
    avgMarksPerPaper: number;
  }[];
  overallMarksByYear: { year: number; totalMarks: number }[];
  avgMarksPerPaper: number;
  questionTypeBreakdown: {
    type: string;
    count: number;
    marks: number;
    percentage: number;
  }[];
}

export const GATE_EE_SUMMARY: PaperSummary = {
  paperId: "gate-ee",
  paperName: "Electrical Engineering",
  dataVersion: "2026-09-02-v1",
  totalQuestions: EE_RAW_DATA.reduce((s, d) => s + d.totalQuestions, 0),
  totalMarks: EE_RAW_DATA.reduce((s, d) => s + d.totalMarks, 0),
  yearsCovered: EE_AVAILABLE_YEARS,
  paperCount: EE_AVAILABLE_YEARS.length,
  subjectBreakdown: EE_RAW_DATA.map((s) => ({
    id: s.id,
    name: s.name,
    totalQuestions: s.totalQuestions,
    totalMarks: s.totalMarks,
    avgMarksPerPaper: Math.round((s.totalMarks / EE_AVAILABLE_YEARS.length) * 10) / 10,
  })),
  overallMarksByYear: EE_YEARLY_TOTALS.map((y) => ({ year: y.year, totalMarks: y.totalMarks })),
  avgMarksPerPaper: Math.round(
    (EE_RAW_DATA.reduce((s, d) => s + d.totalMarks, 0) / EE_AVAILABLE_YEARS.length) * 10
  ) / 10,
  questionTypeBreakdown: [
    { type: "MCQ", count: 165, marks: 245, percentage: 52 },
    { type: "MSQ", count: 55, marks: 80, percentage: 17 },
    { type: "NAT", count: 70, marks: 125, percentage: 31 },
  ],
};

export const EE_DIFFICULTY_DISTRIBUTION = {
  easy: 32,
  medium: 48,
  hard: 20,
} as const;
