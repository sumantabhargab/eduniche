/**
 * Adapter interfaces for the Virtual Library module.
 *
 * All external dependencies are abstracted behind these interfaces so
 * implementations can be swapped (mock for dev, Supabase for prod,
 * WebRTC for video, etc.) without touching the business logic.
 *
 * These interfaces import their domain types from ./index to avoid
 * duplication. There is no circular dependency because ./index does
 * not import from this file.
 */

// ─── Domain type imports ─────────────────────────────────────────────────────

import type {
  Participant,
  StudyRoom,
  ChatMessage,
  StudySession,
  StudyTask,
  StudyPlan,
  DoubtRequest,
  DoubtResponse,
  SessionStatus,
  TaskPriority,
  PlanGranularity,
} from "./index";

// ─── Auth ──────────────────────────────────────────────────────────────────

/** Minimal auth context for the library — no real auth system. */
export interface LibraryAuthContext {
  /** Stable anonymous identifier for the current user */
  readonly anonymousId: string;
  /** Human-readable label for the current user */
  readonly label: string;
  /** Whether the user is allowed to join rooms */
  readonly canJoinRooms: boolean;
}

// ─── Video Provider ─────────────────────────────────────────────────────────

export interface VideoProvider {
  readonly enabled: boolean;

  /** Start local camera/mic capture */
  startLocalStream(): Promise<MediaStream>;

  /** Stop and release local stream */
  stopLocalStream(): void;

  /** Toggle mic mute */
  toggleMute(): void;

  /** Toggle camera on/off */
  toggleCamera(): void;

  /** Get current muted state */
  isMuted(): boolean;

  /** Get current camera state */
  isVideoOn(): boolean;

  /** Local stream for rendering in a video tile */
  getLocalStream(): MediaStream | null;
}

// ─── Chat Provider ──────────────────────────────────────────────────────────

export interface ChatProvider {
  /** Whether the chat provider is active */
  readonly enabled: boolean;

  /** Check whether the user is authenticated */
  isAuthenticated(): Promise<boolean>;

  /** Subscribe to new messages in a room */
  subscribe(
    roomId: string,
    onMessage: (message: ChatMessage) => void,
  ): () => void;

  /** Send a text message to a room */
  sendMessage(roomId: string, content: string, type?: ChatMessage["type"]): Promise<ChatMessage>;

  /** Fetch recent message history for a room */
  getHistory(roomId: string, limit?: number): Promise<ChatMessage[]>;
}

// ─── AI Provider ────────────────────────────────────────────────────────────

export interface AIProvider {
  /** Submit a doubt and get an AI-generated response */
  askDoubt(request: DoubtRequest): Promise<DoubtResponse>;

  /** Check whether the AI provider is available */
  readonly available: boolean;
}

// ─── Realtime Provider ──────────────────────────────────────────────────────

export interface RealtimeProvider {
  /** Subscribe to room presence changes */
  subscribePresence(
    roomId: string,
    onChange: (participants: Participant[]) => void,
  ): () => void;

  /** Announce presence in a room */
  announcePresence(roomId: string, participant: Participant): () => void;

  /** Subscribe to room state changes (open/closed, counts) */
  subscribeRoom(roomId: string, onChange: (room: StudyRoom) => void): () => void;
}

// ─── Database Adapter ───────────────────────────────────────────────────────

export interface DatabaseAdapter {
  /** Fetch available study rooms, optionally filtered by branch */
  getRooms(branchId?: string): Promise<StudyRoom[]>;

  /** Fetch a single room by ID */
  getRoom(roomId: string): Promise<StudyRoom | null>;

  /** Create a new study room */
  createRoom(room: Omit<StudyRoom, "id" | "createdAt">): Promise<StudyRoom>;

  /** Update room state (open/closed, active count) */
  updateRoom(roomId: string, patch: Partial<StudyRoom>): Promise<StudyRoom>;

  /** Fetch study tasks for a participant */
  getTasks(participantId: string, planId?: string): Promise<StudyTask[]>;

  /** Save (create or update) a study task */
  saveTask(task: StudyTask): Promise<StudyTask>;

  /** Toggle task completion */
  toggleTask(taskId: string, completed: boolean): Promise<StudyTask>;

  /** Fetch study plans for a participant */
  getPlans(participantId: string, date?: string): Promise<StudyPlan[]>;

  /** Create a new study plan */
  createPlan(plan: Omit<StudyPlan, "id" | "createdAt" | "updatedAt">): Promise<StudyPlan>;

  /** Persist a study session */
  saveSession(session: StudySession): Promise<StudySession>;

  /** Persist a doubt request */
  saveDoubt(request: DoubtRequest): Promise<DoubtRequest>;

  /** Persist a doubt response */
  saveDoubtResponse(response: DoubtResponse): Promise<DoubtResponse>;
}

// ─── Analytics Adapter ──────────────────────────────────────────────────────

import type { LearningEvent, LibraryEventContext } from "./events";

export interface AnalyticsAdapter {
  /** Track a learning event */
  track(event: LearningEvent): void;

  /** Flush any batched events immediately */
  flush(): Promise<void>;
}
