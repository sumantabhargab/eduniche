/**
 * Event tracking schema — type definitions for all tracked events.
 */

export type EventName =
  // Acquisition
  | "page_view"
  | "homepage_view"
  | "referrer_captured"
  // Home → Gate
  | "gate_cta_viewed"
  | "gate_cta_clicked"
  | "gate_page_opened"
  // Paper Discovery
  | "exam_selected"
  | "paper_selected"
  | "paper_search_used"
  | "unavailable_paper_clicked"
  // Engagement
  | "dashboard_viewed"
  | "subject_selected"
  | "topic_selected"
  | "concept_viewed"
  | "analysis_viewed"
  | "trend_viewed"
  | "priority_viewed"
  | "methodology_viewed"
  // Practice
  | "practice_page_opened"
  | "practice_mode_selected"
  | "practice_generation_started"
  | "practice_generation_completed"
  | "practice_generation_failed"
  | "practice_paper_opened"
  | "practice_question_viewed"
  // Conversion
  | "waitlist_opened"
  | "waitlist_started"
  | "waitlist_completed"
  | "signup_started"
  | "signup_completed"
  // Feedback
  | "feedback_prompt_viewed"
  | "feedback_submitted"
  | "feature_requested"
  | "paper_requested"
  | "subject_requested"
  // Retention
  | "return_visit"
  | "session_started"
  | "session_ended"
  | "last_active_updated";

export type EventContext = {
  anonymousId?: string;
  userId?: string;
  sessionId: string;
  page?: string;
  exam?: string;
  paper?: string;
  subject?: string;
  topic?: string;
  utmContext?: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
  };
  properties?: Record<string, unknown>;
};

export type TrackedEvent = {
  eventName: EventName;
  context: EventContext;
  timestamp: number;
};

/**
 * Context keys that should be attached to every event.
 */
export function createBaseContext(
  partial: Partial<EventContext> & { sessionId: string }
): EventContext {
  return {
    anonymousId: partial.anonymousId,
    userId: partial.userId,
    sessionId: partial.sessionId,
    page: partial.page,
    exam: partial.exam,
    paper: partial.paper,
    subject: partial.subject,
    topic: partial.topic,
    utmContext: partial.utmContext,
    properties: partial.properties,
  };
}
