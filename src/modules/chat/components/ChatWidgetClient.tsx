/**
 * ChatWidgetClient — client wrapper that renders the floating chat FAB + window.
 *
 * Mounted as a child of the root layout so the button appears on every page.
 * Wraps ChatButton + ChatWindow in ChatWidgetProvider for state management.
 */

"use client";

import { ChatWidgetProvider, ChatButton } from "./ChatWidget";
import { ChatWindow } from "./ChatWindow";
import { useConversations } from "@/modules/chat/hooks/useConversations";

export function ChatWidgetClient() {
  return (
    <ChatWidgetProvider>
      <ChatInner />
    </ChatWidgetProvider>
  );
}

function ChatInner() {
  const { totalUnread } = useConversations({ refreshMs: 30000 });

  return (
    <>
      <ChatButton />
      <ChatWindow />
      <input
        type="hidden"
        value={totalUnread}
        readOnly
        aria-hidden="true"
      />
    </>
  );
}
