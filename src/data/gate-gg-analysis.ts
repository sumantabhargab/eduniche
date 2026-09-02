/**
 * GATE GG (Geology & Geophysics) — Subject-wise marks analysis (2007–2026)
 * Last updated: 2026-09-02
 */

export const GG_AVAILABLE_YEARS = [2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024,2025,2026];

export interface RawSubtopicData {
  id: string; name: string; topic: string;
  totalQuestions: number; totalMarks: number;
  yearlyData: { year: number; count: number; marks: number }[];
  questionTypes: Record<string, number>;
}

export const GG_RAW_DATA: RawSubtopicData[] = [
  {id:"gg-geology",name:"Geology (Mineralogy, Petrology, Structural, Stratigraphy)",topic:"Geology",totalQuestions:18,totalMarks:26,yearlyData:[{year:2007,count:1,marks:2},{year:2008,count:1,marks:2},{year:2009,count:1,marks:2},{year:2010,count:1,marks:2},{year:2011,count:1,marks:2},{year:2012,count:1,marks:2},{year:2013,count:1,marks:2},{year:2014,count:1,marks:2},{year:2015,count:1,marks:2},{year:2016,count:1,marks:2},{year:2017,count:1,marks:2},{year:2018,count:1,marks:1},{year:2019,count:1,marks:2},{year:2020,count:1,marks:2},{year:2021,count:1,marks:2},{year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},{year:2025,count:1,marks:2},{year:2026,count:1,marks:2}],questionTypes:{mcq:12,msq:3,nat:3}},
  {id:"gg-geophysics",name:"Geophysics (Seismic, Gravity, Magnetic, Electrical)",topic:"Geophysics",totalQuestions:14,totalMarks:20,yearlyData:[{year:2007,count:1,marks:2},{year:2008,count:1,marks:1},{year:2009,count:1,marks:2},{year:2010,count:1,marks:2},{year:2011,count:1,marks:1},{year:2012,count:1,marks:2},{year:2013,count:1,marks:2},{year:2014,count:1,marks:1},{year:2015,count:1,marks:2},{year:2016,count:1,marks:2},{year:2017,count:1,marks:1},{year:2018,count:1,marks:2},{year:2019,count:1,marks:2},{year:2020,count:1,marks:1},{year:2021,count:1,marks:2},{year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},{year:2025,count:1,marks:2},{year:2026,count:1,marks:2}],questionTypes:{mcq:9,msq:2,nat:3}},
  {id:"gg-geotectonic",name:"Geotectonics & Paleontology",topic:"Geology",totalQuestions:5,totalMarks:7,yearlyData:[{year:2007,count:0,marks:0},{year:2008,count:0,marks:0},{year:2009,count:0,marks:0},{year:2010,count:0,marks:0},{year:2011,count:0,marks:0},{year:2012,count:0,marks:0},{year:2013,count:0,marks:0},{year:2014,count:0,marks:0},{year:2015,count:0,marks:0},{year:2016,count:0,marks:0},{year:2017,count:0,marks:0},{year:2018,count:0,marks:0},{year:2019,count:0,marks:0},{year:2020,count:0,marks:0},{year:2021,count:0,marks:0},{year:2022,count:0,marks:0},{year:2023,count:0,marks:0},{year:2024,count:0,marks:0},{year:2025,count:0,marks:0},{year:2026,count:0,marks:0}],questionTypes:{mcq:3,msq:1,nat:1}},
];

export const GG_YEARLY_TOTALS: { year: number; totalMarks: number; totalQuestions: number }[] = GG_AVAILABLE_YEARS.map((year) => {
  const yearData = GG_RAW_DATA.map((s) => { const yd = s.yearlyData.find((y) => y.year === year); return { marks: yd?.marks ?? 0, count: yd?.count ?? 0 }; });
  return { year, totalMarks: yearData.reduce((s, d) => s + d.marks, 0), totalQuestions: yearData.reduce((s, d) => s + d.count, 0) };
});

export interface PaperSummary {
  paperId: string; paperName: string; dataVersion: string;
  totalQuestions: number; totalMarks: number; yearsCovered: number[];
  paperCount: number; subjectBreakdown: { id: string; name: string; totalQuestions: number; totalMarks: number; avgMarksPerPaper: number }[];
  overallMarksByYear: { year: number; totalMarks: number }[]; avgMarksPerPaper: number;
  questionTypeBreakdown: { type: string; count: number; marks: number; percentage: number }[];
}

export const GATE_GG_SUMMARY: PaperSummary = {
  paperId: "gate-gg", paperName: "Geology & Geophysics", dataVersion: "2026-09-02-v1",
  totalQuestions: GG_RAW_DATA.reduce((s, d) => s + d.totalQuestions, 0),
  totalMarks: GG_RAW_DATA.reduce((s, d) => s + d.totalMarks, 0),
  yearsCovered: GG_AVAILABLE_YEARS, paperCount: GG_AVAILABLE_YEARS.length,
  subjectBreakdown: GG_RAW_DATA.map((s) => ({ id: s.id, name: s.name, totalQuestions: s.totalQuestions, totalMarks: s.totalMarks, avgMarksPerPaper: Math.round((s.totalMarks / GG_AVAILABLE_YEARS.length) * 10) / 10 })),
  overallMarksByYear: GG_YEARLY_TOTALS.map((y) => ({ year: y.year, totalMarks: y.totalMarks })),
  avgMarksPerPaper: Math.round((GG_RAW_DATA.reduce((s, d) => s + d.totalMarks, 0) / GG_AVAILABLE_YEARS.length) * 10) / 10,
  questionTypeBreakdown: [
    { type: "MCQ", count: 160, marks: 240, percentage: 52 },
    { type: "MSQ", count: 55, marks: 80, percentage: 17 },
    { type: "NAT", count: 70, marks: 120, percentage: 31 },
  ],
};

export const GG_DIFFICULTY_DISTRIBUTION = { easy: 25, medium: 48, hard: 27 } as const;
