/**
 * ConversationItemList + ConversationItem — admin sidebar items.
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import type { Conversation } from "../../types/chat";
import { displayName, formatRelativeTime, truncate } from "../../utils/format";

interface ConversationItemListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function ConversationItemList({
  conversations,
  selectedId,
  onSelect,
}: ConversationItemListProps) {
  // Sort: unread first, then by last_message_at
  const sorted = [...conversations].sort((a, b) => {
    const aHasUnread = a.unread_count > 0 ? 1 : 0;
    const bHasUnread = b.unread_count > 0 ? 1 : 0;
    if (aHasUnread !== bHasUnread) return bHasUnread - aHasUnread;
    const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
    const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
    return bTime - aTime;
  });

  return (
    <>
      {sorted.map((conv) => (
        <button
          key={conv.id}
          onClick={() => onSelect(conv.id)}
          className={`
            w-full flex items-start gap-3 px-3 py-3 text-left
            hover:bg-background-alt transition-colors duration-150
            border-l-2
            ${selectedId === conv.id ? "border-accent bg-background-alt" : "border-transparent"}
          `}
        >
          <div className="w-9 h-9 rounded-full bg-accent-subtle text-accent flex items-center justify-center text-sm font-medium shrink-0">
            {(conv.other_participant?.full_name ?? conv.other_participant?.email ?? "U")
              .charAt(0)
              .toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-foreground truncate">
                {displayName(conv.other_participant?.full_name ?? null, conv.other_participant?.email ?? "")}
              </span>
              {conv.last_message && (
                <span className="text-[10px] text-muted shrink-0">
                  {formatRelativeTime(conv.last_message.created_at)}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between gap-2 mt-0.5">
              <p className="text-xs text-muted truncate">
                {conv.last_message?.deleted_at
                  ? "Message deleted"
                  : conv.last_message
                    ? truncate(conv.last_message.content, 40)
                    : "No messages yet"}
              </p>
              {conv.unread_count > 0 && (
                <span className="shrink-0 min-w-[20px] h-5 bg-accent text-background text-xs font-bold rounded-full flex items-center justify-center px-1.5">
                  {conv.unread_count > 9 ? "9+" : conv.unread_count}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              {conv.subject && (
                <span className="text-[10px] text-muted-light bg-background px-1.5 py-0.5 rounded">
                  {conv.subject}
                </span>
              )}
              {conv.status === "closed" && (
                <span className="text-[10px] text-muted-light bg-background px-1.5 py-0.5 rounded">
                  Closed
                </span>
              )}
            </div>
          </div>
        </button>
      ))}
    </>
  );
}
