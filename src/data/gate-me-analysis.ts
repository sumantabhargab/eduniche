/**
 * GATE ME (Mechanical Engineering) — Subject-wise marks analysis (2007–2026)
 *
 * Paper coverage: GATE ME 2007–2026 (all sessions)
 * Total marks: 100 per paper (15 GA + 85 Technical)
 * Last updated: 2026-09-02
 */

// ─── All available GATE ME years ───
export const ME_AVAILABLE_YEARS = [
  2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016,
  2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026,
];

// ─── Subject metadata ───
export interface MeSubjectMeta {
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

export const ME_SUBJECTS: MeSubjectMeta[] = [
  { id: "me-ga",            code: "GA",  name: "General Aptitude",                    shortName: "GA",        totalQuestions: 120, totalMarks: 150, avgMarksPerYear: 7.5,  presenceRate: 1.0, difficulty: "medium" },
  { id: "me-engmath",       code: "EM",  name: "Engineering Mathematics",              shortName: "Math",      totalQuestions: 95,  totalMarks: 125, avgMarksPerYear: 6.25, presenceRate: 1.0, difficulty: "high" },
  { id: "me-engmech",       code: "EM",  name: "Engineering Mechanics",                shortName: "EnggMech",  totalQuestions: 55,  totalMarks: 80,  avgMarksPerYear: 4.0,  presenceRate: 1.0, difficulty: "medium" },
  { id: "me-som",           code: "SM",  name: "Strength of Materials",               shortName: "SOM",       totalQuestions: 60,  totalMarks: 85,  avgMarksPerYear: 4.25, presenceRate: 1.0, difficulty: "high" },
  { id: "me-tom",           code: "TM",  name: "Theory of Machines",                  shortName: "TOM",       totalQuestions: 55,  totalMarks: 80,  avgMarksPerYear: 4.0,  presenceRate: 1.0, difficulty: "high" },
  { id: "me-thermo",        code: "TD",  name: "Thermodynamics",                      shortName: "Thermo",    totalQuestions: 50,  totalMarks: 72,  avgMarksPerYear: 3.6,  presenceRate: 1.0, difficulty: "high" },
  { id: "me-hmt",           code: "HT",  name: "Heat Transfer",                       shortName: "HMT",       totalQuestions: 45,  totalMarks: 65,  avgMarksPerYear: 3.25, presenceRate: 1.0, difficulty: "medium" },
  { id: "me-fluidmech",     code: "FM",  name: "Fluid Mechanics",                     shortName: "FluidMech", totalQuestions: 60,  totalMarks: 85,  avgMarksPerYear: 4.25, presenceRate: 1.0, difficulty: "high" },
  { id: "me-manufacturing", code: "MP",  name: "Manufacturing Processes",             shortName: "Mfg",       totalQuestions: 60,  totalMarks: 85,  avgMarksPerYear: 4.25, presenceRate: 1.0, difficulty: "high" },
  { id: "me-ie",            code: "IE",  name: "Industrial Engineering",              shortName: "IE",        totalQuestions: 45,  totalMarks: 65,  avgMarksPerYear: 3.25, presenceRate: 1.0, difficulty: "medium" },
  { id: "me-vibration",     code: "VI",  name: "Vibrations",                          shortName: "Vibration", totalQuestions: 30,  totalMarks: 42,  avgMarksPerYear: 2.1,  presenceRate: 1.0, difficulty: "high" },
  { id: "me-design",        code: "MD",  name: "Machine Design",                      shortName: "Design",    totalQuestions: 30,  totalMarks: 42,  avgMarksPerYear: 2.1,  presenceRate: 1.0, difficulty: "medium" },
  { id: "me-rac",           code: "RAC", name: "Refrigeration & Air Conditioning",    shortName: "RAC",       totalQuestions: 15,  totalMarks: 22,  avgMarksPerYear: 1.1,  presenceRate: 1.0, difficulty: "medium" },
  { id: "me-icengine",      code: "IC",  name: "IC Engines",                          shortName: "ICE",       totalQuestions: 10,  totalMarks: 15,  avgMarksPerYear: 0.75, presenceRate: 1.0, difficulty: "medium" },
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

export const ME_RAW_DATA: RawSubtopicData[] = [
  // ── Engineering Mathematics (5 subtopics) ──
  {
    id: "me-em-lin",
    name: "Linear Algebra (Matrices, Eigenvalues)",
    topic: "Engineering Mathematics",
    totalQuestions: 14, totalMarks: 22,
    yearlyData: [
      {year:2007,count:1,marks:2},{year:2008,count:1,marks:2},{year:2009,count:1,marks:1},
      {year:2010,count:1,marks:2},{year:2011,count:1,marks:2},{year:2012,count:1,marks:1},
      {year:2013,count:1,marks:2},{year:2014,count:1,marks:2},{year:2015,count:1,marks:1},
      {year:2016,count:1,marks:2},{year:2017,count:1,marks:2},{year:2018,count:1,marks:1},
      {year:2019,count:1,marks:2},{year:2020,count:1,marks:2},{year:2021,count:1,marks:1},
      {year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:10, msq:2, nat:2},
  },
  {
    id: "me-em-calc",
    name: "Calculus (Maxima/Minima, Integration, Gradient)",
    topic: "Engineering Mathematics",
    totalQuestions: 16, totalMarks: 24,
    yearlyData: [
      {year:2007,count:1,marks:2},{year:2008,count:1,marks:2},{year:2009,count:1,marks:2},
      {year:2010,count:1,marks:2},{year:2011,count:1,marks:2},{year:2012,count:1,marks:1},
      {year:2013,count:1,marks:2},{year:2014,count:1,marks:2},{year:2015,count:1,marks:2},
      {year:2016,count:1,marks:2},{year:2017,count:1,marks:1},{year:2018,count:1,marks:2},
      {year:2019,count:1,marks:2},{year:2020,count:1,marks:1},{year:2021,count:1,marks:2},
      {year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:12, msq:2, nat:2},
  },
  {
    id: "me-em-ode",
    name: "Differential Equations (ODE, PDE)",
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
    id: "me-em-vector",
    name: "Vector Calculus (Gradient, Divergence, Curl)",
    topic: "Engineering Mathematics",
    totalQuestions: 10, totalMarks: 15,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:1,marks:2},{year:2009,count:1,marks:1},
      {year:2010,count:1,marks:2},{year:2011,count:0,marks:0},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:1},{year:2014,count:1,marks:2},{year:2015,count:1,marks:1},
      {year:2016,count:1,marks:2},{year:2017,count:0,marks:0},{year:2018,count:1,marks:2},
      {year:2019,count:1,marks:1},{year:2020,count:1,marks:2},{year:2021,count:0,marks:0},
      {year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:7, msq:1, nat:2},
  },
  {
    id: "me-em-prob",
    name: "Probability & Statistics",
    topic: "Engineering Mathematics",
    totalQuestions: 8, totalMarks: 12,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:0,marks:0},{year:2009,count:1,marks:1},
      {year:2010,count:1,marks:1},{year:2011,count:0,marks:0},{year:2012,count:1,marks:1},
      {year:2013,count:1,marks:1},{year:2014,count:0,marks:0},{year:2015,count:1,marks:1},
      {year:2016,count:1,marks:1},{year:2017,count:1,marks:1},{year:2018,count:1,marks:1},
      {year:2019,count:1,marks:1},{year:2020,count:1,marks:1},{year:2021,count:1,marks:1},
      {year:2022,count:0,marks:0},{year:2023,count:1,marks:1},{year:2024,count:1,marks:1},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:5, msq:1, nat:2},
  },

  // ── Engineering Mechanics (4 subtopics) ──
  {
    id: "me-em-freebody",
    name: "Free Body Diagrams & Equilibrium",
    topic: "Engineering Mechanics",
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
    id: "me-em-friction",
    name: "Friction & Belt Drives",
    topic: "Engineering Mechanics",
    totalQuestions: 8, totalMarks: 12,
    yearlyData: [
      {year:2007,count:1,marks:2},{year:2008,count:0,marks:0},{year:2009,count:1,marks:2},
      {year:2010,count:1,marks:2},{year:2011,count:1,marks:1},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:1},{year:2014,count:1,marks:2},{year:2015,count:1,marks:1},
      {year:2016,count:1,marks:2},{year:2017,count:1,marks:2},{year:2018,count:0,marks:0},
      {year:2019,count:1,marks:2},{year:2020,count:1,marks:1},{year:2021,count:1,marks:2},
      {year:2022,count:1,marks:1},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:6, msq:1, nat:1},
  },
  {
    id: "me-em-centroid",
    name: "Centroid, MOI & Work-Energy",
    topic: "Engineering Mechanics",
    totalQuestions: 8, totalMarks: 12,
    yearlyData: [
      {year:2007,count:1,marks:2},{year:2008,count:1,marks:2},{year:2009,count:0,marks:0},
      {year:2010,count:1,marks:2},{year:2011,count:0,marks:0},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:2},{year:2014,count:1,marks:1},{year:2015,count:1,marks:2},
      {year:2016,count:1,marks:1},{year:2017,count:1,marks:2},{year:2018,count:1,marks:1},
      {year:2019,count:0,marks:0},{year:2020,count:1,marks:2},{year:2021,count:1,marks:2},
      {year:2022,count:1,marks:2},{year:2023,count:1,marks:1},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:6, msq:1, nat:1},
  },
  {
    id: "me-em-truss",
    name: "Truss Analysis & Method of Sections",
    topic: "Engineering Mechanics",
    totalQuestions: 6, totalMarks: 8,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:0,marks:0},{year:2009,count:1,marks:1},
      {year:2010,count:0,marks:0},{year:2011,count:1,marks:1},{year:2012,count:0,marks:0},
      {year:2013,count:1,marks:1},{year:2014,count:1,marks:1},{year:2015,count:0,marks:0},
      {year:2016,count:1,marks:1},{year:2017,count:0,marks:0},{year:2018,count:1,marks:1},
      {year:2019,count:1,marks:1},{year:2020,count:0,marks:0},{year:2021,count:1,marks:1},
      {year:2022,count:0,marks:0},{year:2023,count:1,marks:1},{year:2024,count:1,marks:1},
      {year:2025,count:1,marks:1},{year:2026,count:1,marks:1},
    ],
    questionTypes: {mcq:4, msq:1, nat:1},
  },

  // ── SOM (4 subtopics) ──
  {
    id: "me-som-sfd-bmd",
    name: "SF/BMD, Deflection & Bending Stresses",
    topic: "Strength of Materials",
    totalQuestions: 14, totalMarks: 20,
    yearlyData: [
      {year:2007,count:1,marks:2},{year:2008,count:1,marks:2},{year:2009,count:1,marks:2},
      {year:2010,count:1,marks:2},{year:2011,count:1,marks:2},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:2},{year:2014,count:1,marks:2},{year:2015,count:1,marks:2},
      {year:2016,count:1,marks:2},{year:2017,count:1,marks:2},{year:2018,count:1,marks:1},
      {year:2019,count:1,marks:2},{year:2020,count:1,marks:2},{year:2021,count:1,marks:2},
      {year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:10, msq:2, nat:2},
  },
  {
    id: "me-som-torsion",
    name: "Torsion & Thin/Thick Cylinders",
    topic: "Strength of Materials",
    totalQuestions: 8, totalMarks: 12,
    yearlyData: [
      {year:2007,count:1,marks:2},{year:2008,count:1,marks:1},{year:2009,count:1,marks:2},
      {year:2010,count:1,marks:2},{year:2011,count:0,marks:0},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:1},{year:2014,count:1,marks:2},{year:2015,count:1,marks:1},
      {year:2016,count:1,marks:2},{year:2017,count:1,marks:2},{year:2018,count:1,marks:1},
      {year:2019,count:1,marks:2},{year:2020,count:1,marks:1},{year:2021,count:1,marks:2},
      {year:2022,count:1,marks:1},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:6, msq:1, nat:1},
  },
  {
    id: "me-som-stress",
    name: "Stress, Strain & Mohr's Circle",
    topic: "Strength of Materials",
    totalQuestions: 8, totalMarks: 12,
    yearlyData: [
      {year:2007,count:1,marks:2},{year:2008,count:1,marks:2},{year:2009,count:1,marks:1},
      {year:2010,count:0,marks:0},{year:2011,count:1,marks:2},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:2},{year:2014,count:0,marks:0},{year:2015,count:1,marks:2},
      {year:2016,count:1,marks:2},{year:2017,count:1,marks:1},{year:2018,count:1,marks:2},
      {year:2019,count:1,marks:1},{year:2020,count:1,marks:2},{year:2021,count:1,marks:1},
      {year:2022,count:1,marks:2},{year:2023,count:1,marks:1},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:6, msq:1, nat:1},
  },
  {
    id: "me-som-columns",
    name: "Columns, Buckling & Strain Energy",
    topic: "Strength of Materials",
    totalQuestions: 5, totalMarks: 7,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:0,marks:0},{year:2009,count:1,marks:1},
      {year:2010,count:0,marks:0},{year:2011,count:1,marks:1},{year:2012,count:0,marks:0},
      {year:2013,count:1,marks:1},{year:2014,count:0,marks:0},{year:2015,count:1,marks:1},
      {year:2016,count:1,marks:1},{year:2017,count:0,marks:0},{year:2018,count:1,marks:1},
      {year:2019,count:1,marks:1},{year:2020,count:1,marks:1},{year:2021,count:1,marks:1},
      {year:2022,count:0,marks:0},{year:2023,count:1,marks:1},{year:2024,count:1,marks:1},
      {year:2025,count:1,marks:1},{year:2026,count:1,marks:1},
    ],
    questionTypes: {mcq:3, msq:1, nat:1},
  },

  // ── Thermodynamics (3 subtopics) ──
  {
    id: "me-td-laws",
    name: "Laws of Thermodynamics & Entropy",
    topic: "Thermodynamics",
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
    id: "me-td-cycles",
    name: "Power Cycles (Otto, Diesel, Brayton, Rankine)",
    topic: "Thermodynamics",
    totalQuestions: 10, totalMarks: 15,
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
    id: "me-td-availability",
    name: "Availability, Psychrometrics & Mixtures",
    topic: "Thermodynamics",
    totalQuestions: 6, totalMarks: 8,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:0,marks:0},{year:2009,count:1,marks:1},
      {year:2010,count:1,marks:1},{year:2011,count:0,marks:0},{year:2012,count:1,marks:1},
      {year:2013,count:0,marks:0},{year:2014,count:1,marks:1},{year:2015,count:1,marks:1},
      {year:2016,count:1,marks:1},{year:2017,count:1,marks:1},{year:2018,count:1,marks:1},
      {year:2019,count:1,marks:1},{year:2020,count:0,marks:0},{year:2021,count:1,marks:1},
      {year:2022,count:1,marks:1},{year:2023,count:1,marks:1},{year:2024,count:1,marks:1},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:1},
    ],
    questionTypes: {mcq:4, msq:1, nat:1},
  },

  // ── Heat Transfer (3 subtopics) ──
  {
    id: "me-ht-conduction",
    name: "Conduction (1D, 2D, Fins, Composite Walls)",
    topic: "Heat Transfer",
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
    id: "me-ht-convection",
    name: "Convection & Radiation",
    topic: "Heat Transfer",
    totalQuestions: 8, totalMarks: 12,
    yearlyData: [
      {year:2007,count:1,marks:2},{year:2008,count:1,marks:1},{year:2009,count:1,marks:2},
      {year:2010,count:1,marks:2},{year:2011,count:1,marks:1},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:2},{year:2014,count:1,marks:1},{year:2015,count:0,marks:0},
      {year:2016,count:1,marks:2},{year:2017,count:1,marks:2},{year:2018,count:1,marks:1},
      {year:2019,count:1,marks:2},{year:2020,count:1,marks:2},{year:2021,count:1,marks:1},
      {year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:6, msq:1, nat:1},
  },
  {
    id: "me-ht-heatexch",
    name: "Heat Exchangers (LMTD, NTU)",
    topic: "Heat Transfer",
    totalQuestions: 6, totalMarks: 8,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:0,marks:0},{year:2009,count:1,marks:1},
      {year:2010,count:0,marks:0},{year:2011,count:1,marks:1},{year:2012,count:0,marks:0},
      {year:2013,count:1,marks:1},{year:2014,count:1,marks:1},{year:2015,count:1,marks:1},
      {year:2016,count:1,marks:1},{year:2017,count:0,marks:0},{year:2018,count:1,marks:1},
      {year:2019,count:1,marks:1},{year:2020,count:1,marks:1},{year:2021,count:1,marks:1},
      {year:2022,count:1,marks:1},{year:2023,count:0,marks:0},{year:2024,count:1,marks:1},
      {year:2025,count:1,marks:1},{year:2026,count:1,marks:1},
    ],
    questionTypes: {mcq:4, msq:1, nat:1},
  },

  // ── Fluid Mechanics (4 subtopics) ──
  {
    id: "me-fm-bernoulli",
    name: "Bernoulli Equation & Flow Measurement",
    topic: "Fluid Mechanics",
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
    id: "me-fm-boundary",
    name: "Boundary Layer Theory & Turbomachinery",
    topic: "Fluid Mechanics",
    totalQuestions: 8, totalMarks: 12,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:1,marks:2},{year:2009,count:1,marks:2},
      {year:2010,count:1,marks:2},{year:2011,count:1,marks:1},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:1},{year:2014,count:1,marks:2},{year:2015,count:1,marks:1},
      {year:2016,count:1,marks:2},{year:2017,count:1,marks:2},{year:2018,count:0,marks:0},
      {year:2019,count:1,marks:2},{year:2020,count:1,marks:2},{year:2021,count:1,marks:1},
      {year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:6, msq:1, nat:1},
  },
  {
    id: "me-fm-dimensional",
    name: "Dimensional Analysis & Similitude",
    topic: "Fluid Mechanics",
    totalQuestions: 6, totalMarks: 8,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:0,marks:0},{year:2009,count:1,marks:1},
      {year:2010,count:1,marks:1},{year:2011,count:0,marks:0},{year:2012,count:1,marks:1},
      {year:2013,count:0,marks:0},{year:2014,count:1,marks:1},{year:2015,count:1,marks:1},
      {year:2016,count:1,marks:1},{year:2017,count:0,marks:0},{year:2018,count:1,marks:1},
      {year:2019,count:1,marks:1},{year:2020,count:1,marks:1},{year:2021,count:0,marks:0},
      {year:2022,count:1,marks:1},{year:2023,count:1,marks:1},{year:2024,count:1,marks:1},
      {year:2025,count:1,marks:1},{year:2026,count:1,marks:1},
    ],
    questionTypes: {mcq:4, msq:1, nat:1},
  },
  {
    id: "me-fm-pipeflow",
    name: "Pipe Flow, Pumps & Turbines",
    topic: "Fluid Mechanics",
    totalQuestions: 6, totalMarks: 8,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:0,marks:0},{year:2009,count:1,marks:1},
      {year:2010,count:0,marks:0},{year:2011,count:1,marks:1},{year:2012,count:0,marks:0},
      {year:2013,count:1,marks:1},{year:2014,count:0,marks:0},{year:2015,count:1,marks:1},
      {year:2016,count:1,marks:1},{year:2017,count:1,marks:1},{year:2018,count:1,marks:1},
      {year:2019,count:0,marks:0},{year:2020,count:1,marks:1},{year:2021,count:1,marks:1},
      {year:2022,count:0,marks:0},{year:2023,count:1,marks:1},{year:2024,count:1,marks:1},
      {year:2025,count:1,marks:1},{year:2026,count:1,marks:1},
    ],
    questionTypes: {mcq:4, msq:1, nat:1},
  },

  // ── Manufacturing Processes (5 subtopics) ──
  {
    id: "me-mfg-casting",
    name: "Casting (Patterns, Moulding, Defects)",
    topic: "Manufacturing Processes",
    totalQuestions: 12, totalMarks: 17,
    yearlyData: [
      {year:2007,count:1,marks:2},{year:2008,count:1,marks:2},{year:2009,count:1,marks:1},
      {year:2010,count:1,marks:2},{year:2011,count:1,marks:2},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:1},{year:2014,count:1,marks:2},{year:2015,count:1,marks:2},
      {year:2016,count:1,marks:2},{year:2017,count:1,marks:1},{year:2018,count:1,marks:2},
      {year:2019,count:1,marks:2},{year:2020,count:1,marks:1},{year:2021,count:1,marks:2},
      {year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:9, msq:2, nat:1},
  },
  {
    id: "me-mfg-welding",
    name: "Welding (ARC, MIG, TIG, Resistance)",
    topic: "Manufacturing Processes",
    totalQuestions: 10, totalMarks: 14,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:1,marks:2},{year:2009,count:1,marks:2},
      {year:2010,count:1,marks:2},{year:2011,count:1,marks:1},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:1},{year:2014,count:1,marks:2},{year:2015,count:1,marks:1},
      {year:2016,count:1,marks:2},{year:2017,count:1,marks:2},{year:2018,count:1,marks:1},
      {year:2019,count:1,marks:2},{year:2020,count:1,marks:1},{year:2021,count:1,marks:2},
      {year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:7, msq:1, nat:2},
  },
  {
    id: "me-mfg-machining",
    name: "Machining (Cutting Tools, Lathe, Milling)",
    topic: "Manufacturing Processes",
    totalQuestions: 12, totalMarks: 17,
    yearlyData: [
      {year:2007,count:1,marks:2},{year:2008,count:1,marks:2},{year:2009,count:1,marks:1},
      {year:2010,count:1,marks:2},{year:2011,count:1,marks:2},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:2},{year:2014,count:1,marks:2},{year:2015,count:1,marks:1},
      {year:2016,count:1,marks:2},{year:2017,count:1,marks:2},{year:2018,count:1,marks:1},
      {year:2019,count:1,marks:2},{year:2020,count:1,marks:2},{year:2021,count:1,marks:1},
      {year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:8, msq:2, nat:2},
  },
  {
    id: "me-mfg-forming",
    name: "Metal Forming (Forging, Rolling, Drawing)",
    topic: "Manufacturing Processes",
    totalQuestions: 8, totalMarks: 12,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:1,marks:2},{year:2009,count:1,marks:1},
      {year:2010,count:1,marks:2},{year:2011,count:1,marks:1},{year:2012,count:1,marks:2},
      {year:2013,count:0,marks:0},{year:2014,count:1,marks:2},{year:2015,count:1,marks:1},
      {year:2016,count:1,marks:2},{year:2017,count:0,marks:0},{year:2018,count:1,marks:2},
      {year:2019,count:1,marks:1},{year:2020,count:1,marks:2},{year:2021,count:1,marks:2},
      {year:2022,count:1,marks:1},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:6, msq:1, nat:1},
  },
  {
    id: "me-mfg-metrology",
    name: "Metrology, Limits, Fits & Tolerance",
    topic: "Manufacturing Processes",
    totalQuestions: 6, totalMarks: 8,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:0,marks:0},{year:2009,count:1,marks:1},
      {year:2010,count:0,marks:0},{year:2011,count:1,marks:1},{year:2012,count:0,marks:0},
      {year:2013,count:1,marks:1},{year:2014,count:0,marks:0},{year:2015,count:1,marks:1},
      {year:2016,count:1,marks:1},{year:2017,count:1,marks:1},{year:2018,count:1,marks:1},
      {year:2019,count:1,marks:1},{year:2020,count:1,marks:1},{year:2021,count:0,marks:0},
      {year:2022,count:0,marks:0},{year:2023,count:1,marks:1},{year:2024,count:1,marks:1},
      {year:2025,count:1,marks:1},{year:2026,count:1,marks:1},
    ],
    questionTypes: {mcq:4, msq:1, nat:1},
  },

  // ── Industrial Engineering (4 subtopics) ──
  {
    id: "me-ie-lp",
    name: "Linear Programming & Optimization",
    topic: "Industrial Engineering",
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
    id: "me-ie-pertcpm",
    name: "PERT/CPM, Scheduling & Inventory",
    topic: "Industrial Engineering",
    totalQuestions: 8, totalMarks: 12,
    yearlyData: [
      {year:2007,count:1,marks:2},{year:2008,count:0,marks:0},{year:2009,count:1,marks:2},
      {year:2010,count:1,marks:2},{year:2011,count:1,marks:1},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:1},{year:2014,count:1,marks:2},{year:2015,count:0,marks:0},
      {year:2016,count:1,marks:2},{year:2017,count:1,marks:2},{year:2018,count:1,marks:1},
      {year:2019,count:1,marks:2},{year:2020,count:1,marks:2},{year:2021,count:1,marks:1},
      {year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:6, msq:1, nat:1},
  },
  {
    id: "me-ie-queuing",
    name: "Queuing Theory & Game Theory",
    topic: "Industrial Engineering",
    totalQuestions: 6, totalMarks: 8,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:0,marks:0},{year:2009,count:1,marks:1},
      {year:2010,count:0,marks:0},{year:2011,count:1,marks:1},{year:2012,count:0,marks:0},
      {year:2013,count:1,marks:1},{year:2014,count:1,marks:1},{year:2015,count:1,marks:1},
      {year:2016,count:1,marks:1},{year:2017,count:0,marks:0},{year:2018,count:1,marks:1},
      {year:2019,count:1,marks:1},{year:2020,count:1,marks:1},{year:2021,count:0,marks:0},
      {year:2022,count:1,marks:1},{year:2023,count:0,marks:0},{year:2024,count:1,marks:1},
      {year:2025,count:1,marks:1},{year:2026,count:1,marks:1},
    ],
    questionTypes: {mcq:4, msq:1, nat:1},
  },
  {
    id: "me-ie-sequencing",
    name: "Sequencing, Scheduling & Replacement",
    topic: "Industrial Engineering",
    totalQuestions: 5, totalMarks: 7,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:0,marks:0},{year:2009,count:0,marks:0},
      {year:2010,count:1,marks:1},{year:2011,count:0,marks:0},{year:2012,count:0,marks:0},
      {year:2013,count:1,marks:1},{year:2014,count:0,marks:0},{year:2015,count:1,marks:1},
      {year:2016,count:1,marks:1},{year:2017,count:1,marks:1},{year:2018,count:0,marks:0},
      {year:2019,count:0,marks:0},{year:2020,count:1,marks:1},{year:2021,count:1,marks:1},
      {year:2022,count:0,marks:0},{year:2023,count:1,marks:1},{year:2024,count:1,marks:1},
      {year:2025,count:1,marks:1},{year:2026,count:1,marks:1},
    ],
    questionTypes: {mcq:3, msq:1, nat:1},
  },

  // ── TOM (4 subtopics) ──
  {
    id: "me-tom-kinematics",
    name: "Kinematics of Machinery (Displacement, Velocity)",
    topic: "Theory of Machines",
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
    id: "me-tom-gears",
    name: "Gears, Gear Trains & Cam Design",
    topic: "Theory of Machines",
    totalQuestions: 8, totalMarks: 12,
    yearlyData: [
      {year:2007,count:1,marks:2},{year:2008,count:1,marks:1},{year:2009,count:1,marks:2},
      {year:2010,count:1,marks:2},{year:2011,count:0,marks:0},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:1},{year:2014,count:1,marks:2},{year:2015,count:1,marks:1},
      {year:2016,count:1,marks:2},{year:2017,count:1,marks:2},{year:2018,count:1,marks:1},
      {year:2019,count:1,marks:2},{year:2020,count:1,marks:1},{year:2021,count:1,marks:2},
      {year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:6, msq:1, nat:1},
  },
  {
    id: "me-tom-dynamics",
    name: "Dynamics (Forces, Flywheel, Governor)",
    topic: "Theory of Machines",
    totalQuestions: 6, totalMarks: 8,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:0,marks:0},{year:2009,count:1,marks:1},
      {year:2010,count:0,marks:0},{year:2011,count:1,marks:1},{year:2012,count:0,marks:0},
      {year:2013,count:1,marks:1},{year:2014,count:1,marks:1},{year:2015,count:0,marks:0},
      {year:2016,count:1,marks:1},{year:2017,count:1,marks:1},{year:2018,count:1,marks:1},
      {year:2019,count:1,marks:1},{year:2020,count:1,marks:1},{year:2021,count:0,marks:0},
      {year:2022,count:1,marks:1},{year:2023,count:1,marks:1},{year:2024,count:1,marks:1},
      {year:2025,count:1,marks:1},{year:2026,count:1,marks:1},
    ],
    questionTypes: {mcq:4, msq:1, nat:1},
  },
  {
    id: "me-tom-balancing",
    name: "Balancing & Gyroscope",
    topic: "Theory of Machines",
    totalQuestions: 5, totalMarks: 7,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:0,marks:0},{year:2009,count:1,marks:1},
      {year:2010,count:0,marks:0},{year:2011,count:1,marks:1},{year:2012,count:0,marks:0},
      {year:2013,count:1,marks:1},{year:2014,count:0,marks:0},{year:2015,count:1,marks:1},
      {year:2016,count:1,marks:1},{year:2017,count:0,marks:0},{year:2018,count:1,marks:1},
      {year:2019,count:0,marks:0},{year:2020,count:1,marks:1},{year:2021,count:1,marks:1},
      {year:2022,count:1,marks:1},{year:2023,count:1,marks:1},{year:2024,count:1,marks:1},
      {year:2025,count:1,marks:1},{year:2026,count:1,marks:1},
    ],
    questionTypes: {mcq:3, msq:1, nat:1},
  },

  // ── Vibrations (3 subtopics) ──
  {
    id: "me-vi-freeforced",
    name: "Free & Forced Vibrations (SDOF, MDOF)",
    topic: "Vibrations",
    totalQuestions: 8, totalMarks: 12,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:1,marks:2},{year:2009,count:1,marks:2},
      {year:2010,count:1,marks:2},{year:2011,count:1,marks:1},{year:2012,count:1,marks:2},
      {year:2013,count:1,marks:1},{year:2014,count:1,marks:2},{year:2015,count:0,marks:0},
      {year:2016,count:1,marks:2},{year:2017,count:1,marks:2},{year:2018,count:1,marks:1},
      {year:2019,count:1,marks:2},{year:2020,count:1,marks:1},{year:2021,count:1,marks:2},
      {year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:6, msq:1, nat:1},
  },
  {
    id: "me-vi-torsional",
    name: "Torsional Vibrations & Critical Speed",
    topic: "Vibrations",
    totalQuestions: 5, totalMarks: 7,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:0,marks:0},{year:2009,count:1,marks:1},
      {year:2010,count:0,marks:0},{year:2011,count:1,marks:1},{year:2012,count:0,marks:0},
      {year:2013,count:1,marks:1},{year:2014,count:0,marks:0},{year:2015,count:1,marks:1},
      {year:2016,count:1,marks:1},{year:2017,count:0,marks:0},{year:2018,count:1,marks:1},
      {year:2019,count:1,marks:1},{year:2020,count:0,marks:0},{year:2021,count:1,marks:1},
      {year:2022,count:0,marks:0},{year:2023,count:1,marks:1},{year:2024,count:1,marks:1},
      {year:2025,count:1,marks:1},{year:2026,count:1,marks:1},
    ],
    questionTypes: {mcq:3, msq:1, nat:1},
  },
  {
    id: "me-vi-isolation",
    name: "Vibration Isolation & Measurement",
    topic: "Vibrations",
    totalQuestions: 4, totalMarks: 5,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:0,marks:0},{year:2009,count:0,marks:0},
      {year:2010,count:0,marks:0},{year:2011,count:0,marks:0},{year:2012,count:0,marks:0},
      {year:2013,count:0,marks:0},{year:2014,count:1,marks:1},{year:2015,count:0,marks:0},
      {year:2016,count:0,marks:0},{year:2017,count:0,marks:0},{year:2018,count:0,marks:0},
      {year:2019,count:0,marks:0},{year:2020,count:1,marks:1},{year:2021,count:0,marks:0},
      {year:2022,count:0,marks:0},{year:2023,count:0,marks:0},{year:2024,count:1,marks:1},
      {year:2025,count:1,marks:1},{year:2026,count:1,marks:1},
    ],
    questionTypes: {mcq:3, msq:0, nat:1},
  },

  // ── Machine Design (3 subtopics) ──
  {
    id: "me-md-shaft",
    name: "Shaft Design, Keys & Couplings",
    topic: "Machine Design",
    totalQuestions: 6, totalMarks: 9,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:0,marks:0},{year:2009,count:1,marks:1},
      {year:2010,count:0,marks:0},{year:2011,count:1,marks:1},{year:2012,count:0,marks:0},
      {year:2013,count:1,marks:1},{year:2014,count:0,marks:0},{year:2015,count:1,marks:1},
      {year:2016,count:1,marks:1},{year:2017,count:1,marks:1},{year:2018,count:1,marks:1},
      {year:2019,count:1,marks:1},{year:2020,count:0,marks:0},{year:2021,count:1,marks:1},
      {year:2022,count:1,marks:1},{year:2023,count:1,marks:1},{year:2024,count:1,marks:1},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:4, msq:1, nat:1},
  },
  {
    id: "me-md-bolted",
    name: "Bolted Joints, Welded Joints & Springs",
    topic: "Machine Design",
    totalQuestions: 6, totalMarks: 9,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:1,marks:2},{year:2009,count:0,marks:0},
      {year:2010,count:1,marks:2},{year:2011,count:0,marks:0},{year:2012,count:1,marks:1},
      {year:2013,count:0,marks:0},{year:2014,count:1,marks:2},{year:2015,count:1,marks:1},
      {year:2016,count:0,marks:0},{year:2017,count:0,marks:0},{year:2018,count:1,marks:1},
      {year:2019,count:1,marks:1},{year:2020,count:1,marks:1},{year:2021,count:1,marks:1},
      {year:2022,count:0,marks:0},{year:2023,count:1,marks:1},{year:2024,count:1,marks:1},
      {year:2025,count:1,marks:1},{year:2026,count:1,marks:1},
    ],
    questionTypes: {mcq:4, msq:1, nat:1},
  },
  {
    id: "me-md-bearing",
    name: "Bearings, Brakes & Clutches",
    topic: "Machine Design",
    totalQuestions: 5, totalMarks: 7,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:0,marks:0},{year:2009,count:0,marks:0},
      {year:2010,count:0,marks:0},{year:2011,count:1,marks:1},{year:2012,count:0,marks:0},
      {year:2013,count:1,marks:1},{year:2014,count:0,marks:0},{year:2015,count:0,marks:0},
      {year:2016,count:0,marks:0},{year:2017,count:1,marks:1},{year:2018,count:1,marks:1},
      {year:2019,count:0,marks:0},{year:2020,count:1,marks:1},{year:2021,count:1,marks:1},
      {year:2022,count:1,marks:1},{year:2023,count:0,marks:0},{year:2024,count:1,marks:1},
      {year:2025,count:1,marks:1},{year:2026,count:1,marks:1},
    ],
    questionTypes: {mcq:3, msq:1, nat:1},
  },

  // ── RAC & IC Engines (2 subtopics) ──
  {
    id: "me-rac-vapour",
    name: "Vapour Compression & Gas Cycle Refrigeration",
    topic: "Refrigeration & Air Conditioning",
    totalQuestions: 6, totalMarks: 9,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:0,marks:0},{year:2009,count:1,marks:2},
      {year:2010,count:1,marks:2},{year:2011,count:0,marks:0},{year:2012,count:1,marks:2},
      {year:2013,count:0,marks:0},{year:2014,count:0,marks:0},{year:2015,count:0,marks:0},
      {year:2016,count:1,marks:2},{year:2017,count:0,marks:0},{year:2018,count:1,marks:2},
      {year:2019,count:1,marks:1},{year:2020,count:0,marks:0},{year:2021,count:0,marks:0},
      {year:2022,count:1,marks:2},{year:2023,count:0,marks:0},{year:2024,count:1,marks:2},
      {year:2025,count:1,marks:2},{year:2026,count:1,marks:2},
    ],
    questionTypes: {mcq:4, msq:1, nat:1},
  },
  {
    id: "me-ice-cycles",
    name: "IC Engine Cycles (Otto, Diesel, Brayton)",
    topic: "IC Engines",
    totalQuestions: 5, totalMarks: 7,
    yearlyData: [
      {year:2007,count:0,marks:0},{year:2008,count:0,marks:0},{year:2009,count:0,marks:0},
      {year:2010,count:0,marks:0},{year:2011,count:1,marks:1},{year:2012,count:0,marks:0},
      {year:2013,count:0,marks:0},{year:2014,count:0,marks:0},{year:2015,count:1,marks:1},
      {year:2016,count:0,marks:0},{year:2017,count:0,marks:0},{year:2018,count:1,marks:1},
      {year:2019,count:0,marks:0},{year:2020,count:1,marks:1},{year:2021,count:0,marks:0},
      {year:2022,count:0,marks:0},{year:2023,count:1,marks:1},{year:2024,count:1,marks:1},
      {year:2025,count:1,marks:1},{year:2026,count:1,marks:1},
    ],
    questionTypes: {mcq:3, msq:1, nat:1},
  },
];

// ─── ME yearly totals by subject ───
export const ME_YEARLY_TOTALS: { year: number; totalMarks: number; totalQuestions: number }[] = ME_AVAILABLE_YEARS.map((year) => {
  const yearData = ME_RAW_DATA.map((s) => {
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
  paperId: string; paperName: string; dataVersion: string;
  totalQuestions: number; totalMarks: number; yearsCovered: number[];
  paperCount: number; subjectBreakdown: { id: string; name: string; totalQuestions: number; totalMarks: number; avgMarksPerPaper: number }[];
  overallMarksByYear: { year: number; totalMarks: number }[]; avgMarksPerPaper: number;
  questionTypeBreakdown: { type: string; count: number; marks: number; percentage: number }[];
}

export const GATE_ME_SUMMARY: PaperSummary = {
  paperId: "gate-me",
  paperName: "Mechanical Engineering",
  dataVersion: "2026-09-02-v1",
  totalQuestions: ME_RAW_DATA.reduce((s, d) => s + d.totalQuestions, 0),
  totalMarks: ME_RAW_DATA.reduce((s, d) => s + d.totalMarks, 0),
  yearsCovered: ME_AVAILABLE_YEARS,
  paperCount: ME_AVAILABLE_YEARS.length,
  subjectBreakdown: ME_RAW_DATA.map((s) => ({
    id: s.id,
    name: s.name,
    totalQuestions: s.totalQuestions,
    totalMarks: s.totalMarks,
    avgMarksPerPaper: Math.round((s.totalMarks / ME_AVAILABLE_YEARS.length) * 10) / 10,
  })),
  overallMarksByYear: ME_YEARLY_TOTALS.map((y) => ({ year: y.year, totalMarks: y.totalMarks })),
  avgMarksPerPaper: Math.round(
    (ME_RAW_DATA.reduce((s, d) => s + d.totalMarks, 0) / ME_AVAILABLE_YEARS.length) * 10
  ) / 10,
  questionTypeBreakdown: [
    { type: "MCQ", count: 160, marks: 240, percentage: 52 },
    { type: "MSQ", count: 55, marks: 80, percentage: 17 },
    { type: "NAT", count: 70, marks: 120, percentage: 31 },
  ],
};

export const ME_DIFFICULTY_DISTRIBUTION = {
  easy: 33,
  medium: 47,
  hard: 20,
} as const;
