/**
 * RoomService — business logic for study rooms.
 *
 * Queries study_rooms table from Supabase for real room data.
 * Uses Supabase Realtime for presence tracking.
 */

import { getChatSupabase } from "@/modules/chat/services/supabase";
import { realRealtimeProvider } from "../providers/real-realtime";
import { noopVideoProvider } from "../providers/noop-video";
import type { Participant, StudyRoom } from "../types/index";

const DEFAULT_MAX_PARTICIPANTS = 50;

export class RoomService {
  private unsubs: Array<() => void> = [];

  /** Get all open rooms from the database. */
  async getRooms(branchId?: string): Promise<StudyRoom[]> {
    const supabase = getChatSupabase();
    if (!supabase) return [];

    let q = supabase
      .from("study_rooms")
      .select("*")
      .eq("is_open", true)
      .order("sort_order", { ascending: true, nullsFirst: true })
      .order("name", { ascending: true });

    const { data, error } = await q;
    if (error || !data) return [];

    const rooms: StudyRoom[] = data.map((r: any) => ({
      id: r.id,
      name: r.name,
      description: r.description ?? "",
      branchId: r.branch_id ?? "all",
      mode: r.mode ?? "focus",
      activeCount: 0,
      maxParticipants: r.max_participants ?? DEFAULT_MAX_PARTICIPANTS,
      createdAt: r.created_at,
      isOpen: r.is_open,
    }));

    if (branchId && branchId !== "all") {
      return rooms.filter((r) => r.branchId === branchId || r.branchId === "all");
    }

    return rooms;
  }

  /** Get a single room by ID. */
  async getRoom(roomId: string): Promise<StudyRoom | null> {
    const supabase = getChatSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from("study_rooms")
      .select("*")
      .eq("id", roomId)
      .maybeSingle();

    if (error || !data) return null;

    const r = data as any;
    return {
      id: r.id,
      name: r.name,
      description: r.description ?? "",
      branchId: r.branch_id ?? "all",
      mode: r.mode ?? "focus",
      activeCount: 0,
      maxParticipants: r.max_participants ?? DEFAULT_MAX_PARTICIPANTS,
      createdAt: r.created_at,
      isOpen: r.is_open,
    };
  }

  /** Subscribe to room updates. */
  subscribeRoom(roomId: string, onChange: (room: StudyRoom) => void): () => void {
    return realRealtimeProvider.subscribeRoom(roomId, onChange);
  }

  /** Join a room — track presence via Supabase. */
  async joinRoom(roomId: string, participant: Participant): Promise<() => void> {
    const supabase = getChatSupabase();
    if (!supabase) return () => {};

    // Insert presence record
    await supabase.from("study_room_presence").upsert(
      {
        room_id: roomId,
        user_id: participant.id,
        participant_label: participant.label,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "room_id,user_id" }
    );

    // Subscribe to presence via Realtime
    return realRealtimeProvider.subscribePresence(roomId, (participants) => {
      // Participants are delivered via the callback
    });
  }

  /** Leave a room. */
  async leaveRoom(roomId: string, participantId: string): Promise<void> {
    const supabase = getChatSupabase();
    if (!supabase) return;

    await supabase
      .from("study_room_presence")
      .delete()
      .eq("room_id", roomId)
      .eq("user_id", participantId);
  }

  /** Get current participants in a room. */
  async getParticipants(roomId: string): Promise<Participant[]> {
    const supabase = getChatSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("study_room_presence")
      .select("user_id, participant_label, joined_at, last_seen_at")
      .eq("room_id", roomId)
      .gte("last_seen_at", new Date(Date.now() - 300000).toISOString()) // last 5 min
      .order("joined_at", { ascending: true });

    if (error || !data) return [];

    return data.map((row: any) => ({
      id: row.user_id,
      joinedAt: new Date(row.joined_at).getTime(),
      isMuted: false,
      isVideoOn: false,
      label: row.participant_label ?? "Student",
    }));
  }

  /** Clean up all subscriptions. */
  destroy(): void {
    this.unsubs.forEach((u) => u());
    this.unsubs = [];
    realRealtimeProvider.destroy();
  }
}

/** Backward-compatible singleton instance */
export const roomServiceInstance = new RoomService();

/** Convenience function — returns a promise (async). */
export function roomService(): Promise<StudyRoom[]> {
  return roomServiceInstance.getRooms();
}
