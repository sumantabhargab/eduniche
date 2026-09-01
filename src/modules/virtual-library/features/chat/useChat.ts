/**
 * useChat — manages local chat state for the virtual library.
 *
 * Supports two scopes:
 *   "library"  — messages visible to everyone in the library
 *   "room"     — messages visible only within the current room/zone
 *
 * Uses Supabase Realtime subscriptions for incoming messages.
 * Falls back gracefully when Supabase is unavailable.
 */

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getChatSupabase } from "@/modules/chat/services/supabase";

export interface ChatMessage {
  id: string;
  scope: "library" | "room";
  roomId?: string;
  userId: string;
  userName: string;
  userColor: string;
  text: string;
  timestamp: number;
}

const COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f59e0b",
  "#10b981", "#3b82f6", "#ef4444", "#14b8a6",
];

function getUserColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

const MAX_MESSAGES = 200;

interface UseChatOptions {
  /** Scope of this chat instance: "library" or "room" */
  scope: "library" | "room";
  /** Room ID for room-scoped chats */
  roomId?: string;
  /** Current user ID */
  userId: string;
  /** Current user display name */
  userName: string;
}

export function useChat({ scope, roomId, userId, userName }: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Scroll when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Subscribe to Supabase Realtime
  useEffect(() => {
    const channelName =
      scope === "library" ? "chat:library" : `chat:room:${roomId}`;

    const client = getChatSupabase();
    if (!client) {
      return;
    }

    const channel = client
      .channel(channelName)
      .on(
        "broadcast",
        { event: "message" },
        (payload: { payload: ChatMessage }) => {
          const msg = payload.payload;
          if (msg.scope !== scope) return;
          if (scope === "room" && msg.roomId !== roomId) return;

          setMessages((prev) => {
            // Deduplicate
            if (prev.some((m) => m.id === msg.id)) return prev;
            const next = [...prev, msg];
            return next.length > MAX_MESSAGES ? next.slice(-MAX_MESSAGES) : next;
          });
        }
      )
      .subscribe((status: string) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    channelRef.current = channel;

    return () => {
      client.removeChannel(channel);
      channelRef.current = null;
    };
  }, [scope, roomId]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const msg: ChatMessage = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        scope,
        roomId,
        userId,
        userName,
        userColor: getUserColor(userId),
        text: trimmed,
        timestamp: Date.now(),
      };

      // Optimistic local update
      setMessages((prev) => {
        const next = [...prev, msg];
        return next.length > MAX_MESSAGES ? next.slice(-MAX_MESSAGES) : next;
      });

      // Broadcast via Supabase
      try {
        const c = getChatSupabase();
        if (channelRef.current && c) {
          await channelRef.current.send({
            type: "broadcast",
            event: "message",
            payload: msg,
          });
        }
      } catch {
        // Supabase not available — message is already in local state
      }
    },
    [scope, roomId, userId, userName]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    input,
    setInput,
    sendMessage,
    isConnected,
    clearMessages,
    messagesEndRef,
  };
}
