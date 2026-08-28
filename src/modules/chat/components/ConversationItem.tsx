/**
 * ConversationItem — a single row in the conversation list.
 */

"use client";

import type { Conversation } from "../../types/chat";
import { displayName } from "../../utils/format";
import { formatClockTime, formatRelativeTime } from "../../utils/format";

interface ConversationItemProps {
  conversation: Conversation;
  onClick: () => void;
}

export function ConversationItem({ conversation, onClick }: ConversationItemProps) {
  const other = conversation.other_participant;
  const last = conversation.last_message;
  const name = other ? displayName(other.full_name, other.email) : "Unknown";
  const preview = last
    ? last.deleted_at
      ? "Message deleted"
      : truncate(last.content, 50)
    : "No messages yet";
  const time = last ? formatRelativeTime(last.created_at) : "";

  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-start gap-3 px-4 py-3 text-left
        hover:bg-background-alt transition-colors duration-150
        focus:outline-none focus-visible:bg-background-alt
      `}
    >
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-accent-subtle text-accent flex items-center justify-center text-sm font-medium shrink-0 mt-0.5">
        {name.charAt(0).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-foreground truncate">
            {name}
          </span>
          {time && (
            <span className="text-xs text-muted shrink-0">{time}</span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className="text-sm text-muted truncate">{preview}</p>
          {conversation.unread_count > 0 && (
            <span className="shrink-0 w-5 h-5 bg-accent text-background text-xs font-bold rounded-full flex items-center justify-center">
              {conversation.unread_count > 9 ? "9+" : conversation.unread_count}
            </span>
          )}
        </div>
        {conversation.status === "closed" && (
          <span className="inline-block mt-1 text-xs text-muted-light bg-background-alt px-2 py-0.5 rounded-full">
            Closed
          </span>
        )}
      </div>
    </button>
  );
}
