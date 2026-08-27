/**
 * Domain event types for the Virtual Library module.
 *
 * Events follow a `{module}_{action}` naming convention and carry a
 * strongly-typed context object so listeners can filter precisely.
 */

// ─── Event Names ────────────────────────────────────────────────────────────

/** All possible library event names. */
export type LibraryEventName =
  // Room lifecycle
  | "library_room_entered"
  | "library_room_left"
  | "library_room_created"
  // Study sessions
  | "study_session_started"
  | "study_session_paused"
  | "study_session_resumed"
  | "study_session_ended"
  // Chat
  | "chat_message_sent"
  | "chat_message_received"
  // AI Doubt Engine
  | "ai_doubt_asked"
  | "ai_doubt_answered"
  | "ai_doubt_rated_helpful"
  | "ai_doubt_rated_unhelpful"
  // Planner
  | "plan_task_completed"
  | "plan_created"
  // Video
  | "video_stream_started"
  | "video_stream_stopped";

// ─── Context ────────────────────────────────────────────────────────────────

/** Lightweight context attached to every library event. */
export interface LibraryEventContext {
  /** Anonymous participant ID */
  participantId: string;
  /** Room ID if applicable */
  roomId?: string;
  /** GATE branch ID */
  branchId?: string;
  /** Subject ID if applicable */
  subjectId?: string;
  /** Topic if applicable */
  topic?: string;
  /** Session ID if applicable */
  sessionId?: string;
}

/** A typed learning event emitted by the library. */
export interface LearningEvent {
  name: LibraryEventName;
  context: LibraryEventContext;
  /** Arbitrary properties attached to this event */
  properties: Record<string, unknown>;
  /** Epoch ms when the event occurred */
  timestamp: number;
}

/** Create a minimal base context from a partial context. */
export function createBaseLibraryContext(
  overrides: Partial<LibraryEventContext> = {},
): LibraryEventContext {
  return {
    participantId: overrides.participantId ?? "anonymous",
    roomId: overrides.roomId,
    branchId: overrides.branchId,
    subjectId: overrides.subjectId,
    topic: overrides.topic,
    sessionId: overrides.sessionId,
  };
}

// ─── Event Record ───────────────────────────────────────────────────────────

/** A fully formed library event ready for dispatch. */
export interface LibraryEvent {
  name: LibraryEventName;
  context: LibraryEventContext;
  properties: Record<string, unknown>;
  timestamp: number;
}
