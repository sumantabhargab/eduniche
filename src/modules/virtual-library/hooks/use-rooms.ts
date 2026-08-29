/**
 * Hook for room list and presence.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import type { Participant, StudyRoom } from "../types/index";
import { realRealtimeProvider } from "../providers/real-realtime";

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
  joinRoom: (roomId: string) => Promise<() => void>;
  /** Leave a room */
  leaveRoom: (roomId: string, participantId: string) => Promise<void>;
  /** Select a room as active */
  setActiveRoom: (room: StudyRoom | null) => void;
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
    let cancelled = false;
    setIsLoading(true);

    const load = async () => {
      try {
        const { getChatSupabase } = await import("@/modules/chat/services/supabase");
        const supabase = getChatSupabase();
        if (!supabase || cancelled) {
          setRooms([]);
          setIsLoading(false);
          return;
        }

        let q = supabase
          .from("study_rooms")
          .select("*")
          .eq("is_open", true)
          .order("name", { ascending: true });

        const { data, error } = await q;
        if (cancelled) return;

        if (error || !data) {
          setRooms([]);
        } else {
          const rooms: StudyRoom[] = data.map((r: any) => ({
            id: r.id,
            name: r.name,
            description: r.description ?? "",
            branchId: r.branch_id ?? "all",
            mode: r.mode ?? "focus",
            activeCount: 0,
            maxParticipants: r.max_participants ?? 50,
            createdAt: r.created_at,
            isOpen: r.is_open,
          }));
          setRooms(rooms);
        }
        if (!cancelled) setIsLoading(false);
      } catch {
        if (!cancelled) {
          setRooms([]);
          setIsLoading(false);
        }
      }
    };

    load();

    return () => { cancelled = true; };
  }, [branchFilter]);

  // Refresh participants periodically
  useEffect(() => {
    if (!joinedRoomId) return;

    const refreshParticipants = async () => {
      const supabase = (await import("@/modules/chat/services/supabase")).getChatSupabase();
      if (!supabase || !joinedRoomId) return;

      const fiveMinAgo = new Date(Date.now() - 300000).toISOString();
      const { data } = await supabase
        .from("study_room_presence")
        .select("user_id, participant_label, joined_at")
        .eq("room_id", joinedRoomId)
        .gte("last_seen_at", fiveMinAgo)
        .order("joined_at", { ascending: true });

      if (data) {
        setParticipants(
          data.map((row: any) => ({
            id: row.user_id,
            joinedAt: new Date(row.joined_at).getTime(),
            isMuted: false,
            isVideoOn: false,
            label: row.participant_label ?? "Student",
          }))
        );
      }
    };

    refreshParticipants();
    const interval = setInterval(refreshParticipants, 10000);
    return () => clearInterval(interval);
  }, [joinedRoomId]);

  const joinRoom = useCallback(async (roomId: string) => {
    const supabase = (await import("@/modules/chat/services/supabase")).getChatSupabase();
    if (!supabase) return () => {};

    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id ?? `anon-${Date.now()}`;
    const email = user?.email ?? "";
    const label = email ? email.split("@")[0] : `Student-${userId.slice(0, 6)}`;

    // Check if profile exists, create if not
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile) {
        await supabase.from("profiles").upsert({
          id: user.id,
          role: "student",
          display_name: label,
        }, { onConflict: "id", ignoreDuplicates: true });
      }
    }

    await supabase
      .from("study_room_presence")
      .upsert(
        {
          room_id: roomId,
          user_id: userId,
          participant_label: label,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: "room_id,user_id" }
      );

    setJoinedRoomId(roomId);

    // Subscribe to presence changes
    const unsub = realRealtimeProvider.subscribePresence(roomId, () => {
      // Presence updates handled by interval
    });

    return unsub;
  }, []);

  const leaveRoom = useCallback(async (roomId: string, participantId: string) => {
    const supabase = (await import("@/modules/chat/services/supabase")).getChatSupabase();
    if (!supabase) return;

    await supabase
      .from("study_room_presence")
      .delete()
      .eq("room_id", roomId)
      .eq("user_id", participantId);

    setJoinedRoomId(null);
    setParticipants([]);
  }, []);

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
