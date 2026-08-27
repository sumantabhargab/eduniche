/**
 * SessionService — study session state machine.
 *
 * Manages the lifecycle of a study session: idle → running ↔ paused → completed.
 * Emits domain events at each transition.
 */

import { emitLibraryEvent } from "./event-emitter";
import { libraryEventEmitter } from "./event-emitter";

export type SessionState = "idle" | "running" | "paused" | "completed";

export interface SessionStateMachine {
  /** Current state */
  readonly status: SessionState;
  /** The active session (null when idle) */
  readonly session: StudySession | null;
  /** Start a new session */
  start(branchId: string, subjectId?: string, topic?: string, roomId?: string): StudySession;
  /** Pause the current session */
  pause(): StudySession | null;
  /** Resume a paused session */
  resume(): StudySession | null;
  /** End the current session */
  end(): StudySession | null;
  /** Get focus duration in seconds */
  readonly focusSeconds: number;
}

import type { StudySession } from "../types/index";

/** Create an anonymous participant ID. */
export function createAnonymousId(): string {
  if (typeof localStorage === "undefined") {
    return `anon-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }
  const stored = localStorage.getItem("eduneuro_library_id");
  if (stored) return stored;
  const id = `anon-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  localStorage.setItem("eduneuro_library_id", id);
  return id;
}

/** Create a human-readable label for the anonymous user. */
export function createUserLabel(anonymousId: string): string {
  const num = anonymousId.split("-").pop() ?? "0";
  const n = parseInt(num, 36) % 999;
  return `Student ${n + 1}`;
}

/** Create a new session record. */
export function createSession(
  participantId: string,
  roomId: string,
  branchId: string,
  subjectId?: string,
  topic?: string,
): StudySession {
  return {
    id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    roomId,
    participantId,
    status: "running",
    branchId,
    subjectId,
    topic,
    startedAt: Date.now(),
    totalFocusMs: 0,
  };
}

export function createSessionStateMachine(
  participantId: string,
  roomId: string,
  branchId: string,
  subjectId?: string,
  topic?: string,
): SessionStateMachine {
  let state: SessionState = "idle";
  let session: StudySession | null = null;
  let pauseStart: number | null = null;
  let tickInterval: ReturnType<typeof setInterval> | null = null;

  function updateFocusMs() {
    if (!session) return;
    let elapsed = Date.now() - session.startedAt;
    if (pauseStart) {
      elapsed -= (Date.now() - pauseStart);
    }
    session.totalFocusMs = Math.max(0, elapsed);
  }

  function startTick() {
    stopTick();
    tickInterval = setInterval(() => {
      updateFocusMs();
      // Emit tick event for UI updates
      libraryEventEmitter.emit({
        name: "study_session_started", // re-use for tick updates
        context: {
          participantId: session!.participantId,
          roomId: session!.roomId,
          branchId: session!.branchId,
          subjectId: session!.subjectId,
          topic: session!.topic,
          sessionId: session!.id,
        },
        properties: { focusMs: session!.totalFocusMs, tick: true },
        timestamp: Date.now(),
      });
    }, 1000);
  }

  function stopTick() {
    if (tickInterval) {
      clearInterval(tickInterval);
      tickInterval = null;
    }
  }

  return {
    get status() {
      return state;
    },
    get session() {
      if (session && state !== "idle" && state !== "completed") {
        updateFocusMs();
      }
      return session;
    },
    get focusSeconds() {
      if (!session) return 0;
      let elapsed = session.totalFocusMs;
      if (state === "running") {
        elapsed = Date.now() - session.startedAt;
        if (pauseStart) {
          elapsed -= (Date.now() - pauseStart);
        }
      }
      return Math.max(0, Math.floor(elapsed / 1000));
    },

    start(_branchId: string, _subjectId?: string, _topic?: string, _roomId?: string): StudySession {
      if (state === "running") return session!;

      session = createSession(
        participantId,
        _roomId ?? roomId,
        _branchId,
        _subjectId,
        _topic,
      );
      state = "running";
      pauseStart = null;
      startTick();

      emitLibraryEvent("study_session_started", {
        participantId,
        roomId: session.roomId,
        branchId: session.branchId,
        subjectId: session.subjectId,
        topic: session.topic,
        sessionId: session.id,
      });

      return session;
    },

    pause(): StudySession | null {
      if (state !== "running" || !session) return session;
      state = "paused";
      pauseStart = Date.now();
      stopTick();

      emitLibraryEvent("study_session_paused", {
        participantId: session.participantId,
        roomId: session.roomId,
        branchId: session.branchId,
        subjectId: session.subjectId,
        topic: session.topic,
        sessionId: session.id,
      }, { focusMs: session.totalFocusMs });

      return session;
    },

    resume(): StudySession | null {
      if (state !== "paused" || !session || !pauseStart) return session;
      const pauseDuration = Date.now() - pauseStart;
      session.startedAt += pauseDuration;
      pauseStart = null;
      state = "running";
      startTick();

      emitLibraryEvent("study_session_resumed", {
        participantId: session.participantId,
        roomId: session.roomId,
        branchId: session.branchId,
        subjectId: session.subjectId,
        topic: session.topic,
        sessionId: session.id,
      });

      return session;
    },

    end(): StudySession | null {
      if (state === "idle" || state === "completed" || !session) return session;
      updateFocusMs();
      state = "completed";
      session.status = "completed";
      session.endedAt = new Date().toISOString();
      stopTick();

      emitLibraryEvent("study_session_ended", {
        participantId: session.participantId,
        roomId: session.roomId,
        branchId: session.branchId,
        subjectId: session.subjectId,
        topic: session.topic,
        sessionId: session.id,
      }, {
        focusMs: session.totalFocusMs,
        focusMinutes: Math.round(session.totalFocusMs / 60000),
      });

      const completed = session;
      session = null;
      pauseStart = null;
      return completed;
    },
  };
}
