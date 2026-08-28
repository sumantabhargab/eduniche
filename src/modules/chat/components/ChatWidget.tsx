/**
 * ChatWidget — the floating FAB (Floating Action Button) + global badge.
 *
 * Placed in the root layout so it's visible on every authenticated page.
 * Uses a portal/context approach to overlay the chat panel on top of content.
 */

"use client";

import { type ReactNode, createContext, useContext, useState } from "react";

interface ChatWidgetContext {
  isOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  unreadCount: number;
  setUnreadCount: (count: number) => void;
}

const ChatWidgetContext = createContext<ChatWidgetContext>({
  isOpen: false,
  openChat: () => {},
  closeChat: () => {},
  toggleChat: () => {},
  unreadCount: 0,
  setUnreadCount: () => {},
});

export function useChatWidget() {
  return useContext(ChatWidgetContext);
}

interface ChatWidgetProviderProps {
  children: ReactNode;
  /** Unread count driven by parent (e.g. from useConversations hook). */
  unreadCount?: number;
}

export function ChatWidgetProvider({ children, unreadCount = 0 }: ChatWidgetProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [unread, setUnread] = useState(unreadCount);

  // Sync unread count from parent
  if (unreadCount !== unread && unreadCount >= 0) {
    setUnread(unreadCount);
  }

  const openChat = () => { setIsOpen(true); setUnread(0); };
  const closeChat = () => setIsOpen(false);
  const toggleChat = () => setIsOpen((v) => !v);

  return (
    <ChatWidgetContext.Provider
      value={{
        isOpen,
        openChat,
        closeChat,
        toggleChat,
        unreadCount: unread,
        setUnreadCount: setUnread,
      }}
    >
      {children}
    </ChatWidgetContext.Provider>
  );
}

/**
 * ChatButton — the floating button that appears on every page.
 */
export function ChatButton() {
  const { isOpen, toggleChat, unreadCount } = useChatWidget();

  return (
    <button
      onClick={toggleChat}
      className={`
        fixed bottom-6 right-6 z-50
        w-14 h-14 rounded-full
        bg-accent hover:bg-accent-hover
        text-background shadow-lg
        flex items-center justify-center
        transition-all duration-300 ease-out
        focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2
        ${isOpen ? "rotate-0 scale-100" : "hover:scale-110"}
      `}
      aria-label={isOpen ? "Close chat" : "Open chat"}
      title="Chat with support"
    >
      {isOpen ? (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      ) : (
        <>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5 21.73V12a9 9 0 0 1 9-9h.25" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent-hover text-background text-xs font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </>
      )}
    </button>
  );
}
