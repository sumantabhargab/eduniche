/**
 * useConversations — fetch and manage the list of conversations.
 */

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type Conversation,
  listMyConversations,
  markConversationRead,
} from "../services/conversations";

export interface UseConversationsOptions {
  /** Optional status filter. */
  status?: "open" | "closed" | "archived";
  /** Refresh interval in ms (default 15s for unread count freshness). */
  refreshMs?: number;
}

export interface UseConversationsReturn {
  conversations: Conversation[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
  totalUnread: number;
}

export function useConversations(
  opts: UseConversationsOptions = {}
): UseConversationsReturn {
  const { status, refreshMs = 15000 } = opts;
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const { data, error } = await listMyConversations({ status });

    if (error) {
      setError(error);
      return;
    }

    setConversations(data ?? []);
    setIsLoading(false);
  }, [status]);

  useEffect(() => {
    setIsLoading(true);
    load();
  }, [load]);

  // Periodic refresh to catch read-state changes from other tabs
  useEffect(() => {
    if (refreshMs <= 0) return;
    const interval = setInterval(load, refreshMs);
    return () => clearInterval(interval);
  }, [load, refreshMs]);

  const totalUnread = useMemo(
    () => conversations.reduce((sum, c) => sum + c.unread_count, 0),
    [conversations]
  );

  return {
    conversations,
    isLoading,
    error,
    refresh: load,
    totalUnread,
  };
}

/**
 * Open a conversation and mark it as read on the server.
 */
export async function openConversation(
  conversationId: string
): Promise<{ conversation: Conversation | null; error: string | null }> {
  const { findConversationById } = await import("../services/conversations");
  const result = await findConversationById(conversationId);
  if (result.error) return result;

  // Fire-and-forget: mark as read
  markConversationRead(conversationId).catch(() => {});
  return result;
}
