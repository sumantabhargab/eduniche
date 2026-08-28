/**
 * useAdminConversations — admin-specific conversation listing.
 *
 * Uses the adminSupabase client which bypasses RLS to fetch ALL conversations.
 * Admin routes are protected server-side by middleware and by the database RPC
 * (chat_admin_list_conversations) which enforces admin role.
 */

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getChatSupabase } from "../services/supabase";
import type { Conversation, ConversationFilters } from "../types/chat";

export interface UseAdminConversationsOptions {
  filters?: ConversationFilters;
  refreshMs?: number;
}

export interface UseAdminConversationsReturn {
  conversations: Conversation[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
  totalUnread: number;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export function useAdminConversations(
  opts: UseAdminConversationsOptions = {}
): UseAdminConversationsReturn {
  const { refreshMs = 10000 } = opts;
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const CONVERSATION_SELECT = `
    id, status, created_at, updated_at, last_message_at, created_by, subject,
    last_message:messages!messages_conversation_id_fkey (
      id, conversation_id, sender_id, content, content_type,
      created_at, edited_at, deleted_at, send_state
    ),
    participants:conversation_participants!conversation_participants_conversation_id_fkey (
      id, conversation_id, user_id, joined_at, last_read_at,
      profile:profiles!conversation_participants_user_id_fkey (
        id, full_name, email, avatar_url
      )
    )
  `;

  const load = useCallback(async () => {
    setError(null);
    const supabase = getChatSupabase();
    if (!supabase) {
      setError("Chat service unavailable.");
      setIsLoading(false);
      return;
    }

    // Verify current user is admin
    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes?.user;
    if (!user) {
      setError("Not authenticated.");
      setIsLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || profile.role !== "admin") {
      setError("Forbidden.");
      setIsLoading(false);
      return;
    }

    // Fetch all conversations
    const { data, error } = await supabase
      .from("conversations")
      .select(CONVERSATION_SELECT)
      .order("last_message_at", { ascending: false, nullsFirst: false });

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    if (!data) {
      setConversations([]);
      setIsLoading(false);
      return;
    }

    // Enrich with unread counts and participant info
    const enriched: Conversation[] = data.map((c: any) => {
      const participantMessages = (c.last_message ?? []) as any[];
      const lastMessage: any = Array.isArray(participantMessages)
        ? participantMessages[participantMessages.length - 1]
        : participantMessages;

      // Compute total unread for this conversation across all participants
      const participantRows = (c.participants ?? []) as any[];
      const otherParticipants = participantRows.filter(
        (p) => p.user_id !== user.id
      );

      let unreadCount = 0;
      for (const p of otherParticipants) {
        const lastRead = p.last_read_at;
        const msgsForUnread = participantMessages;
        for (const m of msgsForUnread) {
          if (m.sender_id !== p.user_id && !m.deleted_at) {
            if (!lastRead || m.created_at > lastRead) unreadCount++;
          }
        }
      }

      const otherParticipant = participantRows
        .filter((p) => p.user_id !== user.id)
        .sort(
          (a, b) =>
            new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime()
        )[0];

      return {
        id: c.id,
        status: c.status,
        created_at: c.created_at,
        updated_at: c.updated_at,
        last_message_at: c.last_message_at,
        created_by: c.created_by,
        subject: c.subject,
        other_participant: otherParticipant
          ? {
              id: otherParticipant.profile?.id ?? otherParticipant.user_id,
              full_name: otherParticipant.profile?.full_name ?? null,
              email: otherParticipant.profile?.email ?? "",
              avatar_url: otherParticipant.profile?.avatar_url ?? null,
            }
          : undefined,
        last_message: lastMessage
          ? {
              id: lastMessage.id,
              conversation_id: lastMessage.conversation_id,
              sender_id: lastMessage.sender_id,
              content: lastMessage.content,
              content_type: lastMessage.content_type,
              created_at: lastMessage.created_at,
              edited_at: lastMessage.edited_at,
              deleted_at: lastMessage.deleted_at,
              send_state: lastMessage.send_state,
            }
          : undefined,
        unread_count: unreadCount,
        participant_count: participantRows.length,
      };
    });

    setConversations(enriched);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Periodic refresh
  useEffect(() => {
    if (refreshMs <= 0) return;
    const interval = setInterval(load, refreshMs);
    return () => clearInterval(interval);
  }, [load, refreshMs]);

  // Apply search filter
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter((c) => {
      const name = c.other_participant?.full_name?.toLowerCase() ?? "";
      const email = c.other_participant?.email?.toLowerCase() ?? "";
      const subject = c.subject?.toLowerCase() ?? "";
      const lastContent = c.last_message?.content?.toLowerCase() ?? "";
      return (
        name.includes(q) ||
        email.includes(q) ||
        subject.includes(q) ||
        lastContent.includes(q)
      );
    });
  }, [conversations, searchQuery]);

  // Sort: unread first, then by last_message_at
  const sortedConversations = useMemo(() => {
    return [...filteredConversations].sort((a, b) => {
      // Unread first
      const aHasUnread = a.unread_count > 0 ? 1 : 0;
      const bHasUnread = b.unread_count > 0 ? 1 : 0;
      if (aHasUnread !== bHasUnread) return bHasUnread - aHasUnread;

      // Then by last_message_at
      const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
      const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
      return bTime - aTime;
    });
  }, [filteredConversations]);

  const totalUnread = useMemo(
    () => conversations.reduce((sum, c) => sum + c.unread_count, 0),
    [conversations]
  );

  return {
    conversations: sortedConversations,
    isLoading,
    error,
    refresh: load,
    totalUnread,
    searchQuery,
    setSearchQuery,
  };
}
