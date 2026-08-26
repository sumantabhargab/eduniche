export interface GATEPaper {
  id: string;
  code: string;
  name: string;
  shortName: string;
  description: string;
  exam: string;
  processingStatus: "available" | "processing" | "unavailable";
  dataCoverage: number; // percentage of years with data
  subjectCount: number;
  questionCount: number;
  availableYears: number[];
  totalSessions: number;
  difficultyLevel: "low" | "medium" | "high" | "very-high";
  estimatedQuestionHours: string;
  monthlyActiveLearners: string;
}

export interface PAPER_METADATA {
  id: string;
  code: string;
  name: string;
  shortName: string;
  description: string;
  exam: string;
  processingStatus: "available" | "processing" | "unavailable";
  dataCoverage: number;
  subjectCount: number;
  questionCount: number;
  availableYears: number[];
  totalSessions: number;
  difficultyLevel: "low" | "medium" | "high" | "very-high";
  estimatedQuestionHours: string;
  monthlyActiveLearners: string;
}

export const PAPERS: GATEPaper[] = [
  {
    id: "cse",
    code: "CS",
    name: "Computer Science and Information Technology",
    shortName: "CSE",
    description: "Algorithms, Data Structures, DBMS, OS, CN, TOC, COA, and more.",
    exam: "GATE",
    processingStatus: "available",
    dataCoverage: 73,
    subjectCount: 10,
    questionCount: 1247,
    availableYears: [2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
    totalSessions: 27,
    difficultyLevel: "high",
    estimatedQuestionHours: "8,500+",
    monthlyActiveLearners: "120K+",
  },
  {
    id: "ece",
    code: "EC",
    name: "Electronics and Communication Engineering",
    shortName: "ECE",
    description: "Network Theory, Signal Systems, Control Systems, Digital Electronics, and more.",
    exam: "GATE",
    processingStatus: "available",
    dataCoverage: 71,
    subjectCount: 10,
    questionCount: 1189,
    availableYears: [2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
    totalSessions: 27,
    difficultyLevel: "high",
    estimatedQuestionHours: "7,800+",
    monthlyActiveLearners: "95K+",
  },
  {
    id: "me",
    code: "ME",
    name: "Mechanical Engineering",
    shortName: "ME",
    description: "Engineering Mechanics, SOM, TOM, Heat Transfer, and more.",
    exam: "GATE",
    processingStatus: "available",
    dataCoverage: 68,
    subjectCount: 10,
    questionCount: 1056,
    availableYears: [2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
    totalSessions: 27,
    difficultyLevel: "high",
    estimatedQuestionHours: "7,200+",
    monthlyActiveLearners: "85K+",
  },
  {
    id: "civil",
    code: "CE",
    name: "Civil Engineering",
    shortName: "Civil",
    description: "Structural Engineering, Geotechnical, Transportation, and more.",
    exam: "GATE",
    processingStatus: "available",
    dataCoverage: 65,
    subjectCount: 10,
    questionCount: 934,
    availableYears: [2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
    totalSessions: 27,
    difficultyLevel: "high",
    estimatedQuestionHours: "6,500+",
    monthlyActiveLearners: "70K+",
  },
  {
    id: "ee",
    code: "EE",
    name: "Electrical Engineering",
    shortName: "EE",
    description: "Electrical Machines, Power Systems, Control Systems, Signals, and more.",
    exam: "GATE",
    processingStatus: "available",
    dataCoverage: 67,
    subjectCount: 10,
    questionCount: 978,
    availableYears: [2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
    totalSessions: 27,
    difficultyLevel: "high",
    estimatedQuestionHours: "6,900+",
    monthlyActiveLearners: "75K+",
  },
  {
    id: "in",
    code: "IN",
    name: "Instrumentation Engineering",
    shortName: "IN",
    description: "Sensors, Measurement, Control, Digital Electronics, and more.",
    exam: "GATE",
    processingStatus: "available",
    dataCoverage: 62,
    subjectCount: 8,
    questionCount: 756,
    availableYears: [2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
    totalSessions: 27,
    difficultyLevel: "medium",
    estimatedQuestionHours: "5,100+",
    monthlyActiveLearners: "35K+",
  },
  {
    id: "pi",
    code: "PI",
    name: "Production and Industrial Engineering",
    shortName: "PI",
    description: "Manufacturing, Industrial Engineering, Thermodynamics, and more.",
    exam: "GATE",
    processingStatus: "available",
    dataCoverage: 58,
    subjectCount: 8,
    questionCount: 612,
    availableYears: [2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
    totalSessions: 27,
    difficultyLevel: "medium",
    estimatedQuestionHours: "4,800+",
    monthlyActiveLearners: "28K+",
  },
  {
    id: "cs",
    code: "CS",
    name: "Computer Science (old code)",
    shortName: "CSE (legacy)",
    description: "Same as Computer Science and Information Technology (CS). Use the CSE paper.",
    exam: "GATE",
    processingStatus: "unavailable",
    dataCoverage: 0,
    subjectCount: 0,
    questionCount: 0,
    availableYears: [],
    totalSessions: 0,
    difficultyLevel: "low",
    estimatedQuestionHours: "—",
    monthlyActiveLearners: "—",
  },
  {
    id: "ch",
    code: "CH",
    name: "Chemical Engineering",
    shortName: "CH",
    description: "Process Engineering, Mass Transfer, Heat Transfer, and more.",
    exam: "GATE",
    processingStatus: "processing",
    dataCoverage: 0,
    subjectCount: 0,
    questionCount: 0,
    availableYears: [],
    totalSessions: 0,
    difficultyLevel: "low",
    estimatedQuestionHours: "—",
    monthlyActiveLearners: "—",
  },
  {
    id: "ag",
    code: "AG",
    name: "Agricultural Engineering",
    shortName: "AG",
    description: "Farm Machinery, Soil and Water, Food Processing, and more.",
    exam: "GATE",
    processingStatus: "unavailable",
    dataCoverage: 0,
    subjectCount: 0,
    questionCount: 0,
    availableYears: [],
    totalSessions: 0,
    difficultyLevel: "low",
    estimatedQuestionHours: "—",
    monthlyActiveLearners: "—",
  },
  {
    id: "ar",
    code: "AR",
    name: "Architecture and Planning",
    shortName: "AR",
    description: "Architecture, Planning, and Design.",
    exam: "GATE",
    processingStatus: "unavailable",
    dataCoverage: 0,
    subjectCount: 0,
    questionCount: 0,
    availableYears: [],
    totalSessions: 0,
    difficultyLevel: "low",
    estimatedQuestionHours: "—",
    monthlyActiveLearners: "—",
  },
  {
    id: "bt",
    code: "BT",
    name: "Biotechnology",
    shortName: "BT",
    description: "Biotechnology fundamentals.",
    exam: "GATE",
    processingStatus: "unavailable",
    dataCoverage: 0,
    subjectCount: 0,
    questionCount: 0,
    availableYears: [],
    totalSessions: 0,
    difficultyLevel: "low",
    estimatedQuestionHours: "—",
    monthlyActiveLearners: "—",
  },
  {
    id: "ma",
    code: "MA",
    name: "Mathematics",
    shortName: "MA",
    description: "Engineering Mathematics.",
    exam: "GATE",
    processingStatus: "unavailable",
    dataCoverage: 0,
    subjectCount: 0,
    questionCount: 0,
    availableYears: [],
    totalSessions: 0,
    difficultyLevel: "low",
    estimatedQuestionHours: "—",
    monthlyActiveLearners: "—",
  },
  {
    id: "ph",
    code: "PH",
    name: "Physics",
    shortName: "PH",
    description: "Engineering Physics.",
    exam: "GATE",
    processingStatus: "unavailable",
    dataCoverage: 0,
    subjectCount: 0,
    questionCount: 0,
    availableYears: [],
    totalSessions: 0,
    difficultyLevel: "low",
    estimatedQuestionHours: "—",
    monthlyActiveLearners: "—",
  },
];

export const EXAM_MAP: Record<string, GATEPaper[]> = {
  GATE: PAPERS,
};

export function getPaperById(id: string): GATEPaper | undefined {
  return PAPERS.find((p) => p.id === id);
}

export function getPaperByCode(code: string): GATEPaper | undefined {
  return PAPERS.find((p) => p.code === code);
}
