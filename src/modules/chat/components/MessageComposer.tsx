/**
 * MessageComposer — text input with Enter-to-send, Shift+Enter for newlines.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface MessageComposerProps {
  onSend: (content: string) => Promise<{ data: any | null; error: string | null }>;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageComposer({
  onSend,
  disabled = false,
  placeholder = "Type a message…",
}: MessageComposerProps) {
  const [value, setValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, [value]);

  const handleSend = useCallback(async () => {
    const trimmed = value.trim();
    if (!trimmed || isSending || disabled) return;

    setValue("");
    setLocalError(null);
    setIsSending(true);

    const result = await onSend(trimmed);

    if (result.error) {
      setLocalError(result.error);
      // Restore the message so the user can retry
      setValue(trimmed);
    }

    setIsSending(false);
    textareaRef.current?.focus();
  }, [value, isSending, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="shrink-0 border-t border-border p-3 bg-background">
      {localError && (
        <div className="mb-2 text-xs text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
          {localError}
        </div>
      )}
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isSending}
          rows={1}
          className="
            flex-1 resize-none rounded-xl
            border border-border
            bg-background-alt text-foreground
            px-4 py-2.5 text-sm
            placeholder:text-muted
            focus:outline-none focus:ring-2 focus:ring-accent/40
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          "
        />
        <button
          onClick={handleSend}
          disabled={disabled || isSending || !value.trim()}
          className="
            w-10 h-10 shrink-0
            rounded-xl bg-accent hover:bg-accent-hover
            text-background
            flex items-center justify-center
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-colors
            focus:outline-none focus:ring-2 focus:ring-accent/40
          "
          aria-label="Send message"
        >
          {isSending ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h12.75" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
