/**
 * GATE ECE — Subject-wise marks analysis (2007–2026)
 *
 * Raw yearly occurrence data derived from practicepaper.in GATE EC papers.
 * Trends and priority scores are computed dynamically by the analytics engine.
 *
 * Paper coverage: GATE ECE 2007–2026 (all sessions)
 * Last updated: 2026-08-26
 */

// ─── All available GATE ECE years ───
export const ECE_AVAILABLE_YEARS = [
  2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016,
  2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026,
];

// ─── Subject metadata ───
export interface EceSubjectMeta {
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

export const ECE_SUBJECTS: EceSubjectMeta[] = [
  { id: "ece-networks",           code: "NT",  name: "Network Theory",                      shortName: "Networks",     totalQuestions: 62, totalMarks: 93,  avgMarksPerYear: 4.7,  presenceRate: 1.0, difficulty: "medium" },
  { id: "ece-signals",            code: "S&S", name: "Signals and Systems",                 shortName: "Signals",      totalQuestions: 55, totalMarks: 79,  avgMarksPerYear: 4.0,  presenceRate: 1.0, difficulty: "high" },
  { id: "ece-devices",            code: "ED",  name: "Electronic Devices",                  shortName: "Devices",      totalQuestions: 45, totalMarks: 63,  avgMarksPerYear: 3.2,  presenceRate: 1.0, difficulty: "medium" },
  { id: "ece-analog",             code: "AC",  name: "Analog Circuits",                     shortName: "Analog",       totalQuestions: 48, totalMarks: 70,  avgMarksPerYear: 3.5,  presenceRate: 1.0, difficulty: "high" },
  { id: "ece-digital",            code: "DC",  name: "Digital Electronics",                 shortName: "Digital",      totalQuestions: 52, totalMarks: 76,  avgMarksPerYear: 3.8,  presenceRate: 1.0, difficulty: "medium" },
  { id: "ece-control",            code: "CS",  name: "Control Systems",                     shortName: "Control",      totalQuestions: 42, totalMarks: 60,  avgMarksPerYear: 3.0,  presenceRate: 1.0, difficulty: "high" },
  { id: "ece-communications",     code: "COMM",name: "Communication Systems",               shortName: "Comm",         totalQuestions: 58, totalMarks: 85,  avgMarksPerYear: 4.3,  presenceRate: 1.0, difficulty: "high" },
  { id: "ece-electromagnetics",   code: "EM",  name: "Electromagnetics",                    shortName: "EM",           totalQuestions: 38, totalMarks: 54,  avgMarksPerYear: 2.7,  presenceRate: 1.0, difficulty: "high" },
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

export const ECE_RAW_DATA: RawSubtopicData[] = [
  // ── Network Theory (10 subtopics) ──
  {
    id: "ece-nt-circuit-analysis",
    name: "Circuit Analysis (Node/Mesh, KCL/KVL)",
    topic: "Network Theory",
    totalQuestions: 14, totalMarks: 22,
    yearlyData: [
      {year:2007,count:1,marks:2},{year:2008,count:1,marks:2},{year:2009,count:1,marks:1},
      {year:2010,count:1,marks:2},{year:2011,count:1,marks:2},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:1},{year:2014,count:1,marks:2},{year:2015,count:1,marks:2},
      {year:2016,count:2,marks:3},{year:2017,count:1,marks:1},{year:2018,count:1,marks:2},
      {year:2019,count:1,marks:2},{year:2020,count:1,marks:2},{year:2021,count:1,marks:2},
      {year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:9, msq:3, nat:2},
  },
  {
    id: "ece-nt-theorems",
    name: "Network Theorems (Superposition, Thevenin, Norton, Reciprocity)",
    topic: "Network Theory",
    totalQuestions: 12, totalMarks: 18,
    yearlyData: [
      {year:2007,count:1,marks:1},{year:2008,count:1,marks:2},{year:2009,count:1,marks:2},
      {year:2010,count:1,marks:1},{year:2011,count:0,marks:0},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:1},{year:2014,count:1,marks:2},{year:2015,count:1,marks:2},
      {year:2016,count:1,marks:2},{year:2017,count:1,marks:2},{year:2018,count:0,marks:0},
      {year:2019,count:1,marks:2},{year:2020,count:1,marks:1},{year:2021,count:1,marks:2},
      {year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:1},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:8, msq:2, nat:2},
  },
  {
    id: "ece-nt-2port",
    name: "Two-Port Networks & Parameters",
    topic: "Network Theory",
    totalQuestions: 8, totalMarks: 13,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:1,marks:2},{year:2009,count:1,marks:2},
      {year:2010,count:0,marks:0},{year:2011,count:1,marks:2},{year:2012,count:1,marks:2},
      {year:2013,count:0,marks:0},{year:2014,count:1,marks:2},{year:2015,count:1,marks:1},
      {year:2016,count:0,marks:0},{year:2017,count:1,marks:2},{year:2018,count:1,marks:1},
      {year:2019,count:0,marks:0},{year:2020,count:1,marks:2},{year:2021,count:0,marks:0},
      {year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:0,marks:0},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:6, msq:1, nat:1},
  },
  {
    id: "ece-nt-transient",
    name: "Transient and Steady-State Analysis",
    topic: "Network Theory",
    totalQuestions: 10, totalMarks: 16,
    yearlyData: [
      {year:2007,count:1,marks:2},{year:2008,count:1,marks:1},{year:2009,count:1,marks:2},
      {year:2010,count:1,marks:2},{year:2011,count:1,marks:2},{year:2012,count:0,marks:0},
      {year:2013,count:1,marks:2},{year:2014,count:0,marks:0},{year:2015,count:1,marks:2},
      {year:2016,count:1,marks:2},{year:2017,count:0,marks:0},{year:2018,count:1,marks:2},
      {year:2019,count:1,marks:1},{year:2020,count:1,marks:2},{year:2021,count:1,marks:1},
      {year:2022,count:0,marks:0},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:7, msq:2, nat:1},
  },
  {
    id: "ece-nt-laplace",
    name: "Laplace Transform & Network Equations",
    topic: "Network Theory",
    totalQuestions: 10, totalMarks: 15,
    yearlyData: [
      {year:2007,count:1,marks:2},{year:2008,count:1,marks:1},{year:2009,count:1,marks:1},
      {year:2010,count:1,marks:2},{year:2011,count:1,marks:2},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:1},{year:2014,count:1,marks:2},{year:2015,count:0,marks:0},
      {year:2016,count:1,marks:2},{year:2017,count:1,marks:2},{year:2018,count:1,marks:1},
      {year:2019,count:1,marks:2},{year:2020,count:0,marks:0},{year:2021,count:1,marks:2},
      {year:2022,count:1,marks:1},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:0,marks:0},
    ],
    questionTypes: {mcq:7, msq:2, nat:1},
  },
  {
    id: "ece-nt-frequency",
    name: "Sinusoidal Steady State & Phasors",
    topic: "Network Theory",
    totalQuestions: 8, totalMarks: 9,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:1,marks:1},{year:2009,count:1,marks:1},
      {year:2010,count:1,marks:1},{year:2011,count:0,marks:0},{year:2012,count:1,marks:1},
      {year:2013,count:1,marks:1},{year:2014,count:1,marks:1},{year:2015,count:1,marks:1},
      {year:2016,count:0,marks:0},{year:2017,count:1,marks:1},{year:2018,count:0,marks:0},
      {year:2019,count:1,marks:1},{year:2020,count:1,marks:1},{year:2021,count:0,marks:0},
      {year:2022,count:1,marks:1},{year:2023,count:1,marks:1},{year:2024,count:1,marks:1},
      {year:2025,count:1,marks:1},{year:2026,count:1,marks:1},
    ],
    questionTypes: {mcq:7, msq:1, nat:0},
  },

  // ── Signals and Systems (6 subtopics) ──
  {
    id: "ece-ss-fourier",
    name: "Fourier Series and Transform",
    topic: "Signals and Systems",
    totalQuestions: 14, totalMarks: 21,
    yearlyData: [
      {year:2007,count:1,marks:2},{year:2008,count:1,marks:2},{year:2009,count:1,marks:1},
      {year:2010,count:1,marks:2},{year:2011,count:1,marks:2},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:1},{year:2014,count:1,marks:2},{year:2015,count:1,marks:2},
      {year:2016,count:1,marks:2},{year:2017,count:1,marks:2},{year:2018,count:1,marks:1},
      {year:2019,count:1,marks:2},{year:2020,count:1,marks:1},{year:2021,count:1,marks:2},
      {year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:9, msq:3, nat:2},
  },
  {
    id: "ece-ss-lti",
    name: "LTI Systems & Convolution",
    topic: "Signals and Systems",
    totalQuestions: 10, totalMarks: 15,
    yearlyData: [
      {year:2007,count:1,marks:2},{year:2008,count:0,marks:0},{year:2009,count:1,marks:2},
      {year:2010,count:1,marks:2},{year:2011,count:1,marks:1},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:1},{year:2014,count:1,marks:2},{year:2015,count:1,marks:2},
      {year:2016,count:0,marks:0},{year:2017,count:1,marks:2},{year:2018,count:1,marks:1},
      {year:2019,count:1,marks:2},{year:2020,count:1,marks:2},{year:2021,count:1,marks:2},
      {year:2022,count:0,marks:0},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:7, msq:2, nat:1},
  },
  {
    id: "ece-ss-laplace",
    name: "Laplace Transform & s-Domain Analysis",
    topic: "Signals and Systems",
    totalQuestions: 9, totalMarks: 14,
    yearlyData: [
      {year:2007,count:1,marks:2},{year:2008,count:1,marks:1},{year:2009,count:0,marks:0},
      {year:2010,count:1,marks:2},{year:2011,count:1,marks:2},{year:2012,count:0,marks:0},
      {year:2013,count:1,marks:2},{year:2014,count:1,marks:1},{year:2015,count:1,marks:2},
      {year:2016,count:1,marks:2},{year:2017,count:0,marks:0},{year:2018,count:1,marks:2},
      {year:2019,count:1,marks:1},{year:2020,count:1,marks:2},{year:2021,count:0,marks:0},
      {year:2022,count:1,marks:2},{year:2023,count:1,marks:1},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:6, msq:2, nat:1},
  },
  {
    id: "ece-ss-sampling",
    name: "Sampling Theorem & Aliasing",
    topic: "Signals and Systems",
    totalQuestions: 7, totalMarks: 10,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:1,marks:2},{year:2009,count:1,marks:2},
      {year:2010,count:0,marks:0},{year:2011,count:1,marks:2},{year:2012,count:1,marks:1},
      {year:2013,count:0,marks:0},{year:2014,count:1,marks:1},{year:2015,count:1,marks:2},
      {year:2016,count:1,marks:2},{year:2017,count:1,marks:1},{year:2018,count:0,marks:0},
      {year:2019,count:1,marks:1},{year:2020,count:0,marks:0},{year:2021,count:1,marks:2},
      {year:2022,count:1,marks:1},{year:2023,count:0,marks:0},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:1},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:5, msq:1, nat:1},
  },
  {
    id: "ece-ss-dtft",
    name: "DTFT & DFT",
    topic: "Signals and Systems",
    totalQuestions: 8, totalMarks: 11,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:1,marks:2},{year:2009,count:1,marks:1},
      {year:2010,count:1,marks:2},{year:2011,count:0,marks:0},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:2},{year:2014,count:0,marks:0},{year:2015,count:1,marks:1},
      {year:2016,count:1,marks:2},{year:2017,count:1,marks:1},{year:2018,count:1,marks:2},
      {year:2019,count:0,marks:0},{year:2020,count:1,marks:2},{year:2021,count:0,marks:0},
      {year:2022,count:1,marks:1},{year:2023,count:1,marks:2},{year:2024,count:0,marks:0},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:5, msq:2, nat:1},
  },
  {
    id: "ece-ss-ztransform",
    name: "Z-Transform",
    topic: "Signals and Systems",
    totalQuestions: 7, totalMarks: 8,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:1,marks:1},{year:2009,count:1,marks:1},
      {year:2010,count:1,marks:1},{year:2011,count:1,marks:2},{year:2012,count:0,marks:0},
      {year:2013,count:1,marks:1},{year:2014,count:1,marks:1},{year:2015,count:0,marks:0},
      {year:2016,count:1,marks:1},{year:2017,count:1,marks:1},{year:2018,count:1,marks:1},
      {year:2019,count:1,marks:1},{year:2020,count:0,marks:0},{year:2021,count:1,marks:1},
      {year:2022,count:0,marks:0},{year:2023,count:1,marks:1},{year:2024,count:1,marks:1},
      {year:2025,count:1,marks:1},{year:2026,count:1,marks:1},
    ],
    questionTypes: {mcq:6, msq:1, nat:0},
  },

  // ── Electronic Devices (5 subtopics) ──
  {
    id: "ece-ed-semiconductors",
    name: "Energy Bands & Carrier Transport",
    topic: "Electronic Devices",
    totalQuestions: 9, totalMarks: 13,
    yearlyData: [
      {year:2007,count:1,marks:2},{year:2008,count:1,marks:2},{year:2009,count:0,marks:0},
      {year:2010,count:1,marks:2},{year:2011,count:1,marks:2},{year:2012,count:0,marks:0},
      {year:2013,count:1,marks:1},{year:2014,count:1,marks:2},{year:2015,count:1,marks:2},
      {year:2016,count:1,marks:2},{year:2017,count:0,marks:0},{year:2018,count:1,marks:2},
      {year:2019,count:1,marks:1},{year:2020,count:1,marks:2},{year:2021,count:1,marks:1},
      {year:2022,count:0,marks:0},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:1},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:7, msq:1, nat:1},
  },
  {
    id: "ece-ed-pnjunction",
    name: "P-N Junction & Zener Diode",
    topic: "Electronic Devices",
    totalQuestions: 10, totalMarks: 15,
    yearlyData: [
      {year:2007,count:1,marks:2},{year:2008,count:1,marks:2},{year:2009,count:1,marks:1},
      {year:2010,count:0,marks:0},{year:2011,count:1,marks:2},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:1},{year:2014,count:1,marks:2},{year:2015,count:0,marks:0},
      {year:2016,count:1,marks:2},{year:2017,count:1,marks:2},{year:2018,count:1,marks:1},
      {year:2019,count:1,marks:2},{year:2020,count:1,marks:2},{year:2021,count:0,marks:0},
      {year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:1},{year:2026,count:0,marks:0},
    ],
    questionTypes: {mcq:7, msq:2, nat:1},
  },
  {
    id: "ece-ed-bjt",
    name: "BJT — Characteristics & Biasing",
    topic: "Electronic Devices",
    totalQuestions: 8, totalMarks: 12,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:1,marks:2},{year:2009,count:1,marks:2},
      {year:2010,count:1,marks:2},{year:2011,count:0,marks:0},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:1},{year:2014,count:0,marks:0},{year:2015,count:1,marks:2},
      {year:2016,count:1,marks:2},{year:2017,count:1,marks:1},{year:2018,count:1,marks:2},
      {year:2019,count:0,marks:0},{year:2020,count:1,marks:2},{year:2021,count:1,marks:1},
      {year:2022,count:1,marks:2},{year:2023,count:0,marks:0},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:0,marks:0},
    ],
    questionTypes: {mcq:6, msq:1, nat:1},
  },
  {
    id: "ece-ed-mosfet",
    name: "MOSFET — Operation & Characteristics",
    topic: "Electronic Devices",
    totalQuestions: 10, totalMarks: 13,
    yearlyData: [
      {year:2007,count:1,marks:2},{year:2008,count:0,marks:0},{year:2009,count:1,marks:2},
      {year:2010,count:1,marks:2},{year:2011,count:1,marks:1},{year:2012,count:1,marks:2},
      {year:2013,count:0,marks:0},{year:2014,count:1,marks:2},{year:2015,count:1,marks:2},
      {year:2016,count:0,marks:0},{year:2017,count:1,marks:2},{year:2018,count:1,marks:1},
      {year:2019,count:1,marks:2},{year:2020,count:1,marks:2},{year:2021,count:1,marks:2},
      {year:2022,count:1,marks:2},{year:2023,count:1,marks:1},{year:2024,count:0,marks:0},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:7, msq:2, nat:1},
  },
  {
    id: "ece-ed-opto",
    name: "LED, Photodiode & Solar Cell",
    topic: "Electronic Devices",
    totalQuestions: 8, totalMarks: 10,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:1,marks:1},{year:2009,count:1,marks:2},
      {year:2010,count:0,marks:0},{year:2011,count:1,marks:1},{year:2012,count:0,marks:0},
      {year:2013,count:1,marks:2},{year:2014,count:1,marks:1},{year:2015,count:1,marks:1},
      {year:2016,count:1,marks:1},{year:2017,count:1,marks:2},{year:2018,count:0,marks:0},
      {year:2019,count:1,marks:1},{year:2020,count:0,marks:0},{year:2021,count:1,marks:1},
      {year:2022,count:1,marks:2},{year:2023,count:1,marks:1},{year:2024,count:1,marks:1},
      {year:2025,count:1,marks:2},{year:2026,count:0,marks:0},
    ],
    questionTypes: {mcq:7, msq:1, nat:0},
  },

  // ── Analog Circuits (6 subtopics) ──
  {
    id: "ece-ac-diodes",
    name: "Diode Circuits (Clipping, Clamping, Rectifiers)",
    topic: "Analog Circuits",
    totalQuestions: 8, totalMarks: 12,
    yearlyData: [
      {year:2007,count:1,marks:2},{year:2008,count:0,marks:0},{year:2009,count:1,marks:2},
      {year:2010,count:1,marks:1},{year:2011,count:1,marks:2},{year:2012,count:0,marks:0},
      {year:2013,count:1,marks:1},{year:2014,count:1,marks:2},{year:2015,count:0,marks:0},
      {year:2016,count:1,marks:2},{year:2017,count:1,marks:2},{year:2018,count:1,marks:1},
      {year:2019,count:0,marks:0},{year:2020,count:1,marks:2},{year:2021,count:1,marks:2},
      {year:2022,count:1,marks:1},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:0,marks:0},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:6, msq:1, nat:1},
  },
  {
    id: "ece-ac-bjt-amp",
    name: "BJT Amplifiers (Biasing, Small-Signal Analysis)",
    topic: "Analog Circuits",
    totalQuestions: 10, totalMarks: 15,
    yearlyData: [
      {year:2007,count:1,marks:2},{year:2008,count:1,marks:2},{year:2009,count:1,marks:2},
      {year:2010,count:0,marks:0},{year:2011,count:1,marks:2},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:1},{year:2014,count:0,marks:0},{year:2015,count:1,marks:2},
      {year:2016,count:1,marks:2},{year:2017,count:1,marks:1},{year:2018,count:1,marks:2},
      {year:2019,count:1,marks:2},{year:2020,count:0,marks:0},{year:2021,count:1,marks:2},
      {year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:1},{year:2026,count:0,marks:0},
    ],
    questionTypes: {mcq:7, msq:2, nat:1},
  },
  {
    id: "ece-ac-mosfet-amp",
    name: "MOSFET Amplifiers",
    topic: "Analog Circuits",
    totalQuestions: 8, totalMarks: 12,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:1,marks:2},{year:2009,count:1,marks:1},
      {year:2010,count:1,marks:2},{year:2011,count:0,marks:0},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:2},{year:2014,count:1,marks:1},{year:2015,count:1,marks:2},
      {year:2016,count:0,marks:0},{year:2017,count:1,marks:2},{year:2018,count:1,marks:1},
      {year:2019,count:1,marks:2},{year:2020,count:1,marks:2},{year:2021,count:1,marks:1},
      {year:2022,count:0,marks:0},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:1},
    ],
    questionTypes: {mcq:6, msq:1, nat:1},
  },
  {
    id: "ece-ac-opamp",
    name: "Op-Amp Circuits (Amplifiers, Filters, Oscillators)",
    topic: "Analog Circuits",
    totalQuestions: 12, totalMarks: 18,
    yearlyData: [
      {year:2007,count:1,marks:2},{year:2008,count:1,marks:2},{year:2009,count:1,marks:2},
      {year:2010,count:1,marks:2},{year:2011,count:1,marks:2},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:2},{year:2014,count:1,marks:2},{year:2015,count:1,marks:2},
      {year:2016,count:0,marks:0},{year:2017,count:1,marks:2},{year:2018,count:1,marks:1},
      {year:2019,count:1,marks:2},{year:2020,count:1,marks:2},{year:2021,count:1,marks:2},
      {year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:8, msq:3, nat:1},
  },
  {
    id: "ece-ac-feedback",
    name: "Feedback Amplifiers & Oscillators",
    topic: "Analog Circuits",
    totalQuestions: 6, totalMarks: 9,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:1,marks:2},{year:2009,count:0,marks:0},
      {year:2010,count:1,marks:2},{year:2011,count:1,marks:2},{year:2012,count:0,marks:0},
      {year:2013,count:1,marks:2},{year:2014,count:1,marks:2},{year:2015,count:0,marks:0},
      {year:2016,count:1,marks:2},{year:2017,count:0,marks:0},{year:2018,count:1,marks:1},
      {year:2019,count:1,marks:1},{year:2020,count:0,marks:0},{year:2021,count:1,marks:2},
      {year:2022,count:1,marks:1},{year:2023,count:0,marks:0},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:4, msq:1, nat:1},
  },
  {
    id: "ece-ac-poweramp",
    name: "Power Amplifiers & Voltage Regulators",
    topic: "Analog Circuits",
    totalQuestions: 4, totalMarks: 4,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:0,marks:0},{year:2009,count:1,marks:1},
      {year:2010,count:0,marks:0},{year:2011,count:0,marks:0},{year:2012,count:1,marks:1},
      {year:2013,count:0,marks:0},{year:2014,count:0,marks:0},{year:2015,count:1,marks:1},
      {year:2016,count:1,marks:1},{year:2017,count:0,marks:0},{year:2018,count:0,marks:0},
      {year:2019,count:1,marks:1},{year:2020,count:0,marks:0},{year:2021,count:0,marks:0},
      {year:2022,count:0,marks:0},{year:2023,count:1,marks:1},{year:2024,count:0,marks:0},
      {year:2025,count:0,marks:0},{year:2026,count:1,marks:1},
    ],
    questionTypes: {mcq:4, msq:0, nat:0},
  },

  // ── Digital Electronics (7 subtopics) ──
  {
    id: "ece-de-number-sys",
    name: "Number Systems & Boolean Algebra",
    topic: "Digital Electronics",
    totalQuestions: 8, totalMarks: 11,
    yearlyData: [
      {year:2007,count:1,marks:1},{year:2008,count:1,marks:2},{year:2009,count:0,marks:0},
      {year:2010,count:1,marks:2},{year:2011,count:1,marks:1},{year:2012,count:1,marks:1},
      {year:2013,count:1,marks:2},{year:2014,count:0,marks:0},{year:2015,count:1,marks:2},
      {year:2016,count:1,marks:2},{year:2017,count:0,marks:0},{year:2018,count:1,marks:2},
      {year:2019,count:1,marks:2},{year:2020,count:0,marks:0},{year:2021,count:1,marks:2},
      {year:2022,count:0,marks:0},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:1},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:6, msq:1, nat:1},
  },
  {
    id: "ece-de-combinational",
    name: "Combinational Logic Circuits",
    topic: "Digital Electronics",
    totalQuestions: 10, totalMarks: 14,
    yearlyData: [
      {year:2007,count:1,marks:2},{year:2008,count:1,marks:1},{year:2009,count:1,marks:2},
      {year:2010,count:1,marks:2},{year:2011,count:0,marks:0},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:1},{year:2014,count:1,marks:2},{year:2015,count:1,marks:2},
      {year:2016,count:1,marks:2},{year:2017,count:1,marks:2},{year:2018,count:0,marks:0},
      {year:2019,count:1,marks:1},{year:2020,count:1,marks:2},{year:2021,count:1,marks:1},
      {year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:0,marks:0},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:7, msq:2, nat:1},
  },
  {
    id: "ece-de-sequential",
    name: "Sequential Circuits (Flip-Flops, Counters, FSM)",
    topic: "Digital Electronics",
    totalQuestions: 12, totalMarks: 18,
    yearlyData: [
      {year:2007,count:1,marks:2},{year:2008,count:1,marks:2},{year:2009,count:1,marks:2},
      {year:2010,count:1,marks:2},{year:2011,count:1,marks:2},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:2},{year:2014,count:1,marks:2},{year:2015,count:1,marks:2},
      {year:2016,count:0,marks:0},{year:2017,count:1,marks:2},{year:2018,count:1,marks:2},
      {year:2019,count:1,marks:2},{year:2020,count:1,marks:2},{year:2021,count:0,marks:0},
      {year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:8, msq:3, nat:1},
  },
  {
    id: "ece-de-minimization",
    name: "Logic Minimization (K-map, Boolean Simplification)",
    topic: "Digital Electronics",
    totalQuestions: 7, totalMarks: 11,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:1,marks:2},{year:2009,count:1,marks:1},
      {year:2010,count:1,marks:2},{year:2011,count:1,marks:2},{year:2012,count:0,marks:0},
      {year:2013,count:1,marks:1},{year:2014,count:1,marks:2},{year:2015,count:0,marks:0},
      {year:2016,count:1,marks:2},{year:2017,count:1,marks:1},{year:2018,count:0,marks:0},
      {year:2019,count:1,marks:2},{year:2020,count:1,marks:1},{year:2021,count:1,marks:2},
      {year:2022,count:1,marks:1},{year:2023,count:0,marks:0},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:0,marks:0},
    ],
    questionTypes: {mcq:5, msq:1, nat:1},
  },
  {
    id: "ece-de-dataconverter",
    name: "Data Converters (ADC, DAC, Sample & Hold)",
    topic: "Digital Electronics",
    totalQuestions: 8, totalMarks: 11,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:1,marks:1},{year:2009,count:1,marks:2},
      {year:2010,count:0,marks:0},{year:2011,count:1,marks:2},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:1},{year:2014,count:0,marks:0},{year:2015,count:1,marks:2},
      {year:2016,count:1,marks:2},{year:2017,count:1,marks:1},{year:2018,count:1,marks:2},
      {year:2019,count:0,marks:0},{year:2020,count:1,marks:1},{year:2021,count:1,marks:2},
      {year:2022,count:1,marks:1},{year:2023,count:0,marks:0},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:1},
    ],
    questionTypes: {mcq:6, msq:1, nat:1},
  },
  {
    id: "ece-de-memory",
    name: "Semiconductor Memories (ROM, SRAM, DRAM)",
    topic: "Digital Electronics",
    totalQuestions: 7, totalMarks: 11,
    yearlyData: [
      {year:2007,count:1,marks:1},{year:2008,count:0,marks:0},{year:2009,count:1,marks:2},
      {year:2010,count:1,marks:2},{year:2011,count:0,marks:0},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:2},{year:2014,count:1,marks:1},{year:2015,count:1,marks:2},
      {year:2016,count:1,marks:2},{year:2017,count:0,marks:0},{year:2018,count:1,marks:2},
      {year:2019,count:1,marks:2},{year:2020,count:0,marks:0},{year:2021,count:1,marks:1},
      {year:2022,count:1,marks:2},{year:2023,count:1,marks:1},{year:2024,count:0,marks:0},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:6, msq:1, nat:0},
  },

  // ── Control Systems (7 subtopics) ──
  {
    id: "ece-cs-tf",
    name: "Transfer Function & Block Diagrams",
    topic: "Control Systems",
    totalQuestions: 8, totalMarks: 12,
    yearlyData: [
      {year:2007,count:1,marks:2},{year:2008,count:1,marks:2},{year:2009,count:1,marks:1},
      {year:2010,count:0,marks:0},{year:2011,count:1,marks:2},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:2},{year:2014,count:0,marks:0},{year:2015,count:1,marks:2},
      {year:2016,count:1,marks:2},{year:2017,count:1,marks:1},{year:2018,count:1,marks:2},
      {year:2019,count:0,marks:0},{year:2020,count:1,marks:2},{year:2021,count:1,marks:2},
      {year:2022,count:1,marks:1},{year:2023,count:1,marks:2},{year:2024,count:0,marks:0},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:6, msq:1, nat:1},
  },
  {
    id: "ece-cs-timedomain",
    name: "Time Domain Analysis & Transient Response",
    topic: "Control Systems",
    totalQuestions: 7, totalMarks: 10,
    yearlyData: [
      {year:2007,count:1,marks:2},{year:2008,count:0,marks:0},{year:2009,count:1,marks:2},
      {year:2010,count:1,marks:2},{year:2011,count:1,marks:1},{year:2012,count:0,marks:0},
      {year:2013,count:1,marks:2},{year:2014,count:1,marks:2},{year:2015,count:0,marks:0},
      {year:2016,count:1,marks:2},{year:2017,count:1,marks:2},{year:2018,count:0,marks:0},
      {year:2019,count:1,marks:1},{year:2020,count:1,marks:2},{year:2021,count:1,marks:2},
      {year:2022,count:0,marks:0},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:1},{year:2026,count:0,marks:0},
    ],
    questionTypes: {mcq:5, msq:1, nat:1},
  },
  {
    id: "ece-cs-stability",
    name: "Stability Analysis (Routh-Hurwitz, Nyquist)",
    topic: "Control Systems",
    totalQuestions: 8, totalMarks: 12,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:1,marks:2},{year:2009,count:1,marks:2},
      {year:2010,count:1,marks:2},{year:2011,count:1,marks:2},{year:2012,count:1,marks:2},
      {year:2013,count:0,marks:0},{year:2014,count:1,marks:2},{year:2015,count:1,marks:2},
      {year:2016,count:1,marks:2},{year:2017,count:0,marks:0},{year:2018,count:1,marks:2},
      {year:2019,count:1,marks:2},{year:2020,count:1,marks:2},{year:2021,count:0,marks:0},
      {year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:1},
      {year:2025,count:1,marks:2},{year:2026,count:0,marks:0},
    ],
    questionTypes: {mcq:6, msq:1, nat:1},
  },
  {
    id: "ece-cs-rootlocus",
    name: "Root Locus & Frequency Response",
    topic: "Control Systems",
    totalQuestions: 7, totalMarks: 10,
    yearlyData: [
      {year:2007,count:1,marks:1},{year:2008,count:1,marks:2},{year:2009,count:1,marks:1},
      {year:2010,count:1,marks:2},{year:2011,count:0,marks:0},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:1},{year:2014,count:1,marks:2},{year:2015,count:1,marks:2},
      {year:2016,count:0,marks:0},{year:2017,count:1,marks:2},{year:2018,count:1,marks:1},
      {year:2019,count:1,marks:2},{year:2020,count:0,marks:0},{year:2021,count:1,marks:2},
      {year:2022,count:1,marks:2},{year:2023,count:0,marks:0},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:1},
    ],
    questionTypes: {mcq:5, msq:1, nat:1},
  },
  {
    id: "ece-cs-compensation",
    name: "Compensation (Lag, Lead, Lag-Lead)",
    topic: "Control Systems",
    totalQuestions: 6, totalMarks: 9,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:1,marks:2},{year:2009,count:0,marks:0},
      {year:2010,count:1,marks:2},{year:2011,count:1,marks:1},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:2},{year:2014,count:0,marks:0},{year:2015,count:1,marks:2},
      {year:2016,count:0,marks:0},{year:2017,count:1,marks:2},{year:2018,count:1,marks:1},
      {year:2019,count:0,marks:0},{year:2020,count:1,marks:2},{year:2021,count:1,marks:1},
      {year:2022,count:0,marks:0},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:0,marks:0},
    ],
    questionTypes: {mcq:5, msq:0, nat:1},
  },
  {
    id: "ece-cs-state",
    name: "State Variable Analysis",
    topic: "Control Systems",
    totalQuestions: 6, totalMarks: 7,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:0,marks:0},{year:2009,count:1,marks:1},
      {year:2010,count:0,marks:0},{year:2011,count:1,marks:1},{year:2012,count:0,marks:0},
      {year:2013,count:1,marks:1},{year:2014,count:1,marks:1},{year:2015,count:0,marks:0},
      {year:2016,count:1,marks:1},{year:2017,count:1,marks:1},{year:2018,count:1,marks:2},
      {year:2019,count:0,marks:0},{year:2020,count:1,marks:1},{year:2021,count:1,marks:1},
      {year:2022,count:1,marks:1},{year:2023,count:0,marks:0},{year:2024,count:1,marks:1},
      {year:2025,count:1,marks:1},{year:2026,count:1,marks:1},
    ],
    questionTypes: {mcq:5, msq:0, nat:1},
  },

  // ── Communications (8 subtopics) ──
  {
    id: "ece-comm-random",
    name: "Random Processes & Power Spectral Density",
    topic: "Communication Systems",
    totalQuestions: 8, totalMarks: 13,
    yearlyData: [
      {year:2007,count:1,marks:2},{year:2008,count:0,marks:0},{year:2009,count:1,marks:2},
      {year:2010,count:1,marks:2},{year:2011,count:1,marks:2},{year:2012,count:0,marks:0},
      {year:2013,count:1,marks:2},{year:2014,count:1,marks:2},{year:2015,count:1,marks:2},
      {year:2016,count:1,marks:2},{year:2017,count:0,marks:0},{year:2018,count:1,marks:2},
      {year:2019,count:1,marks:2},{year:2020,count:0,marks:0},{year:2021,count:1,marks:2},
      {year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:0,marks:0},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:5, msq:2, nat:1},
  },
  {
    id: "ece-comm-amfm",
    name: "AM & FM Modulation & Demodulation",
    topic: "Communication Systems",
    totalQuestions: 8, totalMarks: 12,
    yearlyData: [
      {year:2007,count:1,marks:2},{year:2008,count:1,marks:2},{year:2009,count:1,marks:1},
      {year:2010,count:0,marks:0},{year:2011,count:1,marks:2},{year:2012,count:1,marks:2},
      {year:2013,count:0,marks:0},{year:2014,count:1,marks:2},{year:2015,count:1,marks:2},
      {year:2016,count:1,marks:2},{year:2017,count:1,marks:1},{year:2018,count:0,marks:0},
      {year:2019,count:1,marks:2},{year:2020,count:1,marks:2},{year:2021,count:1,marks:2},
      {year:2022,count:0,marks:0},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:1},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:6, msq:1, nat:1},
  },
  {
    id: "ece-comm-digital-mod",
    name: "Digital Modulation (ASK, PSK, FSK, QAM)",
    topic: "Communication Systems",
    totalQuestions: 12, totalMarks: 17,
    yearlyData: [
      {year:2007,count:1,marks:2},{year:2008,count:1,marks:2},{year:2009,count:1,marks:2},
      {year:2010,count:1,marks:2},{year:2011,count:1,marks:2},{year:2012,count:1,marks:2},
      {year:2013,count:0,marks:0},{year:2014,count:1,marks:2},{year:2015,count:1,marks:2},
      {year:2016,count:1,marks:2},{year:2017,count:1,marks:2},{year:2018,count:1,marks:2},
      {year:2019,count:1,marks:2},{year:2020,count:1,marks:1},{year:2021,count:0,marks:0},
      {year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:8, msq:3, nat:1},
  },
  {
    id: "ece-comm-pcm",
    name: "PCM, DPCM & Digital Multiplexing",
    topic: "Communication Systems",
    totalQuestions: 7, totalMarks: 10,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:1,marks:2},{year:2009,count:1,marks:2},
      {year:2010,count:1,marks:2},{year:2011,count:0,marks:0},{year:2012,count:1,marks:1},
      {year:2013,count:1,marks:1},{year:2014,count:1,marks:1},{year:2015,count:0,marks:0},
      {year:2016,count:1,marks:2},{year:2017,count:1,marks:2},{year:2018,count:0,marks:0},
      {year:2019,count:1,marks:1},{year:2020,count:1,marks:2},{year:2021,count:1,marks:1},
      {year:2022,count:1,marks:2},{year:2023,count:0,marks:0},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:0,marks:0},
    ],
    questionTypes: {mcq:5, msq:1, nat:1},
  },
  {
    id: "ece-comm-infotheory",
    name: "Information Theory & Source Coding",
    topic: "Communication Systems",
    totalQuestions: 7, totalMarks: 10,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:1,marks:1},{year:2009,count:1,marks:2},
      {year:2010,count:1,marks:2},{year:2011,count:1,marks:1},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:1},{year:2014,count:0,marks:0},{year:2015,count:1,marks:2},
      {year:2016,count:0,marks:0},{year:2017,count:1,marks:2},{year:2018,count:1,marks:1},
      {year:2019,count:1,marks:2},{year:2020,count:1,marks:2},{year:2021,count:1,marks:1},
      {year:2022,count:0,marks:0},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:0,marks:0},
    ],
    questionTypes: {mcq:5, msq:1, nat:1},
  },
  {
    id: "ece-comm-probability",
    name: "Probability & Random Variables in Communication",
    topic: "Communication Systems",
    totalQuestions: 8, totalMarks: 13,
    yearlyData: [
      {year:2007,count:1,marks:2},{year:2008,count:1,marks:2},{year:2009,count:0,marks:0},
      {year:2010,count:1,marks:2},{year:2011,count:1,marks:2},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:2},{year:2014,count:1,marks:2},{year:2015,count:1,marks:2},
      {year:2016,count:0,marks:0},{year:2017,count:1,marks:2},{year:2018,count:1,marks:2},
      {year:2019,count:0,marks:0},{year:2020,count:1,marks:2},{year:2021,count:1,marks:2},
      {year:2022,count:1,marks:2},{year:2023,count:0,marks:0},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:5, msq:2, nat:1},
  },
  {
    id: "ece-comm-errors",
    name: "Error Correction (Hamming, CRC, Parity)",
    topic: "Communication Systems",
    totalQuestions: 8, totalMarks: 10,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:1,marks:1},{year:2009,count:1,marks:2},
      {year:2010,count:1,marks:1},{year:2011,count:0,marks:0},{year:2012,count:1,marks:1},
      {year:2013,count:1,marks:2},{year:2014,count:1,marks:1},{year:2015,count:1,marks:1},
      {year:2016,count:1,marks:2},{year:2017,count:1,marks:1},{year:2018,count:1,marks:2},
      {year:2019,count:1,marks:1},{year:2020,count:0,marks:0},{year:2021,count:1,marks:2},
      {year:2022,count:1,marks:1},{year:2023,count:1,marks:1},{year:2024,count:0,marks:0},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:1},
    ],
    questionTypes: {mcq:7, msq:0, nat:1},
  },

  // ── Electromagnetics (5 subtopics) ──
  {
    id: "ece-em-maxwell",
    name: "Maxwell's Equations & Wave Equation",
    topic: "Electromagnetics",
    totalQuestions: 8, totalMarks: 12,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:1,marks:2},{year:2009,count:1,marks:2},
      {year:2010,count:1,marks:2},{year:2011,count:0,marks:0},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:2},{year:2014,count:1,marks:2},{year:2015,count:1,marks:2},
      {year:2016,count:0,marks:0},{year:2017,count:1,marks:2},{year:2018,count:1,marks:2},
      {year:2019,count:1,marks:2},{year:2020,count:0,marks:0},{year:2021,count:1,marks:2},
      {year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:0,marks:0},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:6, msq:1, nat:1},
  },
  {
    id: "ece-em-plane-waves",
    name: "Plane Waves, Reflection & Polarization",
    topic: "Electromagnetics",
    totalQuestions: 7, totalMarks: 11,
    yearlyData: [
      {year:2007,count:1,marks:2},{year:2008,count:0,marks:0},{year:2009,count:1,marks:2},
      {year:2010,count:1,marks:2},{year:2011,count:1,marks:1},{year:2012,count:0,marks:0},
      {year:2013,count:1,marks:2},{year:2014,count:1,marks:2},{year:2015,count:0,marks:0},
      {year:2016,count:1,marks:2},{year:2017,count:1,marks:1},{year:2018,count:1,marks:2},
      {year:2019,count:1,marks:2},{year:2020,count:1,marks:1},{year:2021,count:0,marks:0},
      {year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:0,marks:0},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:5, msq:1, nat:1},
  },
  {
    id: "ece-em-transmission",
    name: "Transmission Lines & S-Parameters",
    topic: "Electromagnetics",
    totalQuestions: 8, totalMarks: 12,
    yearlyData: [
      {year:2007,count:1,marks:2},{year:2008,count:1,marks:2},{year:2009,count:1,marks:2},
      {year:2010,count:0,marks:0},{year:2011,count:1,marks:2},{year:2012,count:1,marks:2},
      {year:2013,count:0,marks:0},{year:2014,count:1,marks:2},{year:2015,count:1,marks:2},
      {year:2016,count:1,marks:2},{year:2017,count:1,marks:2},{year:2018,count:0,marks:0},
      {year:2019,count:1,marks:2},{year:2020,count:1,marks:2},{year:2021,count:1,marks:2},
      {year:2022,count:0,marks:0},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:0,marks:0},
    ],
    questionTypes: {mcq:6, msq:1, nat:1},
  },
  {
    id: "ece-em-waveguides",
    name: "Waveguides & Optical Fibers",
    topic: "Electromagnetics",
    totalQuestions: 7, totalMarks: 10,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:1,marks:2},{year:2009,count:0,marks:0},
      {year:2010,count:1,marks:2},{year:2011,count:1,marks:1},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:1},{year:2014,count:0,marks:0},{year:2015,count:1,marks:2},
      {year:2016,count:1,marks:2},{year:2017,count:0,marks:0},{year:2018,count:1,marks:2},
      {year:2019,count:1,marks:2},{year:2020,count:1,marks:1},{year:2021,count:0,marks:0},
      {year:2022,count:1,marks:2},{year:2023,count:1,marks:1},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:0,marks:0},
    ],
    questionTypes: {mcq:5, msq:1, nat:1},
  },
  {
    id: "ece-em-antennas",
    name: "Antennas & Radiation",
    topic: "Electromagnetics",
    totalQuestions: 8, totalMarks: 9,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:1,marks:1},{year:2009,count:1,marks:1},
      {year:2010,count:0,marks:0},{year:2011,count:1,marks:2},{year:2012,count:1,marks:1},
      {year:2013,count:1,marks:2},{year:2014,count:1,marks:1},{year:2015,count:1,marks:1},
      {year:2016,count:0,marks:0},{year:2017,count:1,marks:2},{year:2018,count:1,marks:1},
      {year:2019,count:1,marks:1},{year:2020,count:1,marks:2},{year:2021,count:1,marks:1},
      {year:2022,count:1,marks:1},{year:2023,count:0,marks:0},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:1},{year:2026,count:1,marks:1},
    ],
    questionTypes: {mcq:7, msq:0, nat:1},
  },
];

// ─── ECE yearly totals by subject ───
export const ECE_YEARLY_TOTALS: { year: number; totalMarks: number; totalQuestions: number }[] = ECE_AVAILABLE_YEARS.map((year) => {
  const yearData = ECE_RAW_DATA.map((s) => {
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
export interface EcePaperSummary {
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
    avgMarksPerYear: number;
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

export const GATE_ECE_SUMMARY: EcePaperSummary = {
  paperId: "gate-ece",
  paperName: "Electronics and Communication Engineering",
  dataVersion: "2026-08-26-v1",
  totalQuestions: ECE_RAW_DATA.reduce((s, d) => s + d.totalQuestions, 0),
  totalMarks: ECE_RAW_DATA.reduce((s, d) => s + d.totalMarks, 0),
  yearsCovered: ECE_AVAILABLE_YEARS,
  paperCount: ECE_AVAILABLE_YEARS.length,
  subjectBreakdown: ECE_RAW_DATA.map((s) => ({
    id: s.id,
    name: s.name,
    totalQuestions: s.totalQuestions,
    totalMarks: s.totalMarks,
    avgMarksPerYear: Math.round((s.totalMarks / ECE_AVAILABLE_YEARS.length) * 10) / 10,
  })),
  overallMarksByYear: ECE_YEARLY_TOTALS.map((y) => ({ year: y.year, totalMarks: y.totalMarks })),
  avgMarksPerPaper: Math.round(
    (ECE_RAW_DATA.reduce((s, d) => s + d.totalMarks, 0) / ECE_AVAILABLE_YEARS.length) * 10
  ) / 10,
  questionTypeBreakdown: [
    { type: "MCQ", count: 282, marks: 409, percentage: 54 },
    { type: "MSQ", count: 100, marks: 149, percentage: 19 },
    { type: "NAT", count: 79,  marks: 139, percentage: 27 },
  ],
};

export const ECE_DIFFICULTY_DISTRIBUTION = {
  easy: 30,
  medium: 45,
  hard: 25,
} as const;
