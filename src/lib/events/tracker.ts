"use client";

/**
 * Client-side event tracker.
 *
 * Batches events and sends them to /api/events.
 * Uses sessionStorage for the session ID.
 * Falls back gracefully when the API is unavailable.
 */

import type { EventName, EventContext, TrackedEvent } from "./schema";

const EVENT_ENDPOINT = "/api/events";
const BATCH_SIZE = 10;
const BATCH_INTERVAL_MS = 5000;
const MAX_RETRIES = 3;

type Listener = (event: TrackedEvent) => void;

class EventTracker {
  private queue: TrackedEvent[] = [];
  private listeners: Set<Listener> = new Set();
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private isSending = false;
  private sessionId: string;
  private anonymousId: string | null = null;
  private pagePath: string = "";

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
  }

  private getOrCreateSessionId(): string {
    if (typeof sessionStorage === "undefined") {
      return this.generateSessionId();
    }
    const stored = sessionStorage.getItem("eduneuro_session");
    if (stored) return stored;
    const newId = this.generateSessionId();
    sessionStorage.setItem("eduneuro_session", newId);
    return newId;
  }

  private generateSessionId(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
  }

  setAnonymousId(id: string) {
    this.anonymousId = id;
  }

  setPagePath(path: string) {
    this.pagePath = path;
  }

  track(
    eventName: EventName,
    context: Partial<EventContext> = {}
  ): void {
    const event: TrackedEvent = {
      eventName,
      context: {
        anonymousId: this.anonymousId ?? context.anonymousId,
        userId: context.userId,
        sessionId: this.sessionId,
        page: context.page ?? this.pagePath,
        exam: context.exam,
        paper: context.paper,
        subject: context.subject,
        topic: context.topic,
        utmContext: context.utmContext,
        properties: context.properties,
      },
      timestamp: Date.now(),
    };

    this.queue.push(event);
    this.notifyListeners(event);

    if (this.queue.length >= BATCH_SIZE) {
      this.flush();
    } else if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => this.flush(), BATCH_INTERVAL_MS);
    }
  }

  private notifyListeners(event: TrackedEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        // Silently ignore listener errors
      }
    }
  }

  addListener(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private async flush(): Promise<void> {
    if (this.isSending || this.queue.length === 0) return;
    this.isSending = true;

    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    const batch = this.queue.splice(0, BATCH_SIZE);
    if (batch.length === 0) {
      this.isSending = false;
      return;
    }

    try {
      await this.sendBatch(batch);
    } catch {
      // Put events back on the queue for retry
      this.queue.unshift(...batch);
    } finally {
      this.isSending = false;
      if (this.queue.length > 0) {
        this.flushTimer = setTimeout(() => this.flush(), BATCH_INTERVAL_MS);
      }
    }
  }

  private async sendBatch(batch: TrackedEvent[]): Promise<void> {
    // Use navigator.sendBeacon for reliability, with fetch fallback
    const payload = JSON.stringify({ events: batch });

    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      const sent = navigator.sendBeacon(EVENT_ENDPOINT, blob);
      if (sent) return;
    }

    // Fallback to fetch
    let retries = 0;
    while (retries < MAX_RETRIES) {
      try {
        const res = await fetch(EVENT_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        });
        if (res.ok) return;
        if (res.status >= 500 && retries < MAX_RETRIES - 1) {
          await new Promise((r) =>
            setTimeout(r, Math.min(1000 * 2 ** retries, 10000))
          );
          retries++;
        } else {
          return;
        }
      } catch {
        if (retries < MAX_RETRIES - 1) {
          await new Promise((r) =>
            setTimeout(r, Math.min(1000 * 2 ** retries, 10000))
          );
          retries++;
        } else {
          return;
        }
      }
    }
  }

  /**
   * Flush all pending events immediately.
   */
  async flushNow(): Promise<void> {
    await this.flush();
  }

  /**
   * Track a page view. Call this on route changes.
   */
  trackPageView(page: string, extra?: Partial<EventContext>): void {
    this.track("page_view", {
      page,
      ...extra,
    });
  }

  /**
   * Get queue length for debugging.
   */
  getQueueLength(): number {
    return this.queue.length;
  }
}

// Singleton instance
let tracker: EventTracker | null = null;

export function getTracker(): EventTracker {
  if (!tracker) {
    tracker = new EventTracker();
  }
  return tracker;
}

export function resetTracker(): void {
  tracker = null;
}
