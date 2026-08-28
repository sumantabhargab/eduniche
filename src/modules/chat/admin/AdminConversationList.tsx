/**
 * AdminConversationList — renders the list of conversation items for the admin sidebar.
 */

"use client";

import { type Conversation } from "../types/chat";
import { ConversationItem } from "../components/ConversationItem";
import { formatRelativeTime, truncate } from "../utils/format";

interface AdminConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function AdminConversationList({
  conversations,
  selectedId,
  onSelect,
}: AdminConversationListProps) {
  return (
    <>
      {conversations.map((conv) => (
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
                {conv.other_participant?.full_name ?? conv.other_participant?.email ?? "Unknown"}
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
                  : conv.last_message?.content
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
