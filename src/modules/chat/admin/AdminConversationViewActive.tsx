/**
 * AdminConversationViewActive — actual conversation view implementation.
 *
 * This is a "use client" component rendered after AdminConversationView
 * validates the conversationId prop. Keeping the hook usage separate from
 * the conditional empty-state render avoids violating the rules of hooks.
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { useAdminMessages } from "../hooks/useAdminMessages";
import { findConversationById, updateConversation, getCurrentUser } from "../services/conversations";
import { type Conversation } from "../types/chat";
import { MessageList } from "../components/MessageList";
import { MessageComposer } from "../components/MessageComposer";
import { formatRelativeTime } from "../utils/format";

interface AdminConversationViewActiveProps {
  conversationId: string;
  onRefresh?: () => void;
}

export default function AdminConversationViewActive({
  conversationId,
  onRefresh,
}: AdminConversationViewActiveProps) {
  const [adminUserId, setAdminUserId] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser().then((user) => {
      if (user?.id) setAdminUserId(user.id);
    });
  }, []);

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
          disabled={!conv}
          className={`
            text-xs px-3 py-1.5 rounded-lg font-medium
            transition-colors disabled:opacity-50 disabled:cursor-not-allowed
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
        currentUserId={adminUserId ?? undefined}
      />

      <MessageComposer onSend={send} disabled={false} placeholder="Reply as admin…" />
    </>
  );
}
