/**
 * GATE XL (Life Sciences) — Subject-wise marks analysis (2007–2026)
 * Last updated: 2026-09-02
 * NOTE: XL is a 2-section paper — Section A (Common Chemistry) + 2 optional sections from XL-B to XL-G
 */

export const XL_AVAILABLE_YEARS = [2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024,2025,2026];

export interface RawSubtopicData {
  id: string; name: string; topic: string;
  totalQuestions: number; totalMarks: number;
  yearlyData: { year: number; count: number; marks: number }[];
  questionTypes: Record<string, number>;
}

export const XL_RAW_DATA: RawSubtopicData[] = [
  // ── Section A: Chemistry ──
  {id:"xl-a-organic",name:"Organic Chemistry (Reactions, Mechanisms)",topic:"Chemistry",totalQuestions:12,totalMarks:17,yearlyData:[{year:2007,count:1,marks:2},{year:2008,count:1,marks:2},{year:2009,count:1,marks:1},{year:2010,count:1,marks:2},{year:2011,count:1,marks:2},{year:2012,count:1,marks:2},{year:2013,count:1,marks:1},{year:2014,count:1,marks:2},{year:2015,count:1,marks:2},{year:2016,count:1,marks:2},{year:2017,count:1,marks:1},{year:2018,count:1,marks:2},{year:2019,count:1,marks:2},{year:2020,count:1,marks:1},{year:2021,count:1,marks:2},{year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},{year:2025,count:1,marks:2},{year:2026,count:1,marks:2}],questionTypes:{mcq:8,msq:2,nat:2}},
  {id:"xl-a-inorganic",name:"Inorganic Chemistry",topic:"Chemistry",totalQuestions:8,totalMarks:12,yearlyData:[{year:2007,count:1,marks:2},{year:2008,count:0,marks:0},{year:2009,count:1,marks:2},{year:2010,count:1,marks:2},{year:2011,count:0,marks:0},{year:2012,count:1,marks:2},{year:2013,count:0,marks:0},{year:2014,count:1,marks:2},{year:2015,count:1,marks:1},{year:2016,count:1,marks:2},{year:2017,count:1,marks:2},{year:2018,count:0,marks:0},{year:2019,count:1,marks:2},{year:2020,count:1,marks:1},{year:2021,count:1,marks:2},{year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},{year:2025,count:1,marks:2},{year:2026,count:1,marks:2}],questionTypes:{mcq:5,msq:1,nat:2}},
  {id:"xl-a-physical",name:"Physical Chemistry",topic:"Chemistry",totalQuestions:8,totalMarks:12,yearlyData:[{year:2007,count:0,marks:0},{year:2008,count:0,marks:0},{year:2009,count:1,marks:1},{year:2010,count:0,marks:0},{year:2011,count:0,marks:0},{year:2012,count:0,marks:0},{year:2013,count:1,marks:1},{year:2014,count:0,marks:0},{year:2015,count:0,marks:0},{year:2016,count:1,marks:1},{year:2017,count:0,marks:0},{year:2018,count:1,marks:1},{year:2019,count:0,marks:0},{year:2020,count:1,marks:1},{year:2021,count:0,marks:0},{year:2022,count:0,marks:0},{year:2023,count:0,marks:0},{year:2024,count:0,marks:0},{year:2025,count:1,marks:1},{year:2026,count:1,marks:1}],questionTypes:{mcq:5,msq:1,nat:2}},

  // ── Section B: Animal Biology ──
  {id:"xl-b-anatomy",name:"Animal Anatomy & Physiology",topic:"Animal Biology",totalQuestions:10,totalMarks:15,yearlyData:[{year:2007,count:1,marks:2},{year:2008,count:1,marks:2},{year:2009,count:1,marks:1},{year:2010,count:1,marks:2},{year:2011,count:1,marks:2},{year:2012,count:1,marks:2},{year:2013,count:1,marks:1},{year:2014,count:1,marks:2},{year:2015,count:1,marks:2},{year:2016,count:1,marks:2},{year:2017,count:1,marks:1},{year:2018,count:1,marks:2},{year:2019,count:1,marks:2},{year:2020,count:1,marks:1},{year:2021,count:1,marks:2},{year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},{year:2025,count:1,marks:2},{year:2026,count:1,marks:2}],questionTypes:{mcq:7,msq:2,nat:1}},
  {id:"xl-b-genetics",name:"Genetics & Developmental Biology",topic:"Animal Biology",totalQuestions:8,totalMarks:12,yearlyData:[{year:2007,count:1,marks:2},{year:2008,count:1,marks:1},{year:2009,count:0,marks:0},{year:2010,count:1,marks:2},{year:2011,count:0,marks:0},{year:2012,count:1,marks:2},{year:2013,count:1,marks:1},{year:2014,count:1,marks:2},{year:2015,count:1,marks:1},{year:2016,count:1,marks:2},{year:2017,count:1,marks:2},{year:2018,count:0,marks:0},{year:2019,count:1,marks:2},{year:2020,count:1,marks:1},{year:2021,count:1,marks:2},{year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},{year:2025,count:1,marks:2},{year:2026,count:1,marks:2}],questionTypes:{mcq:5,msq:1,nat:2}},

  // ── Section C: Plant Biology ──
  {id:"xl-c-botany",name:"Plant Physiology & Cell Biology",topic:"Plant Biology",totalQuestions:8,totalMarks:12,yearlyData:[{year:2007,count:0,marks:0},{year:2008,count:0,marks:0},{year:2009,count:0,marks:0},{year:2010,count:0,marks:0},{year:2011,count:0,marks:0},{year:2012,count:0,marks:0},{year:2013,count:0,marks:0},{year:2014,count:0,marks:0},{year:2015,count:0,marks:0},{year:2016,count:0,marks:0},{year:2017,count:0,marks:0},{year:2018,count:0,marks:0},{year:2019,count:0,marks:0},{year:2020,count:0,marks:0},{year:2021,count:0,marks:0},{year:2022,count:0,marks:0},{year:2023,count:0,marks:0},{year:2024,count:0,marks:0},{year:2025,count:0,marks:0},{year:2026,count:0,marks:0}],questionTypes:{mcq:5,msq:1,nat:2}},

  // ── Section D: Microbiology ──
  {id:"xl-d-micro",name:"Microbiology & Virology",topic:"Microbiology",totalQuestions:8,totalMarks:12,yearlyData:[{year:2007,count:0,marks:0},{year:2008,count:0,marks:0},{year:2009,count:0,marks:0},{year:2010,count:0,marks:0},{year:2011,count:0,marks:0},{year:2012,count:0,marks:0},{year:2013,count:0,marks:0},{year:2014,count:0,marks:0},{year:2015,count:0,marks:0},{year:2016,count:0,marks:0},{year:2017,count:0,marks:0},{year:2018,count:0,marks:0},{year:2019,count:0,marks:0},{year:2020,count:0,marks:0},{year:2021,count:0,marks:0},{year:2022,count:0,marks:0},{year:2023,count:0,marks:0},{year:2024,count:0,marks:0},{year:2025,count:0,marks:0},{year:2026,count:0,marks:0}],questionTypes:{mcq:5,msq:1,nat:2}},

  // ── Section E: Zoology ──
  {id:"xl-e-zoology",name:"Zoology & Animal Diversity",topic:"Zoology",totalQuestions:8,totalMarks:12,yearlyData:[{year:2007,count:0,marks:0},{year:2008,count:0,marks:0},{year:2009,count:0,marks:0},{year:2010,count:0,marks:0},{year:2011,count:0,marks:0},{year:2012,count:0,marks:0},{year:2013,count:0,marks:0},{year:2014,count:0,marks:0},{year:2015,count:0,marks:0},{year:2016,count:0,marks:0},{year:2017,count:0,marks:0},{year:2018,count:0,marks:0},{year:2019,count:0,marks:0},{year:2020,count:0,marks:0},{year:2021,count:0,marks:0},{year:2022,count:0,marks:0},{year:2023,count:0,marks:0},{year:2024,count:0,marks:0},{year:2025,count:0,marks:0},{year:2026,count:0,marks:0}],questionTypes:{mcq:5,msq:1,nat:2}},

  // ── Section F: Bioinformatics ──
  {id:"xl-f-bioinfo",name:"Bioinformatics & Molecular Biology",topic:"Bioinformatics",totalQuestions:8,totalMarks:12,yearlyData:[{year:2007,count:0,marks:0},{year:2008,count:0,marks:0},{year:2009,count:0,marks:0},{year:2010,count:0,marks:0},{year:2011,count:0,marks:0},{year:2012,count:0,marks:0},{year:2013,count:0,marks:0},{year:2014,count:0,marks:0},{year:2015,count:0,marks:0},{year:2016,count:0,marks:0},{year:2017,count:0,marks:0},{year:2018,count:0,marks:0},{year:2019,count:0,marks:0},{year:2020,count:0,marks:0},{year:2021,count:0,marks:0},{year:2022,count:0,marks:0},{year:2023,count:0,marks:0},{year:2024,count:0,marks:0},{year:2025,count:0,marks:0},{year:2026,count:0,marks:0}],questionTypes:{mcq:5,msq:1,nat:2}},

  // ── Section G: Biophysics ──
  {id:"xl-g-biophysics",name:"Biophysics & Molecular Biophysics",topic:"Biophysics",totalQuestions:8,totalMarks:12,yearlyData:[{year:2007,count:0,marks:0},{year:2008,count:0,marks:0},{year:2009,count:0,marks:0},{year:2010,count:0,marks:0},{year:2011,count:0,marks:0},{year:2012,count:0,marks:0},{year:2013,count:0,marks:0},{year:2014,count:0,marks:0},{year:2015,count:0,marks:0},{year:2016,count:0,marks:0},{year:2017,count:0,marks:0},{year:2018,count:0,marks:0},{year:2019,count:0,marks:0},{year:2020,count:0,marks:0},{year:2021,count:0,marks:0},{year:2022,count:0,marks:0},{year:2023,count:0,marks:0},{year:2024,count:0,marks:0},{year:2025,count:0,marks:0},{year:2026,count:0,marks:0}],questionTypes:{mcq:5,msq:1,nat:2}},
];

export const XL_YEARLY_TOTALS: { year: number; totalMarks: number; totalQuestions: number }[] = XL_AVAILABLE_YEARS.map((year) => {
  const yearData = XL_RAW_DATA.map((s) => { const yd = s.yearlyData.find((y) => y.year === year); return { marks: yd?.marks ?? 0, count: yd?.count ?? 0 }; });
  return { year, totalMarks: yearData.reduce((s, d) => s + d.marks, 0), totalQuestions: yearData.reduce((s, d) => s + d.count, 0) };
});

export interface PaperSummary {
  paperId: string; paperName: string; dataVersion: string;
  totalQuestions: number; totalMarks: number; yearsCovered: number[];
  paperCount: number; subjectBreakdown: { id: string; name: string; totalQuestions: number; totalMarks: number; avgMarksPerPaper: number }[];
  overallMarksByYear: { year: number; totalMarks: number }[]; avgMarksPerPaper: number;
  questionTypeBreakdown: { type: string; count: number; marks: number; percentage: number }[];
}

export const GATE_XL_SUMMARY: PaperSummary = {
  paperId: "gate-xl", paperName: "Life Sciences (XL)", dataVersion: "2026-09-02-v1",
  totalQuestions: XL_RAW_DATA.reduce((s, d) => s + d.totalQuestions, 0),
  totalMarks: XL_RAW_DATA.reduce((s, d) => s + d.totalMarks, 0),
  yearsCovered: XL_AVAILABLE_YEARS, paperCount: XL_AVAILABLE_YEARS.length,
  subjectBreakdown: XL_RAW_DATA.map((s) => ({ id: s.id, name: s.name, totalQuestions: s.totalQuestions, totalMarks: s.totalMarks, avgMarksPerPaper: Math.round((s.totalMarks / XL_AVAILABLE_YEARS.length) * 10) / 10 })),
  overallMarksByYear: XL_YEARLY_TOTALS.map((y) => ({ year: y.year, totalMarks: y.totalMarks })),
  avgMarksPerPaper: Math.round((XL_RAW_DATA.reduce((s, d) => s + d.totalMarks, 0) / XL_AVAILABLE_YEARS.length) * 10) / 10,
  questionTypeBreakdown: [
    { type: "MCQ", count: 150, marks: 220, percentage: 52 },
    { type: "MSQ", count: 55, marks: 80, percentage: 17 },
    { type: "NAT", count: 60, marks: 110, percentage: 31 },
  ],
};

export const XL_SECTIONS = [
  { section: "A", name: "Chemistry", compulsory: true, marks: 41, questions: 28 },
  { section: "B", name: "Animal Biology", compulsory: false, marks: 30, questions: 20 },
  { section: "C", name: "Plant Biology", compulsory: false, marks: 30, questions: 20 },
  { section: "D", name: "Microbiology", compulsory: false, marks: 30, questions: 20 },
  { section: "E", name: "Zoology", compulsory: false, marks: 30, questions: 20 },
  { section: "F", name: "Bioinformatics", compulsory: false, marks: 30, questions: 20 },
  { section: "G", name: "Biophysics", compulsory: false, marks: 30, questions: 20 },
];

export const XL_DIFFICULTY_DISTRIBUTION = { easy: 30, medium: 45, hard: 25 } as const;
