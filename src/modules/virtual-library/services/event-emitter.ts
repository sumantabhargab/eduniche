/**
 * Domain event emitter for the Virtual Library.
 *
 * Publishes typed learning events to registered listeners.
 * Gracefully drops events when no listeners are present.
 */

import type { LibraryEvent, LibraryEventName, LibraryEventContext } from "../types/events";
import { createBaseLibraryContext } from "../types/events";

type EventListener = (event: LibraryEvent) => void;

/** Singleton event emitter. */
class LibraryEventEmitter {
  private listeners: Set<EventListener> = new Set();

  /** Register a listener. Returns an unsubscribe function. */
  on(listener: EventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Publish an event to all listeners. */
  emit(event: LibraryEvent): void {
    if (this.listeners.size === 0) return;

    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        // Don't let a bad listener break the others
      }
    }
  }

  /** Remove all listeners. */
  clear(): void {
    this.listeners.clear();
  }

  /** Current listener count (for testing/debugging). */
  get listenerCount(): number {
    return this.listeners.size;
  }
}

/** Global singleton instance. */
export const libraryEventEmitter = new LibraryEventEmitter();

/** Emit a typed event. */
export function emitLibraryEvent(
  name: LibraryEventName,
  context: Partial<LibraryEventContext> = {},
  properties: Record<string, unknown> = {},
): void {
  libraryEventEmitter.emit({
    name,
    context: createBaseLibraryContext(context),
    properties,
    timestamp: Date.now(),
  });
}
