/**
 * ChatWindow — the main chat panel that slides up from the FAB.
 * Shows the conversation list when no conversation is selected, and the
 * conversation view when one is selected.
 */

"use client";

import { useCallback, useState } from "react";
import { ChatHeader } from "./ChatHeader";
import { ConversationList } from "./ConversationList";
import { useChatWidget } from "./ChatWidget";
import { useConversations, openConversation } from "../hooks/useConversations";
import { createConversation } from "../services/conversations";
import { getChatSupabase } from "../services/supabase";
import { ConversationView } from "./ConversationView";

export function ChatWindow() {
  const { isOpen, closeChat } = useChatWidget();
  const { conversations, isLoading, error, refresh } = useConversations();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = useCallback(
    async (convId: string) => {
      setSelectedId(convId);
      const result = await openConversation(convId);
      if (result.error) {
        console.error("Failed to open conversation:", result.error);
      }
      refresh();
    },
    [refresh]
  );

  const handleNewConversation = useCallback(async () => {
    const supabase = getChatSupabase();
    if (!supabase) return;

    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes?.user;
    if (!user) return;

    const { data, error } = await createConversation({});
    if (error || !data) {
      console.error("Failed to create conversation:", error);
      alert(error || "Could not create conversation.");
      return;
    }

    setSelectedId(data.id);
    refresh();
  }, [refresh]);

  const handleBack = useCallback(() => {
    setSelectedId(null);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-fade-in"
        onClick={closeChat}
      />

      {/* Panel */}
      <div
        className={`
          relative w-full max-w-md h-full bg-background border-l border-border shadow-2xl
          flex flex-col animate-slide-in
        `}
      >
        <ChatHeader
          title={selectedId ? "Chat" : "Messages"}
          onClose={closeChat}
          showBack={!!selectedId}
          onBack={handleBack}
        />

        {selectedId ? (
          <ConversationView conversationId={selectedId} />
        ) : (
          <>
            {/* New conversation button */}
            <div className="p-3 border-b border-border shrink-0">
              <button
                onClick={handleNewConversation}
                className="w-full py-2.5 px-4 bg-accent hover:bg-accent-hover text-background text-sm font-medium rounded-lg transition-colors"
              >
                New Conversation
              </button>
            </div>

            {error && (
              <div className="m-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <LoadingSkeleton />
              ) : conversations.length === 0 ? (
                <EmptyState />
              ) : (
                <ConversationList
                  conversations={conversations}
                  onSelect={handleSelect}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="p-3 space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse h-14 bg-background-alt rounded-lg"
          style={{ animationDelay: `${i * 60}ms` }}
        />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 rounded-full bg-background-alt flex items-center justify-center mb-3">
        <svg className="w-6 h-6 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5 21.73V12a9 9 0 0 1 9-9h.25" />
        </svg>
      </div>
      <p className="text-sm text-muted mb-1">No messages yet</p>
      <p className="text-xs text-muted-light">
        Start a conversation to get support.
      </p>
    </div>
  );
}
