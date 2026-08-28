/**
 * useAdminMessages — admin message view for a conversation.
 *
 * Fetches the full message history and subscribes to new messages.
 * The admin joins the conversation as a participant if not already.
 */

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  listMessages,
  sendMessage,
  subscribeToMessages,
  markConversationRead,
  joinConversationAsAdmin,
} from "..";
import type { Message, MessagesPage } from "../types/chat";

export interface UseAdminMessagesOptions {
  conversationId: string | null;
  pageSize?: number;
}

export interface UseAdminMessagesReturn {
  messages: Message[];
  isLoading: boolean;
  hasMore: boolean;
  error: string | null;
  send: (content: string) => Promise<{ data: Message | null; error: string | null }>;
  loadOlder: () => Promise<void>;
  markRead: () => Promise<void>;
  reset: () => void;
  isJoined: boolean;
  isJoining: boolean;
}

export function useAdminMessages(opts: UseAdminMessagesOptions): UseAdminMessagesReturn {
  const { conversationId, pageSize = 50 } = opts;
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const earliestIsoRef = useRef<string | null>(null);

  const reset = useCallback(() => {
    setMessages([]);
    setIsLoading(false);
    setHasMore(false);
    setError(null);
    setIsJoined(false);
    earliestIsoRef.current = null;
  }, []);

  // Join as admin
  useEffect(() => {
    if (!conversationId) return;
    let cancelled = false;
    setIsJoining(true);

    joinConversationAsAdmin(conversationId)
      .then((res) => {
        if (!cancelled) {
          setIsJoined(!res.error);
          setIsJoining(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsJoined(false);
          setIsJoining(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  const loadLatest = useCallback(
    async (isInitial = false) => {
      if (!conversationId) return;
      if (isInitial) setIsLoading(true);
      setError(null);

      const result = await listMessages(conversationId, { limit: pageSize });
      if (result.error) {
        setError(result.error);
        if (isInitial) setIsLoading(false);
        return;
      }

      const { messages: page, hasMore: hm } = result.data;
      setMessages(page);
      setHasMore(hm);
      if (page.length > 0) earliestIsoRef.current = page[0].created_at;
      if (isInitial) setIsLoading(false);
    },
    [conversationId, pageSize]
  );

  const loadOlder = useCallback(async () => {
    if (!conversationId || isLoading || !hasMore || !earliestIsoRef.current) return;
    setIsLoading(true);
    const result = await listMessages(conversationId, {
      limit: pageSize,
      beforeIso: earliestIsoRef.current,
    });
    if (result.error) {
      setError(result.error);
      setIsLoading(false);
      return;
    }
    const { messages: page, hasMore: hm } = result.data;
    if (page.length > 0) {
      setMessages((prev) => [...page, ...prev]);
      earliestIsoRef.current = page[0].created_at;
    }
    setHasMore(hm);
    setIsLoading(false);
  }, [conversationId, pageSize, isLoading, hasMore]);

  const send = useCallback(
    async (content: string) => {
      if (!conversationId) return { data: null, error: "No conversation selected." };
      const trimmed = content.trim();
      if (!trimmed) return { data: null, error: "Message is empty." };

      const optimistic: Message = {
        id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        conversation_id: conversationId,
        sender_id: "__self__",
        content: trimmed,
        content_type: "text",
        created_at: new Date().toISOString(),
        edited_at: null,
        deleted_at: null,
        send_state: "sending",
      };
      setMessages((prev) => [...prev, optimistic]);

      try {
        const result = await sendMessage({
          conversationId,
          content: trimmed,
        });

        if (result.error) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === optimistic.id ? { ...m, send_state: "failed" as const } : m
            )
          );
          return result;
        }

        if (result.data) {
          setMessages((prev) =>
            prev.map((m) => (m.id === optimistic.id ? result.data! : m))
          );
        }
        return result;
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === optimistic.id ? { ...m, send_state: "failed" as const } : m
          )
        );
        return { data: null, error: "Network error." };
      }
    },
    [conversationId]
  );

  const markRead = useCallback(async () => {
    if (!conversationId) return;
    await markConversationRead(conversationId);
  }, [conversationId]);

  useEffect(() => {
    reset();
    if (conversationId) {
      loadLatest(true);
    }
  }, [conversationId, loadLatest, reset]);

  useEffect(() => {
    if (!conversationId) return;
    markRead();
  }, [conversationId, markRead]);

  useEffect(() => {
    if (!conversationId) return;
    const unsub = subscribeToMessages(conversationId, (msg) => {
      const realMessage = msg as Message;
      setMessages((prev) => {
        if (prev.some((m) => m.id === realMessage.id)) return prev;
        return [...prev, realMessage];
      });
    });
    return unsub;
  }, [conversationId]);

  return {
    messages,
    isLoading,
    hasMore,
    error,
    send,
    loadOlder,
    markRead,
    reset,
    isJoined,
    isJoining,
  };
}
