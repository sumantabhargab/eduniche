"use client";

import { useCallback, useEffect } from "react";

type EventData = Record<string, unknown>;

const EVENT_BUFFER_KEY = "eduneuro_event_buffer";

function getAnonymousId(): string {
  let id = typeof window !== "undefined" ? sessionStorage.getItem("eduneuro_anon_id") : null;
  if (!id) {
    id = crypto.randomUUID();
    if (typeof window !== "undefined") {
      sessionStorage.setItem("eduneuro_anon_id", id);
    }
  }
  return id;
}

export function useGateEvent(eventName: string, data?: EventData) {
  const fire = useCallback(() => {
    if (typeof window === "undefined") return;

    const event = {
      event_name: eventName,
      anonymous_id: getAnonymousId(),
      timestamp: new Date().toISOString(),
      page: typeof window !== "undefined" ? window.location.pathname : "",
      ...data,
    };

    try {
      const buffer = JSON.parse(
        sessionStorage.getItem(EVENT_BUFFER_KEY) || "[]"
      );
      buffer.push(event);
      sessionStorage.setItem(EVENT_BUFFER_KEY, JSON.stringify(buffer.slice(-50)));
    } catch {
      // storage unavailable
    }

    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/events",
        JSON.stringify({ events: [event] })
      );
    }
  }, [eventName, data]);

  useEffect(() => {
    fire();
  }, [fire]);
}
