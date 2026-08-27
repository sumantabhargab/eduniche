/**
 * Noop VideoProvider — all methods resolve without side effects.
 *
 * Used when videoEnabled is false, so the rest of the code can
 * call video methods unconditionally without null checks.
 */

import type { VideoProvider } from "../types/adapters";

export class NoopVideoProvider implements VideoProvider {
  readonly enabled = false;

  destroy(): void {
    // no-op
  }

  async startLocalStream(): Promise<MediaStream> {
    return new MediaStream();
  }

  stopLocalStream(): void {
    // no-op
  }

  toggleMute(): void {
    // no-op
  }

  toggleCamera(): void {
    // no-op
  }

  isMuted(): boolean {
    return true;
  }

  isVideoOn(): boolean {
    return false;
  }

  getLocalStream(): MediaStream | null {
    return null;
  }
}

/** Singleton noop instance. */
export const noopVideoProvider = new NoopVideoProvider();
