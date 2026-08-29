/**
 * RealChatProvider — uses the Chat module's Supabase-backed services
 * for real multi-user chat in study rooms.
 *
 * Requires authentication. Anonymous users cannot send messages.
 *
 * Each study room maps to a conversation. On first authenticated join, a
 * conversation is created for the room. Subsequent joins reuse the existing
 * conversation.
 *
 * Realtime is handled via Supabase Realtime subscriptions on the messages table.
 */

import type { ChatProvider } from "../types/adapters";
import type { ChatMessage } from "../types/index";
import {
  createConversation as createRoomConversation,
} from "@/modules/chat/services/conversations";
import {
  listMessages,
  sendMessage as sendChatMessage,
} from "@/modules/chat/services/messages";
import {
  subscribeToMessages as subscribeChatMessages,
  cleanupAllRealtime,
} from "@/modules/chat/services/realtime";
import { getChatSupabase } from "@/modules/chat/services/supabase";

const ROOM_CONVERSATION_MAP_KEY = "eduneuro_room_conv_map";

interface StoredMap {
  [roomId: string]: string;
}

function getRoomConversationMap(): StoredMap {
  if (typeof window === "undefined") return {};
  const raw = sessionStorage.getItem(ROOM_CONVERSATION_MAP_KEY);
  if (raw) {
    try { return JSON.parse(raw); } catch { return {}; }
  }
  return {};
}

function setRoomConversationMap(map: StoredMap): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(ROOM_CONVERSATION_MAP_KEY, JSON.stringify(map));
}

export class RealChatProvider implements ChatProvider {
  readonly enabled = true;

  /**
   * Get or create the conversation for a study room.
   */
  private async getOrCreateConversation(roomId: string): Promise<string | null> {
    const supabase = getChatSupabase();
    if (!supabase) return null;

    // Check sessionStorage for cached mapping
    const map = getRoomConversationMap();
    const cachedId = map[roomId];

    if (cachedId) {
      // Verify it still exists
      const { data } = await supabase
        .from("conversations")
        .select("id")
        .eq("id", cachedId)
        .maybeSingle();
      if (data) return cachedId;
      delete map[roomId];
      setRoomConversationMap(map);
    }

    // Check if a conversation with this room subject already exists
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("subject", `room:${roomId}`)
      .maybeSingle();

    if (existing) {
      // Auto-join as participant
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("conversation_participants")
          .upsert(
            { conversation_id: existing.id, user_id: user.id },
            { onConflict: "conversation_id,user_id", ignoreDuplicates: true }
          );
      }
      const updated = { ...map, [roomId]: existing.id };
      setRoomConversationMap(updated);
      return existing.id;
    }

    // Create new conversation via RPC
    const { data } = await createRoomConversation({ subject: `room:${roomId}` });
    if (data?.id) {
      const updated = { ...map, [roomId]: data.id };
      setRoomConversationMap(updated);
      return data.id;
    }

    return null;
  }

  async isAuthenticated(): Promise<boolean> {
    const supabase = getChatSupabase();
    if (!supabase) return false;
    const { data: { user } } = await supabase.auth.getUser();
    return !!user;
  }

  subscribe(roomId: string, onMessage: (message: ChatMessage) => void): () => void {
    return subscribeChatMessages(roomId, (record) => {
      const senderName =
        (record as any).sender?.full_name
          ? (record as any).sender.full_name
          : (record as any).sender?.email?.split("@")[0] ?? "User";

      const msg: ChatMessage = {
        id: record.id,
        roomId,
        authorId: record.sender_id,
        authorLabel: senderName,
        content: record.content,
        timestamp: record.created_at,
        type: record.content_type === "system" ? "system" : "text",
      };
      onMessage(msg);
    });
  }

  async sendMessage(roomId: string, content: string): Promise<ChatMessage> {
    const supabase = getChatSupabase();
    if (!supabase) throw new Error("Chat service unavailable.");

    const { data: { user } } = await supabase.auth.getUser();

    // Ensure user has a profile
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile) {
        const displayName = user.email?.split("@")[0] ?? "User";
        await supabase.from("profiles").upsert({
          id: user.id,
          role: "student",
          display_name: displayName,
          full_name: displayName,
          email: user.email,
        }, { onConflict: "id", ignoreDuplicates: true });
      }
    }

    const conversationId = await this.getOrCreateConversation(roomId);
    if (!conversationId) {
      throw new Error("Could not create or find room conversation.");
    }

    // Ensure sender is a participant
    if (user) {
      await supabase
        .from("conversation_participants")
        .upsert(
          { conversation_id: conversationId, user_id: user.id },
          { onConflict: "conversation_id,user_id", ignoreDuplicates: true }
        );
    }

    const { data, error } = await sendChatMessage({
      conversationId,
      content: content.trim(),
    });

    if (error || !data) {
      throw new Error(error ?? "Failed to send message.");
    }

    const senderName =
      data.sender?.full_name
        ? data.sender.full_name
        : data.sender?.email?.split("@")[0] ?? "User";

    return {
      id: data.id,
      roomId,
      authorId: data.sender_id,
      authorLabel: senderName,
      content: data.content,
      timestamp: data.created_at,
      type: "text",
    };
  }

  async getHistory(roomId: string, limit = 50): Promise<ChatMessage[]> {
    const supabase = getChatSupabase();
    if (!supabase) return [];

    const conversationId = await this.getOrCreateConversation(roomId);
    if (!conversationId) return [];

    const { data, error } = await listMessages(conversationId, { limit });
    if (error || !data) return [];

    return data.messages.map((m) => ({
      id: m.id,
      roomId,
      authorId: m.sender_id,
      authorLabel: m.sender?.full_name
        ? m.sender.full_name
        : m.sender?.email?.split("@")[0] ?? "User",
      content: m.content,
      timestamp: m.created_at,
      type: m.content_type === "system" ? "system" : "text",
    }));
  }
}
