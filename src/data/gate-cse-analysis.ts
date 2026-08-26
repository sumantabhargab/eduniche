/**
 * GATE CSE — Pre-computed analysis data derived from TOC PYQ data.
 *
 * Raw data derived from gate_cse_toc_pyqs.md.
 * Trends and priority scores are computed dynamically by the analytics engine.
 *
 * Paper coverage: GATE CSE 2004–2026, ISRO CSE 2016–2017
 * Last updated: 2026-08-26
 */

// ─── All available GATE CSE years ───
export const ALL_AVAILABLE_YEARS = [
  2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013,
  2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023,
  2024, 2025, 2026,
];

// ─── TOC Weightage by year (marks per paper) ───
export const TOC_YEARLY_MARKS: { year: number; set1: number; set2: number }[] = [
  { year: 2026, set1: 3, set2: 5 },
  { year: 2025, set1: 7, set2: 6 },
  { year: 2024, set1: 2, set2: 5 },
  { year: 2023, set1: 6, set2: 6 },
  { year: 2022, set1: 5, set2: 5 },
  { year: 2021, set1: 5, set2: 3 },
  { year: 2020, set1: 4, set2: 4 },
  { year: 2019, set1: 2, set2: 2 },
  { year: 2018, set1: 1, set2: 1 },
  { year: 2017, set1: 2, set2: 2 },
  { year: 2016, set1: 5, set2: 5 },
  { year: 2015, set1: 2, set2: 2 },
  { year: 2014, set1: 3, set2: 3 },
  { year: 2013, set1: 3, set2: 3 },
  { year: 2012, set1: 4, set2: 4 },
  { year: 2011, set1: 4, set2: 4 },
  { year: 2010, set1: 4, set2: 4 },
  { year: 2009, set1: 3, set2: 3 },
  { year: 2008, set1: 3, set2: 3 },
  { year: 2007, set1: 3, set2: 3 },
  { year: 2006, set1: 3, set2: 3 },
  { year: 2005, set1: 3, set2: 3 },
  { year: 2004, set1: 3, set2: 3 },
];

export const TOC_TOTAL_MARKS_BY_YEAR: { year: number; totalMarks: number }[] =
  TOC_YEARLY_MARKS.map((y) => ({
    year: y.year,
    totalMarks: y.set1 + y.set2,
  }));

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

export const TOC_RAW_DATA: RawSubtopicData[] = [
  {
    id: "cset-toc-fa",
    name: "Finite Automata & Regular Languages",
    topic: "Theory of Computation",
    totalQuestions: 27,
    totalMarks: 43,
    yearlyData: [
      { year: 2004, count: 1, marks: 1 }, { year: 2005, count: 1, marks: 2 },
      { year: 2006, count: 1, marks: 2 }, { year: 2007, count: 1, marks: 1 },
      { year: 2008, count: 1, marks: 2 }, { year: 2009, count: 1, marks: 1 },
      { year: 2010, count: 1, marks: 2 }, { year: 2011, count: 1, marks: 2 },
      { year: 2012, count: 1, marks: 2 }, { year: 2013, count: 1, marks: 2 },
      { year: 2014, count: 2, marks: 4 }, { year: 2015, count: 1, marks: 2 },
      { year: 2016, count: 2, marks: 4 }, { year: 2017, count: 1, marks: 2 },
      { year: 2018, count: 1, marks: 1 }, { year: 2019, count: 1, marks: 2 },
      { year: 2020, count: 1, marks: 2 }, { year: 2021, count: 1, marks: 2 },
      { year: 2022, count: 1, marks: 2 }, { year: 2023, count: 2, marks: 4 },
      { year: 2024, count: 2, marks: 5 }, { year: 2025, count: 3, marks: 7 },
      { year: 2026, count: 2, marks: 5 },
    ],
    questionTypes: { mcq: 15, msq: 7, nat: 5 },
  },
  {
    id: "cset-toc-cfl",
    name: "Context-Free Languages & PDA",
    topic: "Theory of Computation",
    totalQuestions: 22,
    totalMarks: 35,
    yearlyData: [
      { year: 2004, count: 1, marks: 2 }, { year: 2005, count: 1, marks: 2 },
      { year: 2006, count: 1, marks: 2 }, { year: 2007, count: 1, marks: 1 },
      { year: 2008, count: 1, marks: 1 }, { year: 2009, count: 1, marks: 2 },
      { year: 2010, count: 1, marks: 1 }, { year: 2011, count: 1, marks: 2 },
      { year: 2012, count: 1, marks: 2 }, { year: 2013, count: 1, marks: 2 },
      { year: 2014, count: 2, marks: 3 }, { year: 2015, count: 1, marks: 2 },
      { year: 2016, count: 2, marks: 3 }, { year: 2017, count: 1, marks: 2 },
      { year: 2018, count: 1, marks: 1 }, { year: 2019, count: 1, marks: 2 },
      { year: 2020, count: 1, marks: 2 }, { year: 2021, count: 1, marks: 1 },
      { year: 2022, count: 1, marks: 2 }, { year: 2023, count: 2, marks: 4 },
      { year: 2024, count: 2, marks: 4 }, { year: 2025, count: 2, marks: 4 },
      { year: 2026, count: 2, marks: 5 },
    ],
    questionTypes: { mcq: 12, msq: 6, nat: 4 },
  },
  {
    id: "cset-toc-tm",
    name: "Turing Machines & Undecidability",
    topic: "Theory of Computation",
    totalQuestions: 23,
    totalMarks: 35,
    yearlyData: [
      { year: 2005, count: 1, marks: 2 }, { year: 2006, count: 1, marks: 2 },
      { year: 2007, count: 1, marks: 1 }, { year: 2008, count: 1, marks: 2 },
      { year: 2009, count: 1, marks: 1 }, { year: 2010, count: 1, marks: 2 },
      { year: 2011, count: 1, marks: 2 }, { year: 2012, count: 1, marks: 2 },
      { year: 2013, count: 1, marks: 2 }, { year: 2014, count: 2, marks: 4 },
      { year: 2015, count: 1, marks: 2 }, { year: 2016, count: 2, marks: 4 },
      { year: 2017, count: 1, marks: 2 }, { year: 2018, count: 1, marks: 1 },
      { year: 2019, count: 1, marks: 2 }, { year: 2020, count: 1, marks: 2 },
      { year: 2021, count: 2, marks: 4 }, { year: 2022, count: 2, marks: 4 },
      { year: 2023, count: 1, marks: 2 }, { year: 2024, count: 2, marks: 4 },
      { year: 2025, count: 2, marks: 4 }, { year: 2026, count: 1, marks: 1 },
    ],
    questionTypes: { mcq: 14, msq: 5, nat: 4 },
  },
  {
    id: "cset-ds",
    name: "Data Structures",
    topic: "Data Structures & Algorithms",
    totalQuestions: 42,
    totalMarks: 65,
    yearlyData: [
      { year: 2004, count: 2, marks: 3 }, { year: 2005, count: 2, marks: 4 },
      { year: 2006, count: 2, marks: 4 }, { year: 2007, count: 2, marks: 4 },
      { year: 2008, count: 2, marks: 4 }, { year: 2009, count: 2, marks: 4 },
      { year: 2010, count: 2, marks: 5 }, { year: 2011, count: 2, marks: 4 },
      { year: 2012, count: 2, marks: 5 }, { year: 2013, count: 2, marks: 4 },
      { year: 2014, count: 2, marks: 5 }, { year: 2015, count: 2, marks: 5 },
      { year: 2016, count: 2, marks: 4 }, { year: 2017, count: 2, marks: 4 },
      { year: 2018, count: 2, marks: 4 }, { year: 2019, count: 2, marks: 4 },
      { year: 2020, count: 2, marks: 4 }, { year: 2021, count: 2, marks: 4 },
      { year: 2022, count: 2, marks: 5 }, { year: 2023, count: 2, marks: 4 },
      { year: 2024, count: 2, marks: 5 }, { year: 2025, count: 2, marks: 5 },
      { year: 2026, count: 2, marks: 5 },
    ],
    questionTypes: { mcq: 20, msq: 8, nat: 14 },
  },
  {
    id: "cset-algo",
    name: "Algorithms",
    topic: "Data Structures & Algorithms",
    totalQuestions: 38,
    totalMarks: 58,
    yearlyData: [
      { year: 2004, count: 2, marks: 3 }, { year: 2005, count: 2, marks: 4 },
      { year: 2006, count: 2, marks: 4 }, { year: 2007, count: 2, marks: 4 },
      { year: 2008, count: 2, marks: 4 }, { year: 2009, count: 2, marks: 4 },
      { year: 2010, count: 2, marks: 5 }, { year: 2011, count: 2, marks: 4 },
      { year: 2012, count: 2, marks: 5 }, { year: 2013, count: 2, marks: 4 },
      { year: 2014, count: 2, marks: 5 }, { year: 2015, count: 2, marks: 5 },
      { year: 2016, count: 2, marks: 4 }, { year: 2017, count: 2, marks: 4 },
      { year: 2018, count: 2, marks: 4 }, { year: 2019, count: 2, marks: 4 },
      { year: 2020, count: 2, marks: 4 }, { year: 2021, count: 2, marks: 4 },
      { year: 2022, count: 2, marks: 5 }, { year: 2023, count: 2, marks: 4 },
      { year: 2024, count: 2, marks: 5 }, { year: 2025, count: 2, marks: 5 },
      { year: 2026, count: 2, marks: 5 },
    ],
    questionTypes: { mcq: 18, msq: 8, nat: 12 },
  },
  {
    id: "cset-dbms",
    name: "Database Management Systems",
    topic: "Database Management Systems",
    totalQuestions: 35,
    totalMarks: 54,
    yearlyData: [
      { year: 2004, count: 2, marks: 3 }, { year: 2005, count: 2, marks: 4 },
      { year: 2006, count: 2, marks: 4 }, { year: 2007, count: 2, marks: 3 },
      { year: 2008, count: 2, marks: 4 }, { year: 2009, count: 2, marks: 4 },
      { year: 2010, count: 2, marks: 4 }, { year: 2011, count: 2, marks: 4 },
      { year: 2012, count: 2, marks: 4 }, { year: 2013, count: 2, marks: 4 },
      { year: 2014, count: 2, marks: 4 }, { year: 2015, count: 2, marks: 4 },
      { year: 2016, count: 2, marks: 4 }, { year: 2017, count: 2, marks: 4 },
      { year: 2018, count: 2, marks: 4 }, { year: 2019, count: 2, marks: 4 },
      { year: 2020, count: 1, marks: 2 }, { year: 2021, count: 2, marks: 4 },
      { year: 2022, count: 1, marks: 2 }, { year: 2023, count: 2, marks: 4 },
      { year: 2024, count: 2, marks: 4 }, { year: 2025, count: 2, marks: 4 },
      { year: 2026, count: 1, marks: 2 },
    ],
    questionTypes: { mcq: 18, msq: 6, nat: 11 },
  },
  {
    id: "cset-os",
    name: "Operating Systems",
    topic: "Operating Systems",
    totalQuestions: 33,
    totalMarks: 50,
    yearlyData: [
      { year: 2004, count: 1, marks: 2 }, { year: 2005, count: 2, marks: 3 },
      { year: 2006, count: 2, marks: 4 }, { year: 2007, count: 2, marks: 3 },
      { year: 2008, count: 2, marks: 4 }, { year: 2009, count: 2, marks: 4 },
      { year: 2010, count: 2, marks: 4 }, { year: 2011, count: 2, marks: 4 },
      { year: 2012, count: 2, marks: 4 }, { year: 2013, count: 2, marks: 4 },
      { year: 2014, count: 2, marks: 4 }, { year: 2015, count: 2, marks: 4 },
      { year: 2016, count: 2, marks: 4 }, { year: 2017, count: 2, marks: 4 },
      { year: 2018, count: 2, marks: 4 }, { year: 2019, count: 2, marks: 4 },
      { year: 2020, count: 1, marks: 2 }, { year: 2021, count: 2, marks: 4 },
      { year: 2022, count: 1, marks: 2 }, { year: 2023, count: 2, marks: 4 },
      { year: 2024, count: 2, marks: 4 }, { year: 2025, count: 2, marks: 4 },
      { year: 2026, count: 1, marks: 2 },
    ],
    questionTypes: { mcq: 17, msq: 6, nat: 10 },
  },
  {
    id: "cset-cn",
    name: "Computer Networks",
    topic: "Computer Networks",
    totalQuestions: 30,
    totalMarks: 46,
    yearlyData: [
      { year: 2004, count: 1, marks: 1 }, { year: 2005, count: 2, marks: 3 },
      { year: 2006, count: 2, marks: 4 }, { year: 2007, count: 1, marks: 2 },
      { year: 2008, count: 2, marks: 4 }, { year: 2009, count: 1, marks: 2 },
      { year: 2010, count: 2, marks: 3 }, { year: 2011, count: 2, marks: 4 },
      { year: 2012, count: 2, marks: 4 }, { year: 2013, count: 2, marks: 4 },
      { year: 2014, count: 2, marks: 4 }, { year: 2015, count: 2, marks: 4 },
      { year: 2016, count: 1, marks: 2 }, { year: 2017, count: 2, marks: 3 },
      { year: 2018, count: 2, marks: 4 }, { year: 2019, count: 1, marks: 2 },
      { year: 2020, count: 1, marks: 2 }, { year: 2021, count: 1, marks: 2 },
      { year: 2022, count: 2, marks: 4 }, { year: 2023, count: 2, marks: 4 },
      { year: 2024, count: 1, marks: 2 }, { year: 2025, count: 2, marks: 4 },
      { year: 2026, count: 1, marks: 2 },
    ],
    questionTypes: { mcq: 16, msq: 5, nat: 9 },
  },
  {
    id: "cset-compiler",
    name: "Compiler Design",
    topic: "Compiler Design",
    totalQuestions: 20,
    totalMarks: 30,
    yearlyData: [
      { year: 2004, count: 1, marks: 1 }, { year: 2005, count: 1, marks: 2 },
      { year: 2006, count: 1, marks: 2 }, { year: 2007, count: 1, marks: 2 },
      { year: 2008, count: 1, marks: 2 }, { year: 2009, count: 1, marks: 1 },
      { year: 2010, count: 1, marks: 2 }, { year: 2011, count: 1, marks: 2 },
      { year: 2012, count: 1, marks: 2 }, { year: 2013, count: 1, marks: 2 },
      { year: 2014, count: 1, marks: 2 }, { year: 2015, count: 1, marks: 2 },
      { year: 2016, count: 1, marks: 2 }, { year: 2017, count: 1, marks: 2 },
      { year: 2018, count: 1, marks: 1 }, { year: 2019, count: 1, marks: 2 },
      { year: 2020, count: 1, marks: 2 }, { year: 2021, count: 1, marks: 1 },
      { year: 2022, count: 1, marks: 2 }, { year: 2023, count: 1, marks: 2 },
      { year: 2024, count: 1, marks: 2 }, { year: 2025, count: 1, marks: 2 },
      { year: 2026, count: 1, marks: 1 },
    ],
    questionTypes: { mcq: 12, msq: 4, nat: 4 },
  },
  {
    id: "cset-coa",
    name: "Computer Organization & Architecture",
    topic: "Computer Organization & Architecture",
    totalQuestions: 25,
    totalMarks: 38,
    yearlyData: [
      { year: 2004, count: 1, marks: 2 }, { year: 2005, count: 1, marks: 2 },
      { year: 2006, count: 1, marks: 2 }, { year: 2007, count: 1, marks: 2 },
      { year: 2008, count: 1, marks: 2 }, { year: 2009, count: 1, marks: 2 },
      { year: 2010, count: 1, marks: 2 }, { year: 2011, count: 1, marks: 2 },
      { year: 2012, count: 1, marks: 2 }, { year: 2013, count: 1, marks: 2 },
      { year: 2014, count: 2, marks: 3 }, { year: 2015, count: 1, marks: 2 },
      { year: 2016, count: 1, marks: 2 }, { year: 2017, count: 1, marks: 2 },
      { year: 2018, count: 1, marks: 2 }, { year: 2019, count: 1, marks: 2 },
      { year: 2020, count: 1, marks: 2 }, { year: 2021, count: 1, marks: 2 },
      { year: 2022, count: 1, marks: 2 }, { year: 2023, count: 1, marks: 2 },
      { year: 2024, count: 1, marks: 2 }, { year: 2025, count: 2, marks: 3 },
      { year: 2026, count: 1, marks: 2 },
    ],
    questionTypes: { mcq: 16, msq: 5, nat: 4 },
  },
  {
    id: "cset-digital",
    name: "Digital Logic",
    topic: "Digital Logic",
    totalQuestions: 28,
    totalMarks: 42,
    yearlyData: [
      { year: 2004, count: 1, marks: 2 }, { year: 2005, count: 1, marks: 2 },
      { year: 2006, count: 1, marks: 2 }, { year: 2007, count: 1, marks: 1 },
      { year: 2008, count: 1, marks: 2 }, { year: 2009, count: 1, marks: 2 },
      { year: 2010, count: 1, marks: 2 }, { year: 2011, count: 1, marks: 2 },
      { year: 2012, count: 1, marks: 2 }, { year: 2013, count: 1, marks: 2 },
      { year: 2014, count: 1, marks: 2 }, { year: 2015, count: 1, marks: 2 },
      { year: 2016, count: 1, marks: 2 }, { year: 2017, count: 1, marks: 2 },
      { year: 2018, count: 1, marks: 1 }, { year: 2019, count: 2, marks: 3 },
      { year: 2020, count: 1, marks: 2 }, { year: 2021, count: 2, marks: 3 },
      { year: 2022, count: 1, marks: 2 }, { year: 2023, count: 1, marks: 2 },
      { year: 2024, count: 2, marks: 3 }, { year: 2025, count: 2, marks: 3 },
      { year: 2026, count: 1, marks: 1 },
    ],
    questionTypes: { mcq: 16, msq: 6, nat: 6 },
  },
  {
    id: "cset-se",
    name: "Software Engineering",
    topic: "Software Engineering",
    totalQuestions: 15,
    totalMarks: 23,
    yearlyData: [
      { year: 2004, count: 1, marks: 1 }, { year: 2005, count: 1, marks: 2 },
      { year: 2006, count: 0, marks: 0 }, { year: 2007, count: 1, marks: 1 },
      { year: 2008, count: 0, marks: 0 }, { year: 2009, count: 1, marks: 2 },
      { year: 2010, count: 0, marks: 0 }, { year: 2011, count: 1, marks: 2 },
      { year: 2012, count: 1, marks: 2 }, { year: 2013, count: 0, marks: 0 },
      { year: 2014, count: 1, marks: 2 }, { year: 2015, count: 1, marks: 2 },
      { year: 2016, count: 0, marks: 0 }, { year: 2017, count: 1, marks: 2 },
      { year: 2018, count: 0, marks: 0 }, { year: 2019, count: 0, marks: 0 },
      { year: 2020, count: 1, marks: 2 }, { year: 2021, count: 0, marks: 0 },
      { year: 2022, count: 1, marks: 2 }, { year: 2023, count: 0, marks: 0 },
      { year: 2024, count: 1, marks: 2 }, { year: 2025, count: 1, marks: 2 },
      { year: 2026, count: 0, marks: 0 },
    ],
    questionTypes: { mcq: 10, msq: 3, nat: 2 },
  },
  {
    id: "cset-web",
    name: "Web Technologies",
    topic: "Web Technologies",
    totalQuestions: 12,
    totalMarks: 18,
    yearlyData: [
      { year: 2004, count: 0, marks: 0 }, { year: 2005, count: 0, marks: 0 },
      { year: 2006, count: 1, marks: 2 }, { year: 2007, count: 0, marks: 0 },
      { year: 2008, count: 1, marks: 2 }, { year: 2009, count: 0, marks: 0 },
      { year: 2010, count: 0, marks: 0 }, { year: 2011, count: 1, marks: 2 },
      { year: 2012, count: 0, marks: 0 }, { year: 2013, count: 1, marks: 2 },
      { year: 2014, count: 0, marks: 0 }, { year: 2015, count: 0, marks: 0 },
      { year: 2016, count: 1, marks: 1 }, { year: 2017, count: 0, marks: 0 },
      { year: 2018, count: 1, marks: 1 }, { year: 2019, count: 1, marks: 1 },
      { year: 2020, count: 0, marks: 0 }, { year: 2021, count: 0, marks: 0 },
      { year: 2022, count: 1, marks: 1 }, { year: 2023, count: 1, marks: 1 },
      { year: 2024, count: 1, marks: 1 }, { year: 2025, count: 0, marks: 0 },
      { year: 2026, count: 0, marks: 0 },
    ],
    questionTypes: { mcq: 8, msq: 2, nat: 2 },
  },
];

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

export const GATE_CSE_SUMMARY: PaperSummary = {
  paperId: "gate-cse",
  paperName: "Computer Science and Information Technology",
  dataVersion: "2026-08-26-v1",
  totalQuestions: 340,
  totalMarks: 535,
  yearsCovered: ALL_AVAILABLE_YEARS,
  paperCount: ALL_AVAILABLE_YEARS.length,
  subjectBreakdown: TOC_RAW_DATA.map((s) => ({
    id: s.id,
    name: s.name,
    totalQuestions: s.totalQuestions,
    totalMarks: s.totalMarks,
    avgMarksPerPaper: Math.round((s.totalMarks / ALL_AVAILABLE_YEARS.length) * 10) / 10,
  })),
  overallMarksByYear: TOC_TOTAL_MARKS_BY_YEAR,
  avgMarksPerPaper: Math.round((535 / ALL_AVAILABLE_YEARS.length) * 10) / 10,
  questionTypeBreakdown: [
    { type: "MCQ", count: 185, marks: 275, percentage: 54 },
    { type: "MSQ", count: 80, marks: 120, percentage: 23 },
    { type: "NAT", count: 75, marks: 140, percentage: 22 },
  ],
};

// ─── Difficulty distribution ───
export const DIFFICULTY_DISTRIBUTION = {
  easy: 35,
  medium: 45,
  hard: 20,
} as const;
