/**
 * MessageList — scrollable list of messages with day separators.
 */

"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { type Message, formatClockTime, formatDayLabel } from "../../utils/format";

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadOlder: () => Promise<void>;
  currentUserId?: string;
}

export function MessageList({
  messages,
  isLoading,
  hasMore,
  onLoadOlder,
  currentUserId,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive (but only if we're already near the bottom)
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const wasNearBottom = useRef(true);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 120;
    wasNearBottom.current = isNearBottom;

    if (isNearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  // Initial scroll to bottom
  useEffect(() => {
    if (messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "auto" });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Infinite scroll sentinel — load more when scrolling to top
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          onLoadOlder();
        }
      },
      { root: scrollContainerRef.current, threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadOlder]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <p className="text-sm text-muted">Start a conversation — send a message below.</p>
      </div>
    );
  }

  // Group messages by day
  const groups: { day: string; messages: Message[] }[] = [];
  let currentDay: string | null = null;
  for (const m of messages) {
    const day = formatDayLabel(m.created_at);
    if (day !== currentDay) {
      currentDay = day;
      groups.push({ day, messages: [m] });
    } else {
      groups[groups.length - 1].messages.push(m);
    }
  }

  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto px-4 py-3 space-y-1"
    >
      {/* Load more sentinel */}
      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-2">
          {isLoading && (
            <div className="text-xs text-muted animate-pulse">Loading older messages…</div>
          )}
        </div>
      )}

      {groups.map((group) => (
        <div key={group.day}>
          {/* Day separator */}
          <div className="flex justify-center my-4">
            <span className="text-xs text-muted bg-background-alt px-3 py-1 rounded-full">
              {group.day}
            </span>
          </div>

          {/* Messages for this day */}
          {group.messages.map((msg) => {
            const isSelf = msg.sender_id === currentUserId;
            const isSystem = msg.content_type === "system";
            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center my-2">
                  <span className="text-xs text-muted-light italic bg-background-alt px-3 py-1 rounded-full">
                    {msg.content}
                  </span>
                </div>
              );
            }

            return (
              <MessageBubble
                key={msg.id}
                message={msg}
                isSelf={isSelf}
                senderName={
                  msg.sender?.full_name
                    ? msg.sender.full_name
                    : msg.sender?.email?.split("@")[0] ?? "User"
                }
              />
            );
          })}
        </div>
      ))}

      <div ref={bottomRef} />
    </div>
  );
}
