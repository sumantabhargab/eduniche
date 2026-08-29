/**
 * RealRealtimeProvider — uses Supabase Realtime for:
 * - Presence (online users in a room)
 * - Room state subscriptions
 */

import type { RealtimeProvider } from "../types/adapters";
import type { Participant, StudyRoom } from "../types/index";
import { getChatSupabase } from "@/modules/chat/services/supabase";

type PresenceHandler = (participants: Participant[]) => void;
type RoomHandler = (room: StudyRoom) => void;

const PRESENCE_CHANNEL_PREFIX = "eduneuro:presence:";
const ROOM_CHANNEL_PREFIX = "eduneuro:room:";

export class RealRealtimeProvider implements RealtimeProvider {
  readonly enabled = true;

  private presenceChannels: Map<string, { unsubscribe: () => void; participants: Map<string, Participant> }> =
    new Map();
  private roomChannels: Map<string, { unsubscribe: () => void }> = new Map();

  /**
   * Subscribe to presence changes in a room.
   * Uses Postgres presence track on a lightweight presence table concept,
   * but since we don't have a dedicated presence table, we use a Realtime
   * broadcast channel for lightweight peer awareness.
   */
  subscribePresence(roomId: string, onChange: PresenceHandler): () => void {
    const supabase = getChatSupabase();
    if (!supabase) {
      onChange([]);
      return () => {};
    }

    // Clean up existing subscription
    const existing = this.presenceChannels.get(roomId);
    if (existing) {
      existing.unsubscribe();
    }

    const channel = supabase.channel(`${PRESENCE_CHANNEL_PREFIX}${roomId}`, {
      config: { presence: { key: "" } },
    });

    const participantMap = new Map<string, Participant>();

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      const participants: Participant[] = [];

      for (const [key, presences] of Object.entries(state)) {
        const presenceList = Array.isArray(presences) ? presences : [presences];
        for (const p of presenceList) {
          const presence = p as Record<string, any>;
          const participant: Participant = {
            id: presence.user_id || key,
            joinedAt: Date.now(),
            isMuted: false,
            isVideoOn: false,
            label: presence.user_name || presence.user_email?.split("@")[0] || "Student",
          };
          participantMap.set(participant.id, participant);
          participants.push(participant);
        }
      }

      onChange(participants);
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        // Track presence with current user info
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, email")
            .eq("id", user.id)
            .maybeSingle();

          channel.track({
            user_id: user.id,
            user_name: profile?.full_name || user.email?.split("@")[0] || "User",
            user_email: user.email || "",
            joined_at: Date.now(),
          } as any);
        }
      }

      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        console.warn(`[realtime] Presence channel for room ${roomId}: ${status}`);
      }
    });

    const entry = {
      unsubscribe: () => {
        channel.unsubscribe();
        this.presenceChannels.delete(roomId);
      },
      participants: participantMap,
    };

    this.presenceChannels.set(roomId, entry);
    return entry.unsubscribe;
  }

  announcePresence(_roomId: string, _participant: Participant): () => void {
    // Presence is handled via channel.track() in subscribePresence
    return () => {};
  }

  subscribeRoom(roomId: string, onChange: RoomHandler): () => void {
    const existing = this.roomChannels.get(roomId);
    if (existing) {
      existing.unsubscribe();
    }

    // For rooms, we just emit once with the initial state.
    // The RoomService manages the actual room data.
    const room: StudyRoom = {
      id: roomId,
      name: roomId,
      description: "Study room",
      branchId: "all",
      mode: "focus",
      activeCount: 0,
      maxParticipants: 50,
      createdAt: new Date().toISOString(),
      isOpen: true,
    };

    // Set up a lightweight interval to refresh presence count
    const supabase = getChatSupabase();
    if (supabase) {
      const channel = supabase.channel(`${ROOM_CHANNEL_PREFIX}${roomId}`);
      channel.subscribe();
    }

    const unsub = () => {
      this.roomChannels.delete(roomId);
    };

    this.roomChannels.set(roomId, { unsubscribe: unsub });
    onChange(room);
    return unsub;
  }

  destroy(): void {
    for (const [roomId, entry] of this.presenceChannels) {
      entry.unsubscribe();
    }
    this.presenceChannels.clear();

    for (const [roomId, entry] of this.roomChannels) {
      entry.unsubscribe();
    }
    this.roomChannels.clear();
  }
}

/** Singleton instance. */
export const realRealtimeProvider = new RealRealtimeProvider();
