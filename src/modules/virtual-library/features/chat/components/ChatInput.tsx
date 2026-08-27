/**
 * ChatInput — minimal message input.
 *
 * Used within the ChatPanel; standalone export for flexibility.
 */

"use client";

import { useState } from "react";

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled, placeholder = "Type a message..." }: ChatInputProps) {
  const [value, setValue] = useState("");

  const handleSend = () => {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 px-3 py-2 bg-accent/50 border border-border rounded-lg text-sm
          placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-foreground/30
          disabled:opacity-50"
      />
      <button
        onClick={handleSend}
        disabled={!value.trim() || disabled}
        className="px-4 py-2 bg-foreground text-background rounded-lg text-sm font-medium
          hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        Send
      </button>
    </div>
  );
}
