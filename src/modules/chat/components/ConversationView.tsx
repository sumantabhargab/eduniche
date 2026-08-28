/**
 * ConversationView — the full chat view shown inside the chat panel
 * when a conversation is selected.
 */

"use client";

import { useEffect, useState } from "react";
import { MessageList } from "./MessageList";
import { MessageComposer } from "./MessageComposer";
import { useMessages } from "../hooks/useMessages";
import { findConversationById } from "../services/conversations";
import { ChatHeader } from "./ChatHeader";
import { displayName, formatRelativeTime } from "../utils/format";

interface ConversationViewProps {
  conversationId: string | null;
}

export function ConversationView({ conversationId }: ConversationViewProps) {
  const {
    messages,
    isLoading,
    hasMore,
    error,
    send,
    loadOlder,
  } = useMessages({ conversationId });

  const [convSubject, setConvSubject] = useState<string>("");
  const [otherName, setOtherName] = useState<string>("");

  // Fetch conversation info
  useEffect(() => {
    if (!conversationId) return;
    let cancelled = false;

    findConversationById(conversationId).then((result) => {
      if (cancelled || !result.data) return;
      setConvSubject(result.data.subject ?? "");
      const other = result.data.other_participant;
      if (other) {
        setOtherName(displayName(other.full_name, other.email));
      }
    });

    return () => { cancelled = true; };
  }, [conversationId]);

  const title = otherName || "Chat";
  const subtitle = convSubject
    ? `${convSubject} · ${formatRelativeTime(messages[messages.length - 1]?.created_at)}`
    : formatRelativeTime(messages[messages.length - 1]?.created_at);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ChatHeader
        title={title}
        subtitle={subtitle}
        onClose={() => {}}
      />
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
      />
      <MessageComposer onSend={send} disabled={false} />
    </div>
  );
}
