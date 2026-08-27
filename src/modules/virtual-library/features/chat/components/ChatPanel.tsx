/**
 * ChatPanel — collapsible chat sidebar within rooms.
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { ChatMessage } from "../../../types/index";
import { ChatMessage as ChatMessageBubble } from "./ChatMessage";

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => Promise<void>;
  compact?: boolean;
}

export function ChatPanel({ messages, onSendMessage, compact }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
              <ChatMessageBubble key={msg.id} message={msg} />
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
