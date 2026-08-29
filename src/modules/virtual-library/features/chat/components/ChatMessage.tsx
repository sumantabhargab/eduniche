/**
 * ChatMessage — individual message bubble.
 */

import type { ChatMessage } from "../../../types/index";

interface ChatMessageProps {
  message: ChatMessage;
  currentUserId?: string;
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function ChatMessage({ message, currentUserId }: ChatMessageProps) {
  if (message.type === "system") {
    return (
      <div className="text-center py-1.5">
        <span className="text-xs text-muted bg-accent/50 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  const isCurrentUser = currentUserId ? message.authorId === currentUserId : false;

  return (
    <div className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] px-3 py-2 rounded-2xl ${
          isCurrentUser
            ? "bg-foreground text-background rounded-br-md"
            : "bg-accent text-foreground rounded-bl-md"
        }`}
      >
        {/* Author name */}
        {!isCurrentUser && (
          <p className="text-xs font-medium opacity-70 mb-0.5">
            {message.authorLabel}
          </p>
        )}

        {/* Content */}
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
          {message.content}
        </p>

        {/* Timestamp */}
        <p
          className={`text-xs mt-1 ${
            isCurrentUser ? "text-background/60" : "text-muted"
          }`}
        >
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
}
