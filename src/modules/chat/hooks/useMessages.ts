/**
 * useMessages — fetch and subscribe to messages in a conversation.
 *
 * Loads the most recent page of messages, then listens for new ones
 * via Supabase Realtime. Handles optimistic send state and error recovery.
 */

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  listMessages,
  sendMessage,
  subscribeToMessages,
  markConversationRead,
} from "..";
import type { Message, MessagesPage } from "../types/chat";

export interface UseMessagesOptions {
  /** Conversation ID to load. */
  conversationId: string | null;
  /** Messages per page. */
  pageSize?: number;
}

export interface UseMessagesReturn {
  /** All loaded messages in chronological order. */
  messages: Message[];
  /** Whether the first load is in progress. */
  isLoading: boolean;
  /** Whether there are more messages to load (older). */
  hasMore: boolean;
  /** Current error state. */
  error: string | null;
  /** Send a message (returns a Promise that resolves to the server-confirmed message or an error). */
  send: (content: string) => Promise<{ data: Message | null; error: string | null }>;
  /** Load older messages (cursor-based). */
  loadOlder: () => Promise<void>;
  /** Mark this conversation as read. */
  markRead: () => Promise<void>;
  /** Clear state (e.g., when conversation changes). */
  reset: () => void;
}

export function useMessages(opts: UseMessagesOptions): UseMessagesReturn {
  const { conversationId, pageSize = 30 } = opts;
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep track of the earliest loaded message for cursor pagination
  const earliestIsoRef = useRef<string | null>(null);

  const reset = useCallback(() => {
    setMessages([]);
    setIsLoading(false);
    setHasMore(false);
    setError(null);
    earliestIsoRef.current = null;
  }, []);

  // Load the most recent page of messages
  const loadLatest = useCallback(
    async (isInitial = false) => {
      if (!conversationId) return;
      if (isInitial) setIsLoading(true);
      setError(null);

      const result = await listMessages(conversationId, {
        limit: pageSize,
      });

      if (result.error) {
        setError(result.error);
        if (isInitial) setIsLoading(false);
        return;
      }

      const { messages: page, hasMore: hm } = result.data;
      setMessages(page);
      setHasMore(hm);

      // Set the cursor to the earliest message in this page
      if (page.length > 0) {
        earliestIsoRef.current = page[0].created_at;
      }

      if (isInitial) setIsLoading(false);
    },
    [conversationId, pageSize]
  );

  // Load older messages (before earliestIsoRef)
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

  // Send a message
  const send = useCallback(
    async (content: string) => {
      if (!conversationId) return { data: null, error: "No conversation selected." };

      const trimmed = content.trim();
      if (!trimmed) return { data: null, error: "Message is empty." };

      // Optimistic insert
      const optimistic: Message = {
        id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        conversation_id: conversationId,
        sender_id: "__self__", // will be replaced by server confirmation
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
          // Mark optimistic as failed
          setMessages((prev) =>
            prev.map((m) =>
              m.id === optimistic.id ? { ...m, send_state: "failed" as const } : m
            )
          );
          return result;
        }

        // Replace optimistic with real message
        if (result.data) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === optimistic.id ? result.data! : m
            )
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

  // Mark read
  const markRead = useCallback(async () => {
    if (!conversationId) return;
    await markConversationRead(conversationId);
  }, [conversationId]);

  // Load messages when conversation changes
  useEffect(() => {
    reset();
    if (conversationId) {
      loadLatest(true);
    }
  }, [conversationId, loadLatest, reset]);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!conversationId) return;

    const unsub = subscribeToMessages(conversationId, (msg) => {
      const realMessage = msg as Message;
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((m) => m.id === realMessage.id)) return prev;
        return [...prev, realMessage];
      });
    });

    return unsub;
  }, [conversationId]);

  // Track conversations with a ref to avoid stale closures in intervals
  const convIdRef = useRef(conversationId);
  convIdRef.current = conversationId;

  // Periodic read mark
  useEffect(() => {
    if (!conversationId) return;
    markRead();
    const interval = setInterval(markRead, 5000);
    return () => clearInterval(interval);
  }, [conversationId, markRead]);

  return {
    messages,
    isLoading,
    hasMore,
    error,
    send,
    loadOlder,
    markRead,
    reset,
  };
}
