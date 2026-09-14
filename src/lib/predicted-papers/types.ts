/**
 * Predicted Papers — TypeScript interfaces
 */

export type QuestionType = "1MCQ" | "1NAT" | "2MCQ" | "2MSQ" | "2NAT" | "3MCQ";
export type Difficulty = "easy" | "moderate" | "difficult";

export interface PredictedQuestion {
  id: string;
  questionNumber: number;
  subject: string;
  topic: string;
  questionType: QuestionType;
  marks: number;
  negativeMarks: number;
  difficulty: Difficulty;
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  source: string;
}

export interface SubjectBreakdown {
  subject: string;
  marks: number;
  questions: number;
}

export interface PredictedPaper {
  id: string;
  branch: string;
  title: string;
  description: string;
  createdAt: string;
  totalQuestions: number;
  totalMarks: number;
  difficultyDistribution: { easy: number; moderate: number; difficult: number };
  subjectBreakdown: SubjectBreakdown[];
  predictionRationale: string;
  questions: PredictedQuestion[];
}

export interface BranchPapers {
  branch: string;
  branchName: string;
  papers: PredictedPaper[];
}

export interface AllPapers {
  branches: BranchPapers[];
  generatedAt: string;
}
