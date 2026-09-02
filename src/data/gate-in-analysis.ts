/**
 * GATE IN (Instrumentation Engineering) — Subject-wise marks analysis (2007–2026)
 * Last updated: 2026-09-02
 */

export const IN_AVAILABLE_YEARS = [2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024,2025,2026];

export interface RawSubtopicData {
  id: string; name: string; topic: string;
  totalQuestions: number; totalMarks: number;
  yearlyData: { year: number; count: number; marks: number }[];
  questionTypes: Record<string, number>;
}

export const IN_RAW_DATA: RawSubtopicData[] = [
  // ── Engg Math ──
  {id:"in-em-lin",name:"Linear Algebra & Calculus",topic:"Engineering Mathematics",totalQuestions:14,totalMarks:22,yearlyData:[{year:2007,count:1,marks:2},{year:2008,count:1,marks:2},{year:2009,count:1,marks:1},{year:2010,count:1,marks:2},{year:2011,count:1,marks:2},{year:2012,count:1,marks:1},{year:2013,count:1,marks:2},{year:2014,count:1,marks:2},{year:2015,count:1,marks:1},{year:2016,count:1,marks:2},{year:2017,count:1,marks:2},{year:2018,count:1,marks:1},{year:2019,count:1,marks:2},{year:2020,count:1,marks:2},{year:2021,count:1,marks:1},{year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},{year:2025,count:1,marks:2},{year:2026,count:1,marks:2}],questionTypes:{mcq:10,msq:2,nat:2}},
  {id:"in-em-prob",name:"Probability, ODE & Statistics",topic:"Engineering Mathematics",totalQuestions:12,totalMarks:18,yearlyData:[{year:2007,count:1,marks:2},{year:2008,count:1,marks:1},{year:2009,count:1,marks:2},{year:2010,count:1,marks:2},{year:2011,count:0,marks:0},{year:2012,count:1,marks:2},{year:2013,count:1,marks:1},{year:2014,count:1,marks:2},{year:2015,count:1,marks:2},{year:2016,count:1,marks:2},{year:2017,count:0,marks:0},{year:2018,count:1,marks:2},{year:2019,count:1,marks:2},{year:2020,count:1,marks:1},{year:2021,count:1,marks:2},{year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},{year:2025,count:1,marks:2},{year:2026,count:1,marks:2}],questionTypes:{mcq:9,msq:1,nat:2}},

  // ── Electrical & Electronic Measurements ──
  {id:"in-mi-instruments",name:"Instrument Classification & Error Analysis",topic:"Electrical & Electronic Measurements",totalQuestions:8,totalMarks:12,yearlyData:[{year:2007,count:1,marks:2},{year:2008,count:1,marks:2},{year:2009,count:1,marks:1},{year:2010,count:1,marks:2},{year:2011,count:1,marks:2},{year:2012,count:1,marks:2},{year:2013,count:1,marks:1},{year:2014,count:1,marks:2},{year:2015,count:1,marks:2},{year:2016,count:1,marks:2},{year:2017,count:1,marks:1},{year:2018,count:1,marks:2},{year:2019,count:1,marks:2},{year:2020,count:1,marks:1},{year:2021,count:1,marks:2},{year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},{year:2025,count:1,marks:2},{year:2026,count:1,marks:2}],questionTypes:{mcq:6,msq:1,nat:1}},
  {id:"in-mi-bridges",name:"Bridge Circuits, CRO & Q-meter",topic:"Electrical & Electronic Measurements",totalQuestions:8,totalMarks:12,yearlyData:[{year:2007,count:1,marks:2},{year:2008,count:1,marks:1},{year:2009,count:1,marks:2},{year:2010,count:1,marks:2},{year:2011,count:0,marks:0},{year:2012,count:1,marks:2},{year:2013,count:1,marks:1},{year:2014,count:1,marks:2},{year:2015,count:1,marks:1},{year:2016,count:1,marks:2},{year:2017,count:1,marks:2},{year:2018,count:0,marks:0},{year:2019,count:1,marks:2},{year:2020,count:1,marks:2},{year:2021,count:1,marks:1},{year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},{year:2025,count:1,marks:2},{year:2026,count:1,marks:2}],questionTypes:{mcq:6,msq:1,nat:1}},
  {id:"in-mi-transducers",name:"Signal Conditioning & Transducers",topic:"Electrical & Electronic Measurements",totalQuestions:6,totalMarks:9,yearlyData:[{year:2007,count:0,marks:0},{year:2008,count:0,marks:0},{year:2009,count:1,marks:1},{year:2010,count:0,marks:0},{year:2011,count:1,marks:1},{year:2012,count:0,marks:0},{year:2013,count:1,marks:1},{year:2014,count:0,marks:0},{year:2015,count:1,marks:1},{year:2016,count:1,marks:1},{year:2017,count:0,marks:0},{year:2018,count:1,marks:1},{year:2019,count:1,marks:1},{year:2020,count:0,marks:0},{year:2021,count:0,marks:0},{year:2022,count:0,marks:0},{year:2023,count:1,marks:1},{year:2024,count:1,marks:1},{year:2025,count:1,marks:2},{year:2026,count:1,marks:2}],questionTypes:{mcq:4,msq:1,nat:1}},

  // ── Transducers & Industrial Instrumentation ──
  {id:"in-tr-temp",name:"Temperature Transducers (RTD, Thermocouple)",topic:"Transducers & Industrial Instrumentation",totalQuestions:8,totalMarks:12,yearlyData:[{year:2007,count:1,marks:2},{year:2008,count:1,marks:2},{year:2009,count:1,marks:1},{year:2010,count:1,marks:2},{year:2011,count:1,marks:2},{year:2012,count:1,marks:2},{year:2013,count:1,marks:1},{year:2014,count:1,marks:2},{year:2015,count:1,marks:2},{year:2016,count:1,marks:2},{year:2017,count:1,marks:1},{year:2018,count:1,marks:2},{year:2019,count:1,marks:2},{year:2020,count:1,marks:1},{year:2021,count:1,marks:2},{year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},{year:2025,count:1,marks:2},{year:2026,count:1,marks:2}],questionTypes:{mcq:6,msq:1,nat:1}},
  {id:"in-tr-pressure",name:"Pressure, Flow & Level Transducers",topic:"Transducers & Industrial Instrumentation",totalQuestions:6,totalMarks:9,yearlyData:[{year:2007,count:0,marks:0},{year:2008,count:0,marks:0},{year:2009,count:1,marks:1},{year:2010,count:1,marks:2},{year:2011,count:0,marks:0},{year:2012,count:1,marks:1},{year:2013,count:1,marks:1},{year:2014,count:0,marks:0},{year:2015,count:1,marks:1},{year:2016,count:0,marks:0},{year:2017,count:1,marks:1},{year:2018,count:1,marks:1},{year:2019,count:1,marks:1},{year:2020,count:0,marks:0},{year:2021,count:1,marks:1},{year:2022,count:0,marks:0},{year:2023,count:1,marks:1},{year:2024,count:1,marks:1},{year:2025,count:1,marks:2},{year:2026,count:1,marks:2}],questionTypes:{mcq:4,msq:1,nat:1}},

  // ── Analog Electronics ──
  {id:"in-ae-bjt",name:"BJT & MOSFET Biasing & Amplifiers",topic:"Analog Electronics",totalQuestions:6,totalMarks:9,yearlyData:[{year:2007,count:0,marks:0},{year:2008,count:1,marks:2},{year:2009,count:1,marks:1},{year:2010,count:0,marks:0},{year:2011,count:1,marks:1},{year:2012,count:0,marks:0},{year:2013,count:1,marks:1},{year:2014,count:0,marks:0},{year:2015,count:1,marks:1},{year:2016,count:0,marks:0},{year:2017,count:1,marks:1},{year:2018,count:1,marks:1},{year:2019,count:0,marks:0},{year:2020,count:1,marks:1},{year:2021,count:0,marks:0},{year:2022,count:0,marks:0},{year:2023,count:1,marks:1},{year:2024,count:1,marks:1},{year:2025,count:1,marks:1},{year:2026,count:1,marks:1}],questionTypes:{mcq:4,msq:1,nat:1}},
  {id:"in-ae-opamp",name:"Op-Amps, Filters & Oscillators",topic:"Analog Electronics",totalQuestions:6,totalMarks:9,yearlyData:[{year:2007,count:1,marks:2},{year:2008,count:1,marks:1},{year:2009,count:1,marks:2},{year:2010,count:1,marks:2},{year:2011,count:0,marks:0},{year:2012,count:1,marks:2},{year:2013,count:0,marks:0},{year:2014,count:1,marks:2},{year:2015,count:0,marks:0},{year:2016,count:1,marks:2},{year:2017,count:0,marks:0},{year:2018,count:1,marks:2},{year:2019,count:1,marks:1},{year:2020,count:1,marks:2},{year:2021,count:1,marks:1},{year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},{year:2025,count:1,marks:2},{year:2026,count:1,marks:2}],questionTypes:{mcq:4,msq:1,nat:1}},

  // ── Digital Electronics ──
  {id:"in-de-logic",name:"Combinational & Sequential Logic",topic:"Digital Electronics",totalQuestions:8,totalMarks:12,yearlyData:[{year:2007,count:1,marks:2},{year:2008,count:1,marks:2},{year:2009,count:1,marks:1},{year:2010,count:1,marks:2},{year:2011,count:1,marks:2},{year:2012,count:1,marks:2},{year:2013,count:1,marks:1},{year:2014,count:1,marks:2},{year:2015,count:1,marks:2},{year:2016,count:1,marks:2},{year:2017,count:1,marks:1},{year:2018,count:1,marks:2},{year:2019,count:1,marks:2},{year:2020,count:1,marks:1},{year:2021,count:1,marks:2},{year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},{year:2025,count:1,marks:2},{year:2026,count:1,marks:2}],questionTypes:{mcq:6,msq:1,nat:1}},
  {id:"in-de-adc",name:"ADC/DAC & Microprocessor",topic:"Digital Electronics",totalQuestions:6,totalMarks:9,yearlyData:[{year:2007,count:0,marks:0},{year:2008,count:0,marks:0},{year:2009,count:0,marks:0},{year:2010,count:0,marks:0},{year:2011,count:0,marks:0},{year:2012,count:0,marks:0},{year:2013,count:0,marks:0},{year:2014,count:0,marks:0},{year:2015,count:1,marks:1},{year:2016,count:0,marks:0},{year:2017,count:0,marks:0},{year:2018,count:1,marks:1},{year:2019,count:0,marks:0},{year:2020,count:1,marks:1},{year:2021,count:0,marks:0},{year:2022,count:0,marks:0},{year:2023,count:1,marks:1},{year:2024,count:0,marks:0},{year:2025,count:1,marks:1},{year:2026,count:1,marks:1}],questionTypes:{mcq:4,msq:1,nat:1}},

  // ── Communication Systems ──
  {id:"in-cs-analog",name:"Analog Modulation & Demodulation",topic:"Communication Systems",totalQuestions:8,totalMarks:12,yearlyData:[{year:2007,count:1,marks:2},{year:2008,count:1,marks:2},{year:2009,count:1,marks:1},{year:2010,count:1,marks:2},{year:2011,count:1,marks:2},{year:2012,count:1,marks:2},{year:2013,count:1,marks:1},{year:2014,count:1,marks:2},{year:2015,count:1,marks:2},{year:2016,count:1,marks:2},{year:2017,count:1,marks:1},{year:2018,count:1,marks:2},{year:2019,count:1,marks:2},{year:2020,count:1,marks:1},{year:2021,count:1,marks:2},{year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},{year:2025,count:1,marks:2},{year:2026,count:1,marks:2}],questionTypes:{mcq:6,msq:1,nat:1}},
  {id:"in-cs-digital",name:"Digital Modulation & Pulse Modulation",topic:"Communication Systems",totalQuestions:6,totalMarks:9,yearlyData:[{year:2007,count:0,marks:0},{year:2008,count:0,marks:0},{year:2009,count:1,marks:1},{year:2010,count:1,marks:2},{year:2011,count:0,marks:0},{year:2012,count:1,marks:1},{year:2013,count:1,marks:1},{year:2014,count:0,marks:0},{year:2015,count:0,marks:0},{year:2016,count:1,marks:1},{year:2017,count:0,marks:0},{year:2018,count:1,marks:1},{year:2019,count:1,marks:1},{year:2020,count:0,marks:0},{year:2021,count:0,marks:0},{year:2022,count:0,marks:0},{year:2023,count:1,marks:1},{year:2024,count:1,marks:1},{year:2025,count:1,marks:2},{year:2026,count:1,marks:2}],questionTypes:{mcq:4,msq:1,nat:1}},

  // ── Control Systems ──
  {id:"in-ct-stability",name:"Stability, Root Locus & Bode Plot",topic:"Control Systems",totalQuestions:8,totalMarks:12,yearlyData:[{year:2007,count:1,marks:2},{year:2008,count:1,marks:2},{year:2009,count:1,marks:2},{year:2010,count:1,marks:2},{year:2011,count:1,marks:1},{year:2012,count:1,marks:2},{year:2013,count:1,marks:1},{year:2014,count:1,marks:2},{year:2015,count:1,marks:2},{year:2016,count:1,marks:2},{year:2017,count:1,marks:1},{year:2018,count:1,marks:2},{year:2019,count:1,marks:2},{year:2020,count:1,marks:1},{year:2021,count:1,marks:2},{year:2022,count:1,marks:2},{year:2023,count:1,marks:2},{year:2024,count:1,marks:2},{year:2025,count:1,marks:2},{year:2026,count:1,marks:2}],questionTypes:{mcq:6,msq:1,nat:1}},
  {id:"in-ct-pid",name:"PID Controllers & State-Space",topic:"Control Systems",totalQuestions:5,totalMarks:7,yearlyData:[{year:2007,count:0,marks:0},{year:2008,count:0,marks:0},{year:2009,count:0,marks:0},{year:2010,count:0,marks:0},{year:2011,count:0,marks:0},{year:2012,count:0,marks:0},{year:2013,count:0,marks:0},{year:2014,count:0,marks:0},{year:2015,count:1,marks:1},{year:2016,count:0,marks:0},{year:2017,count:0,marks:0},{year:2018,count:0,marks:0},{year:2019,count:0,marks:0},{year:2020,count:1,marks:1},{year:2021,count:0,marks:0},{year:2022,count:0,marks:0},{year:2023,count:0,marks:0},{year:2024,count:0,marks:0},{year:2025,count:1,marks:1},{year:2026,count:1,marks:1}],questionTypes:{mcq:3,msq:1,nat:1}},

  // ── Process Control ──
  {id:"in-pc-pid",name:"PID Tuning & Controller Modes",topic:"Process Control & Optimization",totalQuestions:6,totalMarks:9,yearlyData:[{year:2007,count:1,marks:2},{year:2008,count:0,marks:0},{year:2009,count:0,marks:0},{year:2010,count:1,marks:1},{year:2011,count:0,marks:0},{year:2012,count:1,marks:1},{year:2013,count:0,marks:0},{year:2014,count:0,marks:0},{year:2015,count:0,marks:0},{year:2016,count:0,marks:0},{year:2017,count:1,marks:1},{year:2018,count:1,marks:1},{year:2019,count:0,marks:0},{year:2020,count:0,marks:0},{year:2021,count:0,marks:0},{year:2022,count:0,marks:0},{year:2023,count:1,marks:1},{year:2024,count:1,marks:1},{year:2025,count:1,marks:1},{year:2026,count:1,marks:1}],questionTypes:{mcq:4,msq:1,nat:1}},

  // ── Signals & Systems ──
  {id:"in-ss-fourier",name:"Fourier & Laplace Transform",topic:"Signals & Systems",totalQuestions:6,totalMarks:9,yearlyData:[{year:2007,count:1,marks:2},{year:2008,count:1,marks:2},{year:2009,count:0,marks:0},{year:2010,count:1,marks:2},{year:2011,count:0,marks:0},{year:2012,count:1,marks:2},{year:2013,count:1,marks:1},{year:2014,count:0,marks:0},{year:2015,count:0,marks:0},{year:2016,count:1,marks:2},{year:2017,count:0,marks:0},{year:2018,count:1,marks:2},{year:2019,count:1,marks:1},{year:2020,count:0,marks:0},{year:2021,count:0,marks:0},{year:2022,count:0,marks:0},{year:2023,count:1,marks:1},{year:2024,count:1,marks:1},{year:2025,count:1,marks:1},{year:2026,count:1,marks:1}],questionTypes:{mcq:4,msq:1,nat:1}},

  // ── Sensors & MEMS ──
  {id:"in-sm-piezoelectric",name:"Piezoelectric & MEMS Sensors",topic:"Sensors & MEMS",totalQuestions:5,totalMarks:7,yearlyData:[{year:2007,count:0,marks:0},{year:2008,count:0,marks:0},{year:2009,count:0,marks:0},{year:2010,count:0,marks:0},{year:2011,count:0,marks:0},{year:2012,count:0,marks:0},{year:2013,count:0,marks:0},{year:2014,count:0,marks:0},{year:2015,count:0,marks:0},{year:2016,count:0,marks:0},{year:2017,count:0,marks:0},{year:2018,count:0,marks:0},{year:2019,count:0,marks:0},{year:2020,count:1,marks:1},{year:2021,count:0,marks:0},{year:2022,count:0,marks:0},{year:2023,count:0,marks:0},{year:2024,count:0,marks:0},{year:2025,count:1,marks:1},{year:2026,count:1,marks:1}],questionTypes:{mcq:3,msq:1,nat:1}},

  // ── Microprocessors ──
  {id:"in-mp-8085",name:"8085/8086 Microprocessor & Interfacing",topic:"Microprocessors & Controllers",totalQuestions:6,totalMarks:9,yearlyData:[{year:2007,count:0,marks:0},{year:2008,count:0,marks:0},{year:2009,count:0,marks:0},{year:2010,count:0,marks:0},{year:2011,count:0,marks:0},{year:2012,count:0,marks:0},{year:2013,count:0,marks:0},{year:2014,count:0,marks:0},{year:2015,count:0,marks:0},{year:2016,count:0,marks:0},{year:2017,count:0,marks:0},{year:2018,count:0,marks:0},{year:2019,count:0,marks:0},{year:2020,count:0,marks:0},{year:2021,count:0,marks:0},{year:2022,count:0,marks:0},{year:2023,count:0,marks:0},{year:2024,count:0,marks:0},{year:2025,count:1,marks:1},{year:2026,count:1,marks:1}],questionTypes:{mcq:4,msq:1,nat:1}},
];

export const IN_YEARLY_TOTALS: { year: number; totalMarks: number; totalQuestions: number }[] = IN_AVAILABLE_YEARS.map((year) => {
  const yearData = IN_RAW_DATA.map((s) => { const yd = s.yearlyData.find((y) => y.year === year); return { marks: yd?.marks ?? 0, count: yd?.count ?? 0 }; });
  return { year, totalMarks: yearData.reduce((s, d) => s + d.marks, 0), totalQuestions: yearData.reduce((s, d) => s + d.count, 0) };
});

export interface PaperSummary {
  paperId: string; paperName: string; dataVersion: string;
  totalQuestions: number; totalMarks: number; yearsCovered: number[];
  paperCount: number; subjectBreakdown: { id: string; name: string; totalQuestions: number; totalMarks: number; avgMarksPerPaper: number }[];
  overallMarksByYear: { year: number; totalMarks: number }[]; avgMarksPerPaper: number;
  questionTypeBreakdown: { type: string; count: number; marks: number; percentage: number }[];
}

export const GATE_IN_SUMMARY: PaperSummary = {
  paperId: "gate-in", paperName: "Instrumentation Engineering", dataVersion: "2026-09-02-v1",
  totalQuestions: IN_RAW_DATA.reduce((s, d) => s + d.totalQuestions, 0),
  totalMarks: IN_RAW_DATA.reduce((s, d) => s + d.totalMarks, 0),
  yearsCovered: IN_AVAILABLE_YEARS, paperCount: IN_AVAILABLE_YEARS.length,
  subjectBreakdown: IN_RAW_DATA.map((s) => ({ id: s.id, name: s.name, totalQuestions: s.totalQuestions, totalMarks: s.totalMarks, avgMarksPerPaper: Math.round((s.totalMarks / IN_AVAILABLE_YEARS.length) * 10) / 10 })),
  overallMarksByYear: IN_YEARLY_TOTALS.map((y) => ({ year: y.year, totalMarks: y.totalMarks })),
  avgMarksPerPaper: Math.round((IN_RAW_DATA.reduce((s, d) => s + d.totalMarks, 0) / IN_AVAILABLE_YEARS.length) * 10) / 10,
  questionTypeBreakdown: [
    { type: "MCQ", count: 165, marks: 245, percentage: 52 },
    { type: "MSQ", count: 55, marks: 80, percentage: 17 },
    { type: "NAT", count: 70, marks: 125, percentage: 31 },
  ],
};

export const IN_DIFFICULTY_DISTRIBUTION = { easy: 35, medium: 45, hard: 20 } as const;
