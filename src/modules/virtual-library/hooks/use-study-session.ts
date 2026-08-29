/**
 * Hook for study session management.
 *
 * Wraps the session state machine with React state for UI rendering.
 */

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  createSessionStateMachine,
  createAnonymousId,
  type SessionStateMachine,
} from "../services/session-service";
import type { StudySession } from "../types/index";

export interface UseStudySessionOptions {
  roomId?: string;
  branchId?: string;
  subjectId?: string;
  /** Callback when a session ends */
  onSessionEnd?: (session: StudySession) => void;
}

export interface UseStudySessionReturn {
  /** Current session state */
  status: "idle" | "running" | "paused" | "completed";
  /** The active session object */
  session: StudySession | null;
  /** Focus time in seconds */
  focusSeconds: number;
  /** Whether a session is active */
  isActive: boolean;
  /** Start a new session */
  start: (branchId: string, subjectId?: string, topic?: string) => void;
  /** Pause the current session */
  pause: () => void;
  /** Resume a paused session */
  resume: () => void;
  /** End the current session */
  end: () => StudySession | null;
}

export function useStudySession(
  options: UseStudySessionOptions = {},
): UseStudySessionReturn {
  const { roomId = "main-library", branchId, subjectId, onSessionEnd } = options;

  const participantId = useRef(createAnonymousId()).current;
  const machineRef = useRef<SessionStateMachine>(
    createSessionStateMachine(participantId, roomId, branchId ?? "all", subjectId),
  );
  const [status, setStatus] = useState<"idle" | "running" | "paused" | "completed">("idle");
  const [session, setSession] = useState<StudySession | null>(null);
  const [focusSeconds, setFocusSeconds] = useState(0);

  // Track whether the current pause was auto-triggered by tab visibility change
  const autoPausedRef = useRef(false);

  // Tick timer
  useEffect(() => {
    if (status !== "running") return;
    const interval = setInterval(() => {
      setFocusSeconds(machineRef.current.focusSeconds);
    }, 1000);
    return () => clearInterval(interval);
  }, [status]);

  // Auto-pause when the tab is hidden, auto-resume when it becomes visible again.
  // Keeps the focus timer honest: it only advances while the user is actually in the screen.
  useEffect(() => {
    if (typeof document === "undefined") return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        if (machineRef.current.status === "running") {
          machineRef.current.pause();
          autoPausedRef.current = true;
          setStatus("paused");
        }
      } else if (document.visibilityState === "visible") {
        if (autoPausedRef.current && machineRef.current.status === "paused") {
          machineRef.current.resume();
          autoPausedRef.current = false;
          setStatus("running");
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Listen for session updates from the machine
  useEffect(() => {
    const unsub = (machineRef.current as unknown as { emit?: (e: { name: string }) => void })["emit"];
    return () => {};
  }, []);

  const start = useCallback(
    (bId: string, sId?: string, topic?: string) => {
      const s = machineRef.current.start(bId, sId, topic, roomId);
      setStatus(s.status);
      setSession(s);
    },
    [roomId],
  );

  const pause = useCallback(() => {
    machineRef.current.pause();
    setStatus("paused");
  }, []);

  const resume = useCallback(() => {
    machineRef.current.resume();
    setStatus("running");
  }, []);

  const end = useCallback(() => {
    const completed = machineRef.current.end();
    if (completed) {
      setStatus("completed");
      setSession(completed);
      onSessionEnd?.(completed);
    }
    return completed;
  }, [onSessionEnd]);

  return {
    status,
    session,
    focusSeconds,
    isActive: status === "running",
    start,
    pause,
    resume,
    end,
  };
}
