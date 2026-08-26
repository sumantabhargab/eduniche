/**
 * Centralized analytics and product tracking.
 *
 * All tracking flows through this module.
 * Emits custom DOM events that a lightweight client records.
 * No external analytics service is hardcoded.
 */

import type { UTMContext } from "@/lib/attribution/parser";

// ─── Event schema ───────────────────────────────────────────────────────

export interface TrackEvent {
  event: string;
  anonymousId: string;
  sessionId: string;
  timestamp: number;
  page: string;
  exam?: string;
  paper?: string;
  subject?: string;
  topic?: string;
  utm?: UTMContext;
  referrer?: string | null;
  metadata?: Record<string, unknown>;
}

// ─── Valid event names ──────────────────────────────────────────────────

export const ACQUISITION_EVENTS = [
  "page_view",
  "homepage_view",
  "referrer_captured",
  "gate_cta_viewed",
  "gate_cta_clicked",
  "gate_page_opened",
] as const;

export const PAPER_EVENTS = [
  "exam_selected",
  "paper_selected",
  "paper_search_used",
  "unavailable_paper_clicked",
] as const;

export const ENGAGEMENT_EVENTS = [
  "dashboard_viewed",
  "subject_selected",
  "topic_selected",
  "concept_viewed",
  "analysis_viewed",
  "trend_viewed",
  "priority_viewed",
  "methodology_viewed",
] as const;

export const PRACTICE_EVENTS = [
  "practice_page_opened",
  "practice_mode_selected",
  "practice_generation_started",
  "practice_generation_completed",
  "practice_generation_failed",
  "practice_paper_opened",
  "practice_question_viewed",
] as const;

export const CONVERSION_EVENTS = [
  "waitlist_opened",
  "waitlist_started",
  "waitlist_completed",
  "signup_started",
  "signup_completed",
] as const;

export const FEEDBACK_EVENTS = [
  "feedback_prompt_viewed",
  "feedback_submitted",
  "feature_requested",
  "paper_requested",
  "subject_requested",
] as const;

export const RETENTION_EVENTS = [
  "return_visit",
  "session_started",
  "session_ended",
  "last_active_updated",
] as const;

export const ALL_EVENTS = [
  ...ACQUISITION_EVENTS,
  ...PAPER_EVENTS,
  ...ENGAGEMENT_EVENTS,
  ...PRACTICE_EVENTS,
  ...CONVERSION_EVENTS,
  ...FEEDBACK_EVENTS,
  ...RETENTION_EVENTS,
] as const;

export type EventName = (typeof ALL_EVENTS)[number];

// ─── Identity helpers ───────────────────────────────────────────────────

const ANONYMOUS_ID_KEY = "eduneuro_anon_id";
const SESSION_ID_KEY = "eduneuro_session_id";
const SESSION_START_KEY = "eduneuro_session_start";

export function getOrCreateAnonymousId(): string {
  if (typeof document === "undefined") return "server-" + Date.now();

  let id = localStorage.getItem(ANONYMOUS_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(ANONYMOUS_ID_KEY, id);
  }
  return id;
}

export function getOrCreateSessionId(): string {
  if (typeof document === "undefined") return "server-session-" + Date.now();

  const now = Date.now();
  const start = localStorage.getItem(SESSION_START_KEY);
  const existingSession = sessionStorage.getItem(SESSION_ID_KEY);

  // New session if none exists or last session was >30 minutes ago
  if (!existingSession || !start || now - Number(start) > 30 * 60 * 1000) {
    const newSession = crypto.randomUUID();
    sessionStorage.setItem(SESSION_ID_KEY, newSession);
    localStorage.setItem(SESSION_START_KEY, String(now));
    return newSession;
  }

  return existingSession;
}

export function getAnonymousId(): string | null {
  if (typeof document === "undefined") return null;
  return localStorage.getItem(ANONYMOUS_ID_KEY);
}

// ─── Tracking function ──────────────────────────────────────────────────

export function track(
  eventName: EventName,
  context: Partial<Omit<TrackEvent, "event" | "timestamp">> = {}
): void {
  if (typeof window === "undefined") return;

  const payload: TrackEvent = {
    event: eventName,
    anonymousId: context.anonymousId || getOrCreateAnonymousId(),
    sessionId: context.sessionId || getOrCreateSessionId(),
    timestamp: Date.now(),
    page: typeof window !== "undefined" ? window.location.pathname : "",
    utm: context.utm,
    referrer: typeof document !== "undefined" ? document.referrer || null : null,
    ...context,
  };

  // Emit custom event for the client-side recorder
  try {
    window.dispatchEvent(
      new CustomEvent("eduneuro:track", { detail: payload })
    );
  } catch {
    // Silently fail if CustomEvent is unavailable
  }

  // Also store in memory for batch sending
  const w = window as unknown as Record<string, unknown>;
  if (typeof w.__eduneuroEvents === "undefined") {
    w.__eduneuroEvents = [];
  }
  const events = w.__eduneuroEvents as TrackEvent[];
  events.push(payload);
}

// ─── Page view ──────────────────────────────────────────────────────────

export function trackPageView(page: string): void {
  track("page_view", { page });
}

// ─── Flush queued events ────────────────────────────────────────────────

export function flushEvents(): TrackEvent[] {
  if (typeof window === "undefined") return [];
  const w = window as unknown as { __eduneuroEvents?: TrackEvent[] };
  const events = w.__eduneuroEvents || [];
  w.__eduneuroEvents = [];
  return events;
}
