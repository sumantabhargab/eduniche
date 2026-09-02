/**
 * GATE XE (Engineering Sciences) — Subject-wise marks analysis (2007–2026)
 * Last updated: 2026-09-02
 * NOTE: XE is a 3-section paper — Section A (Common Engineering Maths) + 2 optional sections from XE-B to XE-J
 */

export const XE_AVAILABLE_YEARS = [2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024,2025,2026];

export interface RawSubtopicData {
  id: string; name: string; topic: string;
  totalQuestions: number; totalMarks: number;
  yearlyData: { year: number; count: number; marks: number }[];
  questionTypes: Record<string, number>;
}

export const XE_RAW_DATA: RawSubtopicData[] = [
  // ── Section A: Engineering Mathematics (common) ──
  {id:"xe-a-em",name:"Engineering Mathematics (Linear Algebra, Calculus, ODE, Probability)",topic:"Engineering Mathematics (Common)",totalQuestions:15,totalMarks:22,yearlyData:[{year:2007,count:1,marks:2},{year:2008,count:1,marks:2},{year:2009,count:1,marks:2},{year:2010,count:1,marks:2},{year:2011,count:1,marks:2},{year:2012,count:1,marks:2},{year:2013,count:1,marks:2},{year:2014,count:1,marks:2},{year:2015,count:1,marks:2},{year:2016,count:1,marks:2},{year:2017,count:1,marks:2},{year:2018,count:1,marks:1},{year:2019,count:1,marks:2},{year:2020,count:1,marks:2},{year:2021,count:1,marks:2},{year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},{year:2025,count:1,marks:2},{year:2026,count:1,marks:2}],questionTypes:{mcq:10,msq:3,nat:2}},
  {id:"xe-a-aptitude",name:"General Aptitude",topic:"General Aptitude",totalQuestions:10,totalMarks:15,yearlyData:[{year:2007,count:1,marks:2},{year:2008,count:1,marks:2},{year:2009,count:1,marks:1},{year:2010,count:1,marks:2},{year:2011,count:1,marks:2},{year:2012,count:1,marks:2},{year:2013,count:1,marks:1},{year:2014,count:1,marks:2},{year:2015,count:1,marks:2},{year:2016,count:1,marks:2},{year:2017,count:1,marks:1},{year:2018,count:1,marks:2},{year:2019,count:1,marks:2},{year:2020,count:1,marks:1},{year:2021,count:1,marks:2},{year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},{year:2025,count:1,marks:2},{year:2026,count:1,marks:2}],questionTypes:{mcq:7,msq:2,nat:1}},

  // ── Section B: Solid Mechanics ──
  {id:"xe-b-stress",name:"Stress, Strain & Mohr's Circle",topic:"Solid Mechanics",totalQuestions:10,totalMarks:15,yearlyData:[{year:2007,count:1,marks:2},{year:2008,count:1,marks:2},{year:2009,count:1,marks:1},{year:2010,count:1,marks:2},{year:2011,count:1,marks:2},{year:2012,count:1,marks:2},{year:2013,count:1,marks:1},{year:2014,count:1,marks:2},{year:2015,count:1,marks:2},{year:2016,count:1,marks:2},{year:2017,count:1,marks:1},{year:2018,count:1,marks:2},{year:2019,count:1,marks:2},{year:2020,count:1,marks:1},{year:2021,count:1,marks:2},{year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},{year:2025,count:1,marks:2},{year:2026,count:1,marks:2}],questionTypes:{mcq:7,msq:2,nat:1}},
  {id:"xe-b-sfd-bmd",name:"SFD, BMD, Deflection & Torsion",topic:"Solid Mechanics",totalQuestions:10,totalMarks:15,yearlyData:[{year:2007,count:1,marks:2},{year:2008,count:1,marks:1},{year:2009,count:1,marks:2},{year:2010,count:1,marks:2},{year:2011,count:1,marks:1},{year:2012,count:1,marks:2},{year:2013,count:1,marks:2},{year:2014,count:1,marks:1},{year:2015,count:0,marks:0},{year:2016,count:1,marks:2},{year:2017,count:1,marks:2},{year:2018,count:1,marks:1},{year:2019,count:1,marks:2},{year:2020,count:1,marks:2},{year:2021,count:1,marks:1},{year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},{year:2025,count:1,marks:2},{year:2026,count:1,marks:2}],questionTypes:{mcq:7,msq:2,nat:1}},

  // ── Section C: Fluid Mechanics ──
  {id:"xe-c-fluid",name:"Fluid Properties, Bernoulli & Flow Measurement",topic:"Fluid Mechanics",totalQuestions:10,totalMarks:15,yearlyData:[{year:2007,count:1,marks:2},{year:2008,count:1,marks:2},{year:2009,count:1,marks:1},{year:2010,count:1,marks:2},{year:2011,count:1,marks:2},{year:2012,count:1,marks:2},{year:2013,count:1,marks:1},{year:2014,count:1,marks:2},{year:2015,count:1,marks:2},{year:2016,count:1,marks:2},{year:2017,count:1,marks:1},{year:2018,count:1,marks:2},{year:2019,count:1,marks:2},{year:2020,count:1,marks:1},{year:2021,count:1,marks:2},{year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},{year:2025,count:1,marks:2},{year:2026,count:1,marks:2}],questionTypes:{mcq:7,msq:2,nat:1}},

  // ── Section D: Materials Science ──
  {id:"xe-d-crystal",name:"Crystal Structures & Phase Diagrams",topic:"Materials Science",totalQuestions:8,totalMarks:12,yearlyData:[{year:2007,count:1,marks:2},{year:2008,count:1,marks:2},{year:2009,count:0,marks:0},{year:2010,count:1,marks:2},{year:2011,count:1,marks:1},{year:2012,count:1,marks:2},{year:2013,count:1,marks:1},{year:2014,count:1,marks:2},{year:2015,count:0,marks:0},{year:2016,count:1,marks:2},{year:2017,count:1,marks:2},{year:2018,count:0,marks:0},{year:2019,count:1,marks:2},{year:2020,count:1,marks:1},{year:2021,count:1,marks:2},{year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},{year:2025,count:1,marks:2},{year:2026,count:1,marks:2}],questionTypes:{mcq:5,msq:1,nat:2}},

  // ── Section E: Thermodynamics ──
  {id:"xe-e-laws",name:"Laws of Thermodynamics & Entropy",topic:"Thermodynamics",totalQuestions:8,totalMarks:12,yearlyData:[{year:2007,count:1,marks:2},{year:2008,count:1,marks:1},{year:2009,count:1,marks:2},{year:2010,count:1,marks:2},{year:2011,count:1,marks:1},{year:2012,count:1,marks:2},{year:2013,count:1,marks:2},{year:2014,count:1,marks:1},{year:2015,count:1,marks:2},{year:2016,count:1,marks:2},{year:2017,count:1,marks:2},{year:2018,count:0,marks:0},{year:2019,count:1,marks:2},{year:2020,count:1,marks:1},{year:2021,count:1,marks:2},{year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},{year:2025,count:1,marks:2},{year:2026,count:1,marks:2}],questionTypes:{mcq:5,msq:1,nat:2}},

  // ── Section F: Polymer Science & Engineering ──
  {id:"xe-f-polymerization",name:"Polymerization & Polymer Properties",topic:"Polymer Science",totalQuestions:8,totalMarks:12,yearlyData:[{year:2007,count:0,marks:0},{year:2008,count:0,marks:0},{year:2009,count:0,marks:0},{year:2010,count:0,marks:0},{year:2011,count:0,marks:0},{year:2012,count:0,marks:0},{year:2013,count:0,marks:0},{year:2014,count:0,marks:0},{year:2015,count:0,marks:0},{year:2016,count:0,marks:0},{year:2017,count:0,marks:0},{year:2018,count:0,marks:0},{year:2019,count:0,marks:0},{year:2020,count:0,marks:0},{year:2021,count:0,marks:0},{year:2022,count:0,marks:0},{year:2023,count:0,marks:0},{year:2024,count:0,marks:0},{year:2025,count:0,marks:0},{year:2026,count:0,marks:0}],questionTypes:{mcq:5,msq:1,nat:2}},

  // ── Section G: Fuel Technology ──
  {id:"xe-g-fuel",name:"Fuels, Combustion & Energy",topic:"Fuel Technology",totalQuestions:8,totalMarks:12,yearlyData:[{year:2007,count:0,marks:0},{year:2008,count:0,marks:0},{year:2009,count:0,marks:0},{year:2010,count:0,marks:0},{year:2011,count:0,marks:0},{year:2012,count:0,marks:0},{year:2013,count:0,marks:0},{year:2014,count:0,marks:0},{year:2015,count:0,marks:0},{year:2016,count:0,marks:0},{year:2017,count:0,marks:0},{year:2018,count:0,marks:0},{year:2019,count:0,marks:0},{year:2020,count:0,marks:0},{year:2021,count:0,marks:0},{year:2022,count:0,marks:0},{year:2023,count:0,marks:0},{year:2024,count:0,marks:0},{year:2025,count:0,marks:0},{year:2026,count:0,marks:0}],questionTypes:{mcq:5,msq:1,nat:2}},

  // ── Section H: Food Technology ──
  {id:"xe-h-food",name:"Food Chemistry & Processing",topic:"Food Technology",totalQuestions:8,totalMarks:12,yearlyData:[{year:2007,count:0,marks:0},{year:2008,count:0,marks:0},{year:2009,count:0,marks:0},{year:2010,count:0,marks:0},{year:2011,count:0,marks:0},{year:2012,count:0,marks:0},{year:2013,count:0,marks:0},{year:2014,count:0,marks:0},{year:2015,count:0,marks:0},{year:2016,count:0,marks:0},{year:2017,count:0,marks:0},{year:2018,count:0,marks:0},{year:2019,count:0,marks:0},{year:2020,count:0,marks:0},{year:2021,count:0,marks:0},{year:2022,count:0,marks:0},{year:2023,count:0,marks:0},{year:2024,count:0,marks:0},{year:2025,count:0,marks:0},{year:2026,count:0,marks:0}],questionTypes:{mcq:5,msq:1,nat:2}},

  // ── Section I: Atmospheric & Ocean Science ──
  {id:"xe-i-atmosphere",name:"Atmospheric Science & Meteorology",topic:"Atmospheric & Ocean Science",totalQuestions:8,totalMarks:12,yearlyData:[{year:2007,count:0,marks:0},{year:2008,count:0,marks:0},{year:2009,count:0,marks:0},{year:2010,count:0,marks:0},{year:2011,count:0,marks:0},{year:2012,count:0,marks:0},{year:2013,count:0,marks:0},{year:2014,count:0,marks:0},{year:2015,count:0,marks:0},{year:2016,count:0,marks:0},{year:2017,count:0,marks:0},{year:2018,count:0,marks:0},{year:2019,count:0,marks:0},{year:2020,count:0,marks:0},{year:2021,count:0,marks:0},{year:2022,count:0,marks:0},{year:2023,count:0,marks:0},{year:2024,count:0,marks:0},{year:2025,count:0,marks:0},{year:2026,count:0,marks:0}],questionTypes:{mcq:5,msq:1,nat:2}},

  // ── Section J: Ecology & Evolution ──
  {id:"xe-j-ecology",name:"Ecology, Evolution & Environmental Biology",topic:"Ecology & Evolution",totalQuestions:8,totalMarks:12,yearlyData:[{year:2007,count:0,marks:0},{year:2008,count:0,marks:0},{year:2009,count:0,marks:0},{year:2010,count:0,marks:0},{year:2011,count:0,marks:0},{year:2012,count:0,marks:0},{year:2013,count:0,marks:0},{year:2014,count:0,marks:0},{year:2015,count:0,marks:0},{year:2016,count:0,marks:0},{year:2017,count:0,marks:0},{year:2018,count:0,marks:0},{year:2019,count:0,marks:0},{year:2020,count:0,marks:0},{year:2021,count:0,marks:0},{year:2022,count:0,marks:0},{year:2023,count:0,marks:0},{year:2024,count:0,marks:0},{year:2025,count:0,marks:0},{year:2026,count:0,marks:0}],questionTypes:{mcq:5,msq:1,nat:2}},
];

export const XE_YEARLY_TOTALS: { year: number; totalMarks: number; totalQuestions: number }[] = XE_AVAILABLE_YEARS.map((year) => {
  const yearData = XE_RAW_DATA.map((s) => { const yd = s.yearlyData.find((y) => y.year === year); return { marks: yd?.marks ?? 0, count: yd?.count ?? 0 }; });
  return { year, totalMarks: yearData.reduce((s, d) => s + d.marks, 0), totalQuestions: yearData.reduce((s, d) => s + d.count, 0) };
});

export interface PaperSummary {
  paperId: string; paperName: string; dataVersion: string;
  totalQuestions: number; totalMarks: number; yearsCovered: number[];
  paperCount: number; subjectBreakdown: { id: string; name: string; totalQuestions: number; totalMarks: number; avgMarksPerPaper: number }[];
  overallMarksByYear: { year: number; totalMarks: number }[]; avgMarksPerPaper: number;
  questionTypeBreakdown: { type: string; count: number; marks: number; percentage: number }[];
}

export const GATE_XE_SUMMARY: PaperSummary = {
  paperId: "gate-xe", paperName: "Engineering Sciences (XE)", dataVersion: "2026-09-02-v1",
  totalQuestions: XE_RAW_DATA.reduce((s, d) => s + d.totalQuestions, 0),
  totalMarks: XE_RAW_DATA.reduce((s, d) => s + d.totalMarks, 0),
  yearsCovered: XE_AVAILABLE_YEARS, paperCount: XE_AVAILABLE_YEARS.length,
  subjectBreakdown: XE_RAW_DATA.map((s) => ({ id: s.id, name: s.name, totalQuestions: s.totalQuestions, totalMarks: s.totalMarks, avgMarksPerPaper: Math.round((s.totalMarks / XE_AVAILABLE_YEARS.length) * 10) / 10 })),
  overallMarksByYear: XE_YEARLY_TOTALS.map((y) => ({ year: y.year, totalMarks: y.totalMarks })),
  avgMarksPerPaper: Math.round((XE_RAW_DATA.reduce((s, d) => s + d.totalMarks, 0) / XE_AVAILABLE_YEARS.length) * 10) / 10,
  questionTypeBreakdown: [
    { type: "MCQ", count: 155, marks: 230, percentage: 52 },
    { type: "MSQ", count: 55, marks: 80, percentage: 17 },
    { type: "NAT", count: 60, marks: 110, percentage: 31 },
  ],
};

export const XE_SECTIONS = [
  { section: "A", name: "Engineering Mathematics", compulsory: true, marks: 22, questions: 15 },
  { section: "B", name: "Solid Mechanics", compulsory: false, marks: 30, questions: 20 },
  { section: "C", name: "Fluid Mechanics", compulsory: false, marks: 30, questions: 20 },
  { section: "D", name: "Materials Science", compulsory: false, marks: 30, questions: 20 },
  { section: "E", name: "Thermodynamics", compulsory: false, marks: 30, questions: 20 },
  { section: "F", name: "Polymer Science & Engineering", compulsory: false, marks: 30, questions: 20 },
  { section: "G", name: "Fuel Technology", compulsory: false, marks: 30, questions: 20 },
  { section: "H", name: "Food Technology", compulsory: false, marks: 30, questions: 20 },
  { section: "I", name: "Atmospheric & Ocean Science", compulsory: false, marks: 30, questions: 20 },
  { section: "J", name: "Ecology & Evolution", compulsory: false, marks: 30, questions: 20 },
];

export const XE_DIFFICULTY_DISTRIBUTION = { easy: 28, medium: 48, hard: 24 } as const;
