export type BranchId =
  | "cse"
  | "ece"
  | "ee"
  | "me"
  | "civil"
  | "in"
  | "pi"
  | "ch"
  | "bt"
  | "mt"
  | "xe"
  | "xl"
  | "tf"
  | "pe"
  | "ey"
  | "ma"
  | "ar"
  | "ag"
  | "gg"
  | "ph";

export type Difficulty = "easy" | "medium" | "hard";
export type OptionKey = "A" | "B" | "C" | "D";
export type QuestionStatus = "active" | "inactive";

export interface GameQuestion {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: OptionKey;
  branch: BranchId;
  topic: string;
  difficulty: Difficulty;
  status: QuestionStatus;
  created_at: string;
  updated_at: string;
}

export interface AnswerMapping {
  A: string;
  B: string;
  C: string;
  D: string;
}

export interface FallingTarget {
  id: string;
  letter: OptionKey;
  x: number;
  y: number;
  speed: number;
  drift: number;
  radius: number;
  opacity: number;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  speed: number;
  radius: number;
}

export interface Bomb {
  id: string;
  x: number;
  y: number;
  speed: number;
  drift: number;
  radius: number;
  opacity: number;
}

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type GameState =
  | "idle"
  | "playing"
  | "feedback"
  | "paused"
  | "gameover";

export interface FeedbackState {
  type: "correct" | "wrong" | "bomb_hit" | "missed";
  message: string;
  scoreDelta: number;
  duration: number;
}

export interface GameScore {
  score: number;
  combo: number;
  bestCombo: number;
  lives: number;
  maxLives: number;
  speedMultiplier: number;
  questionsAnswered: number;
  correctAnswers: number;
}

export interface GameSession {
  branch: BranchId;
  score: GameScore;
  currentQuestion: GameQuestion | null;
  questionIndex: number;
  totalQuestions: number;
  state: GameState;
  feedback: FeedbackState | null;
  sessionStart: number;
  usedQuestionIds: Set<string>;
}
