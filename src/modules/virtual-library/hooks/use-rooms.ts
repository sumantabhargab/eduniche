/**
 * Hook for room list and presence.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { roomService, type RoomService } from "../services/room-service";
import type { Participant, StudyRoom } from "../types/index";

export interface UseRoomsOptions {
  branchFilter?: string;
}

export interface UseRoomsReturn {
  /** Available rooms */
  rooms: StudyRoom[];
  /** Current room being viewed */
  activeRoom: StudyRoom | null;
  /** Participants in the active room */
  participants: Participant[];
  /** Whether rooms are loading */
  isLoading: boolean;
  /** Join a room */
  joinRoom: (roomId: string) => () => void;
  /** Leave a room */
  leaveRoom: (roomId: string, participantId: string) => void;
  /** Select a room as active */
  setActiveRoom: (room: StudyRoom) => void;
}

export function useRooms(options: UseRoomsOptions = {}): UseRoomsReturn {
  const { branchFilter } = options;
  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<StudyRoom | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [joinedRoomId, setJoinedRoomId] = useState<string | null>(null);

  // Load rooms
  useEffect(() => {
    setIsLoading(true);
    const loaded = roomService.getRooms(branchFilter);
    setRooms(loaded);
    setIsLoading(false);
  }, [branchFilter]);

  // Subscribe to active room updates
  useEffect(() => {
    if (!activeRoom) return;
    const unsub = roomService.subscribeRoom(activeRoom.id, (updated) => {
      setActiveRoom(updated);
      setRooms((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r)),
      );
    });
    return unsub;
  }, [activeRoom]);

  const joinRoom = useCallback(
    (roomId: string) => {
      // Create a simple participant
      const participant: Participant = {
        id: `user-${Date.now()}`,
        joinedAt: Date.now(),
        isMuted: false,
        isVideoOn: false,
        label: "You",
      };

      const unsub = roomService.joinRoom(roomId, participant);
      setJoinedRoomId(roomId);

      // Subscribe to presence
      roomService.subscribeRoom(roomId, () => {
        setParticipants(roomService.getParticipants(roomId));
      });

      setParticipants(roomService.getParticipants(roomId));

      return unsub;
    },
    [],
  );

  const leaveRoom = useCallback(
    (roomId: string, participantId: string) => {
      roomService.leaveRoom(roomId, participantId);
      setJoinedRoomId(null);
      setParticipants([]);
    },
    [],
  );

  return {
    rooms,
    activeRoom,
    participants,
    isLoading,
    joinRoom,
    leaveRoom,
    setActiveRoom,
  };
}
