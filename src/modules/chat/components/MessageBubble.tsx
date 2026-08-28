/**
 * MessageBubble — a single message rendered in the list.
 */

"use client";

import { type Message } from "../types/chat";
import { formatClockTime } from "../utils/format";

interface MessageBubbleProps {
  message: Message;
  isSelf: boolean;
  senderName: string;
}

export function MessageBubble({ message, isSelf, senderName }: MessageBubbleProps) {
  if (message.deleted_at) {
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs text-muted-light italic">Message deleted</span>
      </div>
    );
  }

  return (
    <div className={`flex ${isSelf ? "justify-end" : "justify-start"} mb-1`}>
      <div
        className={`
          max-w-[75%] rounded-2xl px-4 py-2
          ${
            isSelf
              ? "bg-accent text-background rounded-br-sm"
              : "bg-background-alt text-foreground rounded-bl-sm"
          }
        `}
      >
        {/* Sender name for group messages (not self) */}
        {!isSelf && (
          <p className="text-xs font-medium text-accent mb-1">{senderName}</p>
        )}
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
          {message.content}
        </p>
        <div
          className={`
            flex items-center gap-1 mt-1
            ${isSelf ? "justify-end" : "justify-start"}
          `}
        >
          <span
            className={`
              text-[10px]
              ${isSelf ? "text-background/60" : "text-muted"}
            `}
          >
            {formatClockTime(message.created_at)}
          </span>
          {isSelf && message.send_state === "failed" && (
            <span className="text-[10px] text-red-400">Failed</span>
          )}
        </div>
      </div>
    </div>
  );
}
