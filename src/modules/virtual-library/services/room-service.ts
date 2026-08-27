/**
 * RoomService — business logic for study rooms.
 *
 * Manages room listing, filtering by branch, and presence.
 */

import type { Participant, StudyRoom } from "../types/index";
import type { VideoProvider } from "../types/adapters";
import { mockRealtimeProvider } from "../providers/mock-realtime";
import { mockChatProvider } from "../providers/mock-chat";
import { mockAIProvider } from "../providers/mock-ai";
import { noopVideoProvider } from "../providers/noop-video";
import { libraryEventEmitter, emitLibraryEvent } from "./event-emitter";

export interface RoomServiceDependencies {
  realtimeProvider: { subscribeRoom: (...args: any[]) => () => void; subscribePresence: (...args: any[]) => () => void; destroy?: () => void };
  chatProvider: { destroy?: () => void };
  aiProvider: {};
  videoProvider: VideoProvider;
}

const DEFAULT_ROOMS: StudyRoom[] = [
  {
    id: "main-library",
    name: "Main Library Hall",
    description: "Open study space for all branches. Quiet focus mode.",
    branchId: "all",
    mode: "focus",
    activeCount: 14,
    maxParticipants: 50,
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    isOpen: true,
  },
  {
    id: "cse-focus",
    name: "CSE Focus Room",
    description: "Dedicated CSE study space — Algorithms, DBMS, TOC and more.",
    branchId: "cse",
    mode: "focus",
    activeCount: 6,
    maxParticipants: 25,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    isOpen: true,
  },
  {
    id: "cse-discussion",
    name: "CSE Discussion Lounge",
    description: "Discuss problems, share solutions, and clear doubts together.",
    branchId: "cse",
    mode: "discussion",
    activeCount: 4,
    maxParticipants: 20,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    isOpen: true,
  },
  {
    id: "ece-focus",
    name: "ECE Focus Room",
    description: "Focused study for ECE aspirants — Networks, Signals, Control Systems.",
    branchId: "ece",
    mode: "focus",
    activeCount: 4,
    maxParticipants: 25,
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    isOpen: true,
  },
  {
    id: "me-focus",
    name: "ME Focus Room",
    description: "Mechanical Engineering study space — SOM, TOM, Thermodynamics.",
    branchId: "me",
    mode: "focus",
    activeCount: 3,
    maxParticipants: 25,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    isOpen: true,
  },
  {
    id: "ce-focus",
    name: "CE Focus Room",
    description: "Civil Engineering study space — Structures, Geotech, Environment.",
    branchId: "ce",
    mode: "focus",
    activeCount: 2,
    maxParticipants: 25,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    isOpen: true,
  },
  {
    id: "ee-focus",
    name: "EE Focus Room",
    description: "Electrical Engineering — Machines, Power Systems, Control.",
    branchId: "ee",
    mode: "focus",
    activeCount: 3,
    maxParticipants: 25,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    isOpen: true,
  },
  {
    id: "general-discussion",
    name: "General Discussion",
    description: "Cross-branch chat. Talk about preparation strategies, motivation, and more.",
    branchId: "all",
    mode: "discussion",
    activeCount: 8,
    maxParticipants: 40,
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    isOpen: true,
  },
];

export class RoomService {
  private rooms: StudyRoom[];
  private participants: Map<string, Participant[]> = new Map();
  private unsubs: Array<() => void> = [];
  private deps: RoomServiceDependencies;

  constructor(deps?: RoomServiceDependencies) {
    this.rooms = [...DEFAULT_ROOMS];
    this.deps = {
      realtimeProvider: deps?.realtimeProvider ?? mockRealtimeProvider,
      chatProvider: deps?.chatProvider ?? mockChatProvider,
      aiProvider: deps?.aiProvider ?? mockAIProvider,
      videoProvider: deps?.videoProvider ?? noopVideoProvider,
    };
  }

  /** Get all rooms, optionally filtered by branch. */
  getRooms(branchId?: string): StudyRoom[] {
    if (branchId === "all" || !branchId) return [...this.rooms];
    return this.rooms.filter((r) => r.branchId === branchId || r.branchId === "all");
  }

  /** Get a single room by ID. */
  getRoom(roomId: string): StudyRoom | null {
    return this.rooms.find((r) => r.id === roomId) ?? null;
  }

  /** Subscribe to room updates for a specific room. */
  subscribeRoom(roomId: string, onChange: (room: StudyRoom) => void): () => void {
    const room = this.getRoom(roomId);
    if (!room) return () => {};

    onChange(room);
    return this.deps.realtimeProvider.subscribeRoom(roomId, (updated: StudyRoom) => {
      const idx = this.rooms.findIndex((r) => r.id === roomId);
      if (idx !== -1) {
        this.rooms[idx] = updated;
        onChange(updated);
      }
    });
  }

  /** Join a room — subscribes to presence and emits event. */
  joinRoom(roomId: string, participant: Participant): () => void {
    const room = this.getRoom(roomId);
    if (!room) return () => {};

    // Track participant
    if (!this.participants.has(roomId)) {
      this.participants.set(roomId, []);
    }
    this.participants.get(roomId)!.push(participant);

    // Subscribe to presence
    const unsub = this.deps.realtimeProvider.subscribePresence(roomId, (participants: Participant[]) => {
      this.participants.set(roomId, participants);
    });

    emitLibraryEvent("library_room_entered", { roomId, branchId: room.branchId });

    return unsub;
  }

  /** Leave a room. */
  leaveRoom(roomId: string, participantId: string): void {
    const list = this.participants.get(roomId);
    if (list) {
      this.participants.set(
        roomId,
        list.filter((p) => p.id !== participantId),
      );
    }
    emitLibraryEvent("library_room_left", { roomId });
  }

  /** Get current participants in a room. */
  getParticipants(roomId: string): Participant[] {
    return this.participants.get(roomId) ?? [];
  }

  /** Clean up all subscriptions (for unmount). */
  destroy(): void {
    this.unsubs.forEach((u) => u());
    this.unsubs = [];
    this.deps.realtimeProvider.destroy?.();
    this.deps.chatProvider.destroy?.();
  }
}

/** Singleton service instance. */
export const roomService = new RoomService();
