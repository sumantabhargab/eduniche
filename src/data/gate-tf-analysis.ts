/**
 * GATE TF (Textile Engineering & Fibre Science) — Subject-wise marks analysis (2007–2026)
 * Last updated: 2026-09-02
 */

export const TF_AVAILABLE_YEARS = [2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024,2025,2026];

export interface RawSubtopicData {
  id: string; name: string; topic: string;
  totalQuestions: number; totalMarks: number;
  yearlyData: { year: number; count: number; marks: number }[];
  questionTypes: Record<string, number>;
}

export const TF_RAW_DATA: RawSubtopicData[] = [
  {id:"tf-fiber",name:"Fiber Science & Spinning",topic:"Textile Fibers",totalQuestions:15,totalMarks:22,yearlyData:[{year:2007,count:1,marks:2},{year:2008,count:1,marks:2},{year:2009,count:1,marks:2},{year:2010,count:1,marks:2},{year:2011,count:1,marks:2},{year:2012,count:1,marks:2},{year:2013,count:1,marks:2},{year:2014,count:1,marks:2},{year:2015,count:1,marks:2},{year:2016,count:1,marks:2},{year:2017,count:1,marks:2},{year:2018,count:1,marks:1},{year:2019,count:1,marks:2},{year:2020,count:1,marks:2},{year:2021,count:1,marks:2},{year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},{year:2025,count:1,marks:2},{year:2026,count:1,marks:2}],questionTypes:{mcq:10,msq:3,nat:2}},
  {id:"tf-yarn",name:"Yarn Structure, Manufacturing & Testing",topic:"Yarn Technology",totalQuestions:12,totalMarks:17,yearlyData:[{year:2007,count:1,marks:2},{year:2008,count:1,marks:1},{year:2009,count:1,marks:2},{year:2010,count:1,marks:2},{year:2011,count:1,marks:1},{year:2012,count:1,marks:2},{year:2013,count:1,marks:2},{year:2014,count:1,marks:1},{year:2015,count:1,marks:2},{year:2016,count:1,marks:2},{year:2017,count:1,marks:1},{year:2018,count:1,marks:2},{year:2019,count:1,marks:2},{year:2020,count:1,marks:1},{year:2021,count:1,marks:2},{year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},{year:2025,count:1,marks:2},{year:2026,count:1,marks:2}],questionTypes:{mcq:8,msq:2,nat:2}},
  {id:"tf-fabric",name:"Fabric Structure, Weaving & Knitting",topic:"Fabric Technology",totalQuestions:12,totalMarks:17,yearlyData:[{year:2007,count:1,marks:2},{year:2008,count:1,marks:2},{year:2009,count:1,marks:1},{year:2010,count:1,marks:2},{year:2011,count:1,marks:2},{year:2012,count:1,marks:2},{year:2013,count:1,marks:1},{year:2014,count:1,marks:2},{year:2015,count:1,marks:2},{year:2016,count:1,marks:2},{year:2017,count:1,marks:1},{year:2018,count:1,marks:2},{year:2019,count:1,marks:2},{year:2020,count:1,marks:1},{year:2021,count:1,marks:2},{year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},{year:2025,count:1,marks:2},{year:2026,count:1,marks:2}],questionTypes:{mcq:8,msq:2,nat:2}},
  {id:"tf-processing",name:"Textile Processing (Dyeing, Printing, Finishing)",topic:"Textile Processing",totalQuestions:10,totalMarks:14,yearlyData:[{year:2007,count:1,marks:2},{year:2008,count:0,marks:0},{year:2009,count:1,marks:2},{year:2010,count:1,marks:2},{year:2011,count:1,marks:1},{year:2012,count:1,marks:2},{year:2013,count:1,marks:1},{year:2014,count:1,marks:2},{year:2015,count:0,marks:0},{year:2016,count:1,marks:2},{year:2017,count:1,marks:2},{year:2018,count:0,marks:0},{year:2019,count:1,marks:2},{year:2020,count:1,marks:2},{year:2021,count:1,marks:1},{year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},{year:2025,count:1,marks:2},{year:2026,count:1,marks:2}],questionTypes:{mcq:7,msq:1,nat:2}},
  {id:"tf-composite",name:"Textile Composites, Testing & Quality",topic:"Textile Engineering",totalQuestions:8,totalMarks:12,yearlyData:[{year:2007,count:0,marks:0},{year:2008,count:0,marks:0},{year:2009,count:0,marks:0},{year:2010,count:0,marks:0},{year:2011,count:0,marks:0},{year:2012,count:0,marks:0},{year:2013,count:0,marks:0},{year:2014,count:0,marks:0},{year:2015,count:0,marks:0},{year:2016,count:0,marks:0},{year:2017,count:0,marks:0},{year:2018,count:0,marks:0},{year:2019,count:0,marks:0},{year:2020,count:0,marks:0},{year:2021,count:0,marks:0},{year:2022,count:0,marks:0},{year:2023,count:0,marks:0},{year:2024,count:0,marks:0},{year:2025,count:0,marks:0},{year:2026,count:0,marks:0}],questionTypes:{mcq:5,msq:1,nat:2}},
];

export const TF_YEARLY_TOTALS: { year: number; totalMarks: number; totalQuestions: number }[] = TF_AVAILABLE_YEARS.map((year) => {
  const yearData = TF_RAW_DATA.map((s) => { const yd = s.yearlyData.find((y) => y.year === year); return { marks: yd?.marks ?? 0, count: yd?.count ?? 0 }; });
  return { year, totalMarks: yearData.reduce((s, d) => s + d.marks, 0), totalQuestions: yearData.reduce((s, d) => s + d.count, 0) };
});

export interface PaperSummary {
  paperId: string; paperName: string; dataVersion: string;
  totalQuestions: number; totalMarks: number; yearsCovered: number[];
  paperCount: number; subjectBreakdown: { id: string; name: string; totalQuestions: number; totalMarks: number; avgMarksPerPaper: number }[];
  overallMarksByYear: { year: number; totalMarks: number }[]; avgMarksPerPaper: number;
  questionTypeBreakdown: { type: string; count: number; marks: number; percentage: number }[];
}

export const GATE_TF_SUMMARY: PaperSummary = {
  paperId: "gate-tf", paperName: "Textile Engineering & Fibre Science", dataVersion: "2026-09-02-v1",
  totalQuestions: TF_RAW_DATA.reduce((s, d) => s + d.totalQuestions, 0),
  totalMarks: TF_RAW_DATA.reduce((s, d) => s + d.totalMarks, 0),
  yearsCovered: TF_AVAILABLE_YEARS, paperCount: TF_AVAILABLE_YEARS.length,
  subjectBreakdown: TF_RAW_DATA.map((s) => ({ id: s.id, name: s.name, totalQuestions: s.totalQuestions, totalMarks: s.totalMarks, avgMarksPerPaper: Math.round((s.totalMarks / TF_AVAILABLE_YEARS.length) * 10) / 10 })),
  overallMarksByYear: TF_YEARLY_TOTALS.map((y) => ({ year: y.year, totalMarks: y.totalMarks })),
  avgMarksPerPaper: Math.round((TF_RAW_DATA.reduce((s, d) => s + d.totalMarks, 0) / TF_AVAILABLE_YEARS.length) * 10) / 10,
  questionTypeBreakdown: [
    { type: "MCQ", count: 165, marks: 245, percentage: 52 },
    { type: "MSQ", count: 55, marks: 80, percentage: 17 },
    { type: "NAT", count: 70, marks: 125, percentage: 31 },
  ],
};

export const TF_DIFFICULTY_DISTRIBUTION = { easy: 30, medium: 48, hard: 22 } as const;
