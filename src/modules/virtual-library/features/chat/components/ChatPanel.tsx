/**
 * ChatPanel — collapsible chat sidebar within rooms.
 *
 * Shows an auth prompt when the user is not signed in.
 * Displays messages with real user names from Supabase profiles.
 */

"use client";

import { useState, useEffect, useRef } from "react";
import type { ChatMessage } from "../../../types/index";
import { ChatMessage as ChatMessageBubble } from "./ChatMessage";
import { getChatSupabase } from "@/modules/chat/services/supabase";

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => Promise<void>;
  compact?: boolean;
  currentUserId?: string;
  requireAuth?: boolean;
}

export function ChatPanel({
  messages,
  onSendMessage,
  compact,
  currentUserId,
  requireAuth = true,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check auth state
  useEffect(() => {
    const check = async () => {
      const supabase = getChatSupabase();
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        setAuthenticated(!!user);
      }
    };
    check();
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;
    const text = input.trim();
    setInput("");
    setIsSending(true);
    try {
      await onSendMessage(text);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auth required gate
  if (requireAuth && !authenticated) {
    return (
      <div className={`bg-card border border-border rounded-2xl flex flex-col overflow-hidden ${
        compact ? "h-[500px]" : "h-[500px] sm:h-[600px]"
      }`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-sm">Chat</h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="text-3xl mb-3">🔒</div>
          <p className="text-sm text-muted mb-1">Sign in to join the conversation</p>
          <p className="text-xs text-muted">
            Chat is available for registered users only.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-card border border-border rounded-2xl flex flex-col overflow-hidden ${
      compact ? "h-[500px]" : "h-[500px] sm:h-[600px]"
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-semibold text-sm">Chat</h3>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-muted hover:text-foreground transition-colors p-1"
        >
          {isCollapsed ? "▲" : "▼"}
        </button>
      </div>

      {/* Messages */}
      {!isCollapsed && (
        <>
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
            {messages.length === 0 && (
              <div className="text-center py-8 text-muted text-sm">
                No messages yet. Start the conversation!
              </div>
            )}

            {messages.map((msg) => (
              <ChatMessageBubble
                key={msg.id}
                message={msg}
                currentUserId={currentUserId}
              />
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-2 border-t border-border">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                disabled={isSending}
                className="flex-1 px-3 py-2 bg-accent/50 border border-border rounded-lg text-sm
                  placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-foreground/30
                  disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isSending}
                className="px-4 py-2 bg-foreground text-background rounded-lg text-sm font-medium
                  hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
