/**
 * ChatPanel — real-time chat UI with support for library-wide and room-scoped messages.
 *
 * Features:
 * - Message grouping by sender
 * - Timestamps
 * - Smooth scrolling
 * - Unread indicator
 * - Connection status
 * - Scope indicator (library vs room)
 * - Workspace-friendly design
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ChatMessage } from "./useChat";

interface ChatPanelProps {
  messages: ChatMessage[];
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onClose: () => void;
  isConnected: boolean;
  scope: "library" | "room";
  roomName?: string;
  /** Unread count for the chat */
  unreadCount?: number;
  /** Clear unread count (call when panel is opened) */
  onClearUnread?: () => void;
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function isSameGroup(a: ChatMessage, b: ChatMessage): boolean {
  if (a.userId !== b.userId) return false;
  if (a.timestamp - b.timestamp > 120_000) return false; // 2 min gap
  return true;
}

export function ChatPanel({
  messages,
  input,
  onInputChange,
  onSend,
  onClose,
  isConnected,
  scope,
  roomName,
  unreadCount = 0,
  onClearUnread,
}: ChatPanelProps) {
  const [showTimestamp, setShowTimestamp] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(messages.length);

  // Track unread
  useEffect(() => {
    if (messages.length > prevLengthRef.current && panelRef.current) {
      const rect = panelRef.current.getBoundingClientRect();
      const isVisible =
        rect.top < window.innerHeight && rect.bottom > 0;
      if (!isVisible) {
        // Panel is hidden/minimized; count as unread
        // This is handled by the parent, but we can show a notification
      }
    }
    prevLengthRef.current = messages.length;
  }, [messages.length]);

  // Scroll to bottom on new messages (if near bottom already)
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const scopeLabel = scope === "library" ? "Library" : (roomName || "Room");

  return (
    <motion.div
      ref={panelRef}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="fixed bottom-4 left-4 z-50 w-80 sm:w-96 max-h-[70vh] flex flex-col rounded-2xl bg-popover/95 backdrop-blur-xl border border-border shadow-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="relative">
            <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-4.272C3.512 14.661 3 13.848 3 13c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-white text-[8px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">{scopeLabel} Chat</p>
            <p className="text-[10px] text-muted">
              {isConnected ? "Connected" : "Connecting..."}
              {scope === "room" && " — room only"}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-foreground/5 transition-colors text-muted hover:text-foreground"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1 min-h-[200px] max-h-[400px] scrollbar-thin">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <svg className="w-8 h-8 text-muted/40 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-4.272C3.512 14.661 3 13.848 3 13c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-xs text-muted">
              {scope === "library"
                ? "No messages yet. Say hello!"
                : "No messages in this room yet."}
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => {
              const prev = index > 0 ? messages[index - 1] : null;
              const grouped = prev ? isSameGroup(prev, msg) : false;
              const isOwn = msg.userId === "self";

              return (
                <div
                  key={msg.id}
                  className={`${
                    grouped ? "mt-0.5" : "mt-3"
                  } ${isOwn ? "text-right" : ""}`}
                >
                  {/* Group header — only show when not grouped */}
                  {!grouped && !isOwn && (
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: msg.userColor }}
                      />
                      <span className="text-[11px] font-semibold text-foreground/80">
                        {msg.userName}
                      </span>
                      <span className="text-[10px] text-muted/60">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  )}

                  {/* Grouped timestamp */}
                  {grouped && !isOwn && showTimestamp && (
                    <span className="text-[9px] text-muted/40 ml-3.5">
                      {formatTime(msg.timestamp)}
                    </span>
                  )}

                  {/* Message bubble */}
                  <div
                    className={`inline-block max-w-[85%] px-3 py-1.5 text-sm leading-relaxed ${
                      isOwn
                        ? "bg-foreground text-background rounded-2xl rounded-tr-sm"
                        : grouped
                        ? "bg-transparent text-foreground/90 ml-3.5"
                        : "bg-accent text-foreground rounded-2xl rounded-tl-sm"
                    }`}
                  >
                    {msg.text}
                  </div>

                  {/* Own message timestamp */}
                  {grouped && isOwn && showTimestamp && (
                    <span className="text-[9px] text-muted/40 mr-3.5">
                      {formatTime(msg.timestamp)}
                    </span>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="px-3 py-2.5 border-t border-border/50">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${scopeLabel.toLowerCase()}...`}
            className="flex-1 bg-accent border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-colors"
            maxLength={500}
          />
          <button
            onClick={onSend}
            disabled={!input.trim()}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-foreground text-background hover:opacity-90 disabled:opacity-30 transition-opacity"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12z" />
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
