/**
 * ChatWidgetClient — client wrapper that conditionally renders the floating chat FAB.
 *
 * IMPORTANT: This is the OLD chat system (conversations/messages tables) which is NOT
 * part of the MVP. The actual global chat is at /chat using the new chat_messages table.
 *
 * This widget is hidden for now to avoid errors from the missing conversations table.
 * Re-enable when the old chat system tables are created and the widget is updated.
 */

"use client";

import { useAuth } from "@/lib/hooks/useAuth";

export function ChatWidgetClient() {
  const { user, loading } = useAuth();

  // OLD chat system disabled for MVP — old tables don't exist in remote DB.
  // The global chat lives at /chat using the new chat_messages table.
  if (!user || loading) return null;

  return null;
}
