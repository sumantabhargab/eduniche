/**
 * Core domain types for the Virtual Library module.
 *
 * These types represent the data model for study rooms, chat,
 * study sessions, planning, and the AI doubt engine.
 *
 * This file is the canonical source for all domain types.
 * Adapter-specific types are defined in adapters.ts.
 */

// ─── Participants ────────────────────────────────────────────────────────────

/** A participant in a study room — anonymous, no PII. */
export interface Participant {
  id: string;
  joinedAt: number;
  isMuted: boolean;
  isVideoOn: boolean;
  subject?: string;
  /** Human-readable label like "CSE Student #12" */
  label: string;
}

// ─── Rooms ───────────────────────────────────────────────────────────────────

/** A study room within the virtual library. */
export interface StudyRoom {
  id: string;
  name: string;
  description: string;
  /** GATE branch this room is scoped to (e.g. "cse", "ece") */
  branchId: string;
  /** Optional subject filter within the branch */
  subjectId?: string;
  /** Room mode — drives which UI panels render */
  mode: "focus" | "discussion" | "video";
  /** Current participant count (live, from realtime provider) */
  activeCount: number;
  /** Max participants before queueing */
  maxParticipants: number;
  /** ISO timestamp when room was created */
  createdAt: string;
  /** Whether the room is open for new participants */
  isOpen: boolean;
}

// ─── Chat ────────────────────────────────────────────────────────────────────

/** A single chat message. */
export interface ChatMessage {
  id: string;
  roomId: string;
  authorId: string;
  authorLabel: string;
  content: string;
  /** ISO timestamp */
  timestamp: string;
  type: "text" | "system" | "reaction";
  /** Optional reply chain */
  replyToId?: string;
}

// ─── Study Sessions ──────────────────────────────────────────────────────────

/** Study session states for the state machine. */
export type SessionStatus =
  | "idle"
  | "running"
  | "paused"
  | "completed";

/** A tracked study session. */
export interface StudySession {
  id: string;
  roomId: string;
  participantId: string;
  status: SessionStatus;
  /** GATE branch being studied */
  branchId: string;
  subjectId?: string;
  topic?: string;
  /** Epoch ms when session started (or resumed after pause) */
  startedAt: number;
  /** Cumulative active study ms (excludes paused time) */
  totalFocusMs: number;
  /** Epoch ms of last pause start — used to compute pause duration */
  lastPausedAt?: number;
  /** ISO timestamp of session end */
  endedAt?: string;
}

// ─── Planner ─────────────────────────────────────────────────────────────────

/** Priority for a study task. */
export type TaskPriority = "high" | "medium" | "low";

/** A single study task within a plan. */
export interface StudyTask {
  id: string;
  planId: string;
  title: string;
  branchId: string;
  subjectId?: string;
  topic?: string;
  /** Planned duration in minutes */
  plannedMinutes: number;
  /** Actual focus time in minutes (null if not started) */
  actualMinutes: number | null;
  priority: TaskPriority;
  /** 0-based order within the plan */
  order: number;
  /** Whether the task has been completed */
  completed: boolean;
  /** ISO timestamp of completion */
  completedAt?: string;
  /** ISO timestamp of creation */
  createdAt: string;
  participantId: string;
}

/** Granularity of a study plan. */
export type PlanGranularity = "daily" | "weekly" | "monthly";

/** A study plan grouping tasks. */
export interface StudyPlan {
  id: string;
  participantId: string;
  title: string;
  granularity: PlanGranularity;
  branchId: string;
  /** ISO date string (YYYY-MM-DD) for the plan date */
  date: string;
  /** Total planned minutes across all tasks */
  totalPlannedMinutes: number;
  /** Total actual minutes across completed tasks */
  totalActualMinutes: number;
  /** ISO timestamp of creation */
  createdAt: string;
  /** ISO timestamp of last update */
  updatedAt: string;
  /** Derived: number of completed tasks */
  completedCount: number;
  /** Derived: total number of tasks */
  taskCount: number;
}

// ─── AI Doubt Engine ─────────────────────────────────────────────────────────

/** A doubt submitted to the AI engine. */
export interface DoubtRequest {
  id: string;
  participantId: string;
  roomId?: string;
  /** Raw question text from the user */
  question: string;
  /** Detected or user-selected GATE branch */
  branchId: string;
  subjectId?: string;
  topic?: string;
  /** ISO timestamp */
  createdAt: string;
}

/** AI-generated response to a doubt. */
export interface DoubtResponse {
  id: string;
  requestId: string;
  /** Structured answer text (markdown) */
  answer: string;
  /** Referenced GATE topics */
  references: string[];
  /** Confidence level of the AI response */
  confidence: "high" | "medium" | "low";
  /** ISO timestamp */
  createdAt: string;
  /** Whether the user marked this as helpful */
  wasHelpful?: boolean;
}

// ─── GATE Syllabus ───────────────────────────────────────────────────────────

/** A GATE branch profile shown in room cards and selectors. */
export interface BranchProfile {
  id: string;
  name: string;
  shortName: string;
  icon: string;
  color: string;
  /** Number of available subjects */
  subjectCount: number;
  /** Approximate total marks per year */
  totalMarks: number;
}

/** Full GATE syllabus hierarchy for a branch. */
export interface GATESyllabus {
  branch: BranchProfile;
  subjects: SubjectProfile[];
}

/** A subject within a GATE branch. */
export interface SubjectProfile {
  id: string;
  name: string;
  /** Expected marks weight (0–100) */
  weight: number;
  topics: TopicProfile[];
}

/** A topic within a GATE subject. */
export interface TopicProfile {
  id: string;
  name: string;
  /** Relative importance (0–1) */
  importance: number;
  /** Estimated number of PYQs */
  pyqCount: number;
}

// ─── Placeholder types ───────────────────────────────────────────────────────

/** Paper data source — placeholder for future implementation. */
export type PaperDataSource = "mock" | "api";

/** A GATE question — placeholder for future implementation. */
export interface Question {
  id: string;
  paperId: string;
  subjectId: string;
  topicId?: string;
  text: string;
  options: string[];
  correctOption: number;
  marks: number;
  explanation?: string;
}

// ─── Re-exports from events.ts ───────────────────────────────────────────────

export type {
  LibraryEventName,
  LibraryEventContext,
  LearningEvent,
} from "./events";

export { createBaseLibraryContext } from "./events";
