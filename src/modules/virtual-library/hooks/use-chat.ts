/**
 * Hook for chat state using real Supabase.
 *
 * Loads history, subscribes to realtime messages, sends via RPC.
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { ChatMessage } from "../types/index";
import {
  listMessages,
  sendMessage as sendChatMessage,
} from "@/modules/chat/services/messages";
import {
  createConversation as createRoomConversation,
} from "@/modules/chat/services/conversations";
import {
  subscribeToMessages,
  cleanupAllRealtime,
} from "@/modules/chat/services/realtime";
import { getChatSupabase } from "@/modules/chat/services/supabase";

const ROOM_CONV_KEY = "eduneuro_room_conv_v2";

interface StoredMap { [roomId: string]: string; }
function getMap(): StoredMap {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(sessionStorage.getItem(ROOM_CONV_KEY) || "{}"); } catch { return {}; }
}
function setMap(m: StoredMap): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(ROOM_CONV_KEY, JSON.stringify(m));
}

export interface UseChatOptions {
  roomId: string;
}

export interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  sendMessage: (content: string) => Promise<void>;
  clear: () => void;
  error: string | null;
  isAuthenticated: boolean;
}

export function useChat(options: UseChatOptions): UseChatReturn {
  const { roomId } = options;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const unsubRef = useRef<(() => void) | null>(null);

  // Check auth on mount
  useEffect(() => {
    (async () => {
      const supabase = getChatSupabase();
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    })();
  }, []);

  // Get or create conversation for room
  const getConversationId = useCallback(async (): Promise<string | null> => {
    const supabase = getChatSupabase();
    if (!supabase) return null;

    const map = getMap();
    const cached = map[roomId];
    if (cached) {
      const { data } = await supabase.from("conversations").select("id").eq("id", cached).maybeSingle();
      if (data) return cached;
    }

    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("subject", `room:${roomId}`)
      .maybeSingle();

    if (existing) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("conversation_participants")
          .upsert({ conversation_id: existing.id, user_id: user.id }, { onConflict: "conversation_id,user_id", ignoreDuplicates: true });
      }
      const m = { ...map, [roomId]: existing.id };
      setMap(m);
      return existing.id;
    }

    const { data: userData } = await supabase.auth.getUser();
    const { data } = await createRoomConversation({ subject: `room:${roomId}` });
    if (data?.id) {
      const m = { ...map, [roomId]: data.id };
      setMap(m);
      // Add current user as participant
      if (userData.user) {
        await supabase.from("conversation_participants").upsert(
          { conversation_id: data.id, user_id: userData.user.id },
          { onConflict: "conversation_id,user_id", ignoreDuplicates: true }
        );
      }
      return data.id;
    }
    return null;
  }, [roomId]);

  // Load history + subscribe
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setIsLoading(true);
      setError(null);

      const convId = await getConversationId();
      if (!convId || cancelled) {
        setIsLoading(false);
        return;
      }

      // Load history
      const { data, error } = await listMessages(convId, { limit: 50 });
      if (error) {
        setError(error);
      } else if (data) {
        const msgs: ChatMessage[] = data.messages.map((m) => ({
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
        setMessages(msgs);
      }

      setIsLoading(false);

      // Subscribe to new messages
      if (!cancelled) {
        unsubRef.current = subscribeToMessages(convId, (record) => {
          const senderName = (record as any).sender?.full_name
            ? (record as any).sender.full_name
            : (record as any).sender?.email?.split("@")[0] ?? "User";

          setMessages((prev) => {
            if (prev.find((m) => m.id === record.id)) return prev;
            return [...prev, {
              id: record.id,
              roomId,
              authorId: record.sender_id,
              authorLabel: senderName,
              content: record.content,
              timestamp: record.created_at,
              type: record.content_type === "system" ? "system" : "text",
            }];
          });
        });
      }
    })();

    return () => {
      cancelled = true;
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
      cleanupAllRealtime();
    };
  }, [roomId, getConversationId]);

  const sendMessage = useCallback(async (content: string) => {
    const supabase = getChatSupabase();
    if (!supabase) {
      setError("Chat service unavailable.");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Please sign in to send messages.");
      return;
    }

    const convId = await getConversationId();
    if (!convId) {
      setError("Could not join the conversation.");
      return;
    }

    const { data, error } = await sendChatMessage({
      conversationId: convId,
      content: content.trim(),
    });

    if (error || !data) {
      setError(error ?? "Failed to send.");
      return;
    }

    const senderName = data.sender?.full_name
      ? data.sender.full_name
      : data.sender?.email?.split("@")[0] ?? "You";

    setMessages((prev) => [...prev, {
      id: data.id,
      roomId,
      authorId: data.sender_id,
      authorLabel: senderName,
      content: data.content,
      timestamp: data.created_at,
      type: "text",
    }]);
  }, [roomId, getConversationId]);

  const clear = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isLoading, sendMessage, clear, error, isAuthenticated };
}
