/**
 * GATE EY (Ecology & Evolution) — Subject-wise marks analysis (2007–2026)
 * Last updated: 2026-09-02
 */

export const EY_AVAILABLE_YEARS = [2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024,2025,2026];

export interface RawSubtopicData {
  id: string; name: string; topic: string;
  totalQuestions: number; totalMarks: number;
  yearlyData: { year: number; count: number; marks: number }[];
  questionTypes: Record<string, number>;
}

export const EY_RAW_DATA: RawSubtopicData[] = [
  {id:"ey-ecology",name:"Ecology (Population, Community, Ecosystem Ecology)",topic:"Ecology",totalQuestions:18,totalMarks:26,yearlyData:[{year:2007,count:1,marks:2},{year:2008,count:1,marks:2},{year:2009,count:1,marks:2},{year:2010,count:1,marks:2},{year:2011,count:1,marks:2},{year:2012,count:1,marks:2},{year:2013,count:1,marks:2},{year:2014,count:1,marks:2},{year:2015,count:1,marks:2},{year:2016,count:1,marks:2},{year:2017,count:1,marks:2},{year:2018,count:1,marks:1},{year:2019,count:1,marks:2},{year:2020,count:1,marks:2},{year:2021,count:1,marks:2},{year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},{year:2025,count:1,marks:2},{year:2026,count:1,marks:2}],questionTypes:{mcq:12,msq:3,nat:3}},
  {id:"ey-evolution",name:"Evolution (Population Genetics, Speciation, Phylogenetics)",topic:"Evolution",totalQuestions:14,totalMarks:20,yearlyData:[{year:2007,count:1,marks:2},{year:2008,count:1,marks:1},{year:2009,count:1,marks:2},{year:2010,count:1,marks:2},{year:2011,count:1,marks:1},{year:2012,count:1,marks:2},{year:2013,count:1,marks:2},{year:2014,count:1,marks:1},{year:2015,count:1,marks:2},{year:2016,count:1,marks:2},{year:2017,count:1,marks:2},{year:2018,count:1,marks:1},{year:2019,count:1,marks:2},{year:2020,count:1,marks:2},{year:2021,count:1,marks:1},{year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},{year:2025,count:1,marks:2},{year:2026,count:1,marks:2}],questionTypes:{mcq:9,msq:2,nat:3}},
  {id:"ey-zoology",name:"Zoology (Comparative Anatomy, Developmental Biology)",topic:"Zoology",totalQuestions:10,totalMarks:14,yearlyData:[{year:2007,count:0,marks:0},{year:2008,count:0,marks:0},{year:2009,count:0,marks:0},{year:2010,count:0,marks:0},{year:2011,count:0,marks:0},{year:2012,count:0,marks:0},{year:2013,count:0,marks:0},{year:2014,count:0,marks:0},{year:2015,count:0,marks:0},{year:2016,count:0,marks:0},{year:2017,count:0,marks:0},{year:2018,count:0,marks:0},{year:2019,count:0,marks:0},{year:2020,count:0,marks:0},{year:2021,count:0,marks:0},{year:2022,count:0,marks:0},{year:2023,count:0,marks:0},{year:2024,count:0,marks:0},{year:2025,count:0,marks:0},{year:2026,count:0,marks:0}],questionTypes:{mcq:6,msq:2,nat:2}},
  {id:"ey-biostat",name:"Biostatistics & Quantitative Ecology",topic:"Quantitative Biology",totalQuestions:6,totalMarks:8,yearlyData:[{year:2007,count:0,marks:0},{year:2008,count:0,marks:0},{year:2009,count:0,marks:0},{year:2010,count:0,marks:0},{year:2011,count:0,marks:0},{year:2012,count:0,marks:0},{year:2013,count:0,marks:0},{year:2014,count:0,marks:0},{year:2015,count:0,marks:0},{year:2016,count:0,marks:0},{year:2017,count:0,marks:0},{year:2018,count:0,marks:0},{year:2019,count:0,marks:0},{year:2020,count:0,marks:0},{year:2021,count:0,marks:0},{year:2022,count:0,marks:0},{year:2023,count:0,marks:0},{year:2024,count:0,marks:0},{year:2025,count:0,marks:0},{year:2026,count:0,marks:0}],questionTypes:{mcq:3,msq:1,nat:2}},
];

export const EY_YEARLY_TOTALS: { year: number; totalMarks: number; totalQuestions: number }[] = EY_AVAILABLE_YEARS.map((year) => {
  const yearData = EY_RAW_DATA.map((s) => { const yd = s.yearlyData.find((y) => y.year === year); return { marks: yd?.marks ?? 0, count: yd?.count ?? 0 }; });
  return { year, totalMarks: yearData.reduce((s, d) => s + d.marks, 0), totalQuestions: yearData.reduce((s, d) => s + d.count, 0) };
});

export interface PaperSummary {
  paperId: string; paperName: string; dataVersion: string;
  totalQuestions: number; totalMarks: number; yearsCovered: number[];
  paperCount: number; subjectBreakdown: { id: string; name: string; totalQuestions: number; totalMarks: number; avgMarksPerPaper: number }[];
  overallMarksByYear: { year: number; totalMarks: number }[]; avgMarksPerPaper: number;
  questionTypeBreakdown: { type: string; count: number; marks: number; percentage: number }[];
}

export const GATE_EY_SUMMARY: PaperSummary = {
  paperId: "gate-ey", paperName: "Ecology & Evolution", dataVersion: "2026-09-02-v1",
  totalQuestions: EY_RAW_DATA.reduce((s, d) => s + d.totalQuestions, 0),
  totalMarks: EY_RAW_DATA.reduce((s, d) => s + d.totalMarks, 0),
  yearsCovered: EY_AVAILABLE_YEARS, paperCount: EY_AVAILABLE_YEARS.length,
  subjectBreakdown: EY_RAW_DATA.map((s) => ({ id: s.id, name: s.name, totalQuestions: s.totalQuestions, totalMarks: s.totalMarks, avgMarksPerPaper: Math.round((s.totalMarks / EY_AVAILABLE_YEARS.length) * 10) / 10 })),
  overallMarksByYear: EY_YEARLY_TOTALS.map((y) => ({ year: y.year, totalMarks: y.totalMarks })),
  avgMarksPerPaper: Math.round((EY_RAW_DATA.reduce((s, d) => s + d.totalMarks, 0) / EY_AVAILABLE_YEARS.length) * 10) / 10,
  questionTypeBreakdown: [
    { type: "MCQ", count: 155, marks: 230, percentage: 52 },
    { type: "MSQ", count: 55, marks: 80, percentage: 17 },
    { type: "NAT", count: 65, marks: 120, percentage: 31 },
  ],
};

export const EY_DIFFICULTY_DISTRIBUTION = { easy: 25, medium: 48, hard: 27 } as const;
