/**
 * Mock RealtimeProvider — simulates presence for development.
 *
 * Uses in-memory state and fake participant counts.
 */

import type { Participant, StudyRoom } from "../types/index";
import type { RealtimeProvider } from "../types/adapters";

const MOCK_PARTICIPANT_COUNTS: Record<string, number> = {
  "main-library": 14,
  "cse-focus": 6,
  "ece-focus": 4,
  "me-focus": 3,
  "ce-focus": 2,
};

const MOCK_PARTICIPANTS: Record<string, Participant[]> = {
  "main-library": Array.from({ length: 14 }, (_, i) => ({
    id: `mock-user-${i}`,
    joinedAt: Date.now() - i * 60000,
    isMuted: i % 3 === 0,
    isVideoOn: i % 4 === 0,
    subject: i % 2 === 0 ? "cse" : undefined,
    label: `Student ${i + 1}`,
  })),
};

/** Generate a mock participant for the current user. */
export function createMockParticipant(anonymousId: string): Participant {
  return {
    id: anonymousId,
    joinedAt: Date.now(),
    isMuted: false,
    isVideoOn: false,
    label: `You`,
  };
}

export class MockRealtimeProvider implements RealtimeProvider {
  readonly enabled = true;

  private unsubscribers: Array<() => void> = [];
  private intervals: Array<{ roomId: string; interval: ReturnType<typeof setInterval> }> = [];

  subscribePresence(
    roomId: string,
    onChange: (participants: Participant[]) => void,
  ): () => void {
    // Initial value
    const count = MOCK_PARTICIPANT_COUNTS[roomId] ?? Math.floor(Math.random() * 8) + 1;
    const existing = MOCK_PARTICIPANTS[roomId] ?? [];
    const mockList: Participant[] = existing.slice(0, Math.min(count, existing.length));

    // Ensure we have enough
    while (mockList.length < count) {
      mockList.push({
        id: `mock-user-${mockList.length}`,
        joinedAt: Date.now() - Math.floor(Math.random() * 300000),
        isMuted: Math.random() > 0.5,
        isVideoOn: Math.random() > 0.7,
        label: `Student ${mockList.length + 1}`,
      });
    }

    onChange(mockList);

    // Simulate presence changes every 15–30 seconds
    const interval = setInterval(() => {
      const delta = Math.floor(Math.random() * 5) - 2; // -2 to +2
      const newCount = Math.max(1, count + delta + Math.floor(Math.random() * 3) - 1);
      MOCK_PARTICIPANT_COUNTS[roomId] = newCount;

      const updated = mockList.slice(0, newCount);
      while (updated.length < newCount) {
        updated.push({
          id: `mock-user-${updated.length}`,
          joinedAt: Date.now(),
          isMuted: false,
          isVideoOn: false,
          label: `Student ${updated.length + 1}`,
        });
      }
      onChange(updated);
    }, 15000 + Math.random() * 15000);

    this.intervals.push({ roomId, interval });

    return () => {
      clearInterval(interval);
      this.intervals = this.intervals.filter((i) => i.roomId !== roomId || i.interval !== interval);
    };
  }

  announcePresence(_roomId: string, _participant: Participant): () => void {
    // No-op in mock — presence is faked
    return () => {};
  }

  subscribeRoom(
    roomId: string,
    onChange: (room: StudyRoom) => void,
  ): () => void {
    // Emit once with initial state
    onChange({
      id: roomId,
      name: roomId,
      description: "Study room",
      branchId: "cse",
      mode: "focus",
      activeCount: MOCK_PARTICIPANT_COUNTS[roomId] ?? 1,
      maxParticipants: 30,
      createdAt: new Date().toISOString(),
      isOpen: true,
    });

    // Update counts periodically
    const interval = setInterval(() => {
      const count = MOCK_PARTICIPANT_COUNTS[roomId] ?? 1;
      onChange({
        id: roomId,
        name: roomId,
        description: "Study room",
        branchId: "cse",
        mode: "focus",
        activeCount: count,
        maxParticipants: 30,
        createdAt: new Date().toISOString(),
        isOpen: true,
      });
    }, 20000);

    this.intervals.push({ roomId, interval });

    return () => {
      clearInterval(interval);
      this.intervals = this.intervals.filter((i) => i.roomId !== roomId || i.interval !== interval);
    };
  }

  /** Clean up all intervals (for testing). */
  destroy(): void {
    this.intervals.forEach(({ interval }) => clearInterval(interval));
    this.intervals = [];
  }
}

/** Singleton mock instance. */
export const mockRealtimeProvider = new MockRealtimeProvider();
