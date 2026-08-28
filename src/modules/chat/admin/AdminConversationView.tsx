/**
 * AdminConversationView — the conversation detail view for admins.
 * Includes header with user info + close/reopen button, message list, and composer.
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { useAdminMessages } from "../hooks/useAdminMessages";
import { findConversationById, updateConversation } from "../services/conversations";
import { type Conversation } from "../types/chat";
import { MessageList } from "../components/MessageList";
import { MessageComposer } from "../components/MessageComposer";
import { formatRelativeTime } from "../utils/format";

interface AdminConversationViewProps {
  conversationId?: string;
  admin?: {
    user: {
      email: string;
      role: string;
    };
  };
  onRefresh?: () => void;
}

export default function AdminConversationView({
  conversationId: propId,
  admin,
  onRefresh,
}: AdminConversationViewProps) {
  const [internalId, setInternalId] = useState<string | null>(propId ?? null);
  const conversationId = propId ?? internalId;

  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-background-alt flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5 21.73V12a9 9 0 0 1 9-9h.25" />
            </svg>
          </div>
          <p className="text-sm text-muted">Select a conversation to view messages.</p>
        </div>
      </div>
    );
  }
  const { messages, isLoading, hasMore, error, send, loadOlder } =
    useAdminMessages({ conversationId });
  const [conv, setConv] = useState<Conversation | null>(null);

  useEffect(() => {
    let cancelled = false;
    findConversationById(conversationId).then((result) => {
      if (cancelled) return;
      if (result.data) setConv(result.data);
    });
    return () => { cancelled = true; };
  }, [conversationId]);

  const handleToggleStatus = useCallback(async () => {
    if (!conv) return;
    const newStatus = conv.status === "closed" ? "open" : "closed";
    const result = await updateConversation(conversationId, { status: newStatus });
    if (result.data) {
      setConv(result.data);
      onRefresh?.();
    }
  }, [conv, conversationId, onRefresh]);

  const title = conv?.other_participant
    ? conv.other_participant.full_name ?? conv.other_participant.email
    : "Unknown User";

  const subtitle = conv?.subject
    ? `${conv.subject}`
    : messages.length > 0
      ? formatRelativeTime(messages[messages.length - 1]?.created_at)
      : "";

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-border shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-accent text-background flex items-center justify-center text-sm font-medium shrink-0">
            {title.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{title}</p>
            {subtitle && (
              <p className="text-xs text-muted truncate">{subtitle}</p>
            )}
          </div>
        </div>

        <button
          onClick={handleToggleStatus}
          className={`
            text-xs px-3 py-1.5 rounded-lg font-medium
            transition-colors
            ${(conv?.status === "closed")
              ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
              : "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
            }
          `}
        >
          {conv?.status === "closed" ? "Reopen" : "Close"}
        </button>
      </div>

      {error && (
        <div className="mx-3 mt-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      <MessageList
        messages={messages}
        isLoading={isLoading}
        hasMore={hasMore}
        onLoadOlder={loadOlder}
        currentUserId="admin"
      />

      <MessageComposer onSend={send} disabled={false} placeholder="Reply as admin…" />
    </>
  );
}
