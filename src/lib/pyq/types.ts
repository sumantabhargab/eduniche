/**
 * PYQ System Types
 */

export interface PYQQuestion {
  id: string;
  questionId: string;
  branchCode: string;
  branchName: string;
  exam: string;
  year: number;
  session?: string;
  questionNumber: number;
  subjectId: string;
  subjectName: string;
  topicId: string;
  topicName: string;
  questionType: "MCQ" | "MSQ" | "NAT";
  marks: number;
  negativeMarks: number;
  questionText: string;
  questionHtml?: string;
  options: string[];
  correctAnswer: string;
  answerExplanation: string;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  source: {
    primary: string;
    url?: string;
    sourceType: "official" | "community" | "aggregator";
    sourceReference?: string;
  };
  answerSource: string;
  answerVerified: boolean;
  verificationConfidence: number;
  qualityTier: "A" | "B" | "C";
  topicConfidence: number;
  imageUrl?: string;
  imageAltText?: string;
  isDuplicate: boolean;
  createdAt: string;
}

export interface PYQFilters {
  branchCode?: string;
  subjectId?: string;
  topicId?: string;
  year?: number;
  yearFrom?: number;
  yearTo?: number;
  questionType?: "MCQ" | "MSQ" | "NAT";
  difficulty?: "easy" | "medium" | "hard";
  marks?: number;
  search?: string;
  verifiedOnly?: boolean;
  sortBy?: "year" | "marks" | "difficulty" | "topic";
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface PYQAttempt {
  id: string;
  questionId: string;
  userId: string;
  selectedAnswer: string | null;
  isCorrect: boolean;
  timeSpentSeconds: number;
  attemptNumber: number;
  practiceMode: "practice" | "exam";
  sessionId: string | null;
  revealedAnswer: boolean;
  createdAt: string;
}

export interface PYQBookmark {
  id: string;
  questionId: string;
  userId: string;
  branchCode: string;
  note?: string;
  createdAt: string;
  question?: PYQQuestion;
}

export interface PYQAnalytics {
  totalQuestions: number;
  branchStats: {
    branchCode: string;
    questionCount: number;
    yearRange: { min: number; max: number };
    yearCount: number;
  }[];
  yearDistribution: { year: number; count: number }[];
  typeDistribution: { type: string; count: number }[];
  marksDistribution: { marks: number; count: number }[];
  topicStats?: {
    topicName: string;
    subject: string;
    questionCount: number;
    totalMarks: number;
    yearRange: { min: number; max: number };
    yearCount: number;
  }[];
  isPremium: boolean;
}

export interface PYQSearchResult {
  id: string;
  questionId: string;
  branchCode: string;
  branchName: string;
  year: number;
  session?: string;
  questionNumber: number;
  subjectName: string;
  topicName: string;
  questionType: string;
  marks: number;
  difficulty: string;
  answerVerified: boolean;
  qualityTier: string;
}

export interface PYQSource {
  id: string;
  questionId: string;
  sourceName: string;
  sourceUrl?: string;
  sourceType: "official" | "community" | "aggregator";
  sourceReference?: string;
  retrievedAt: string;
}
