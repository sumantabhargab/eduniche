/**
 * Realtime subscription management for the Chat module.
 *
 * Uses Supabase Realtime channels to listen for:
 *   - INSERT on messages → new messages in a conversation
 *   - UPDATE on conversation_participants → read-state changes
 *   - UPDATE on conversations → status changes
 *
 * Subscriptions are scoped to a specific conversation so we don't waste
 * bandwidth. The caller is responsible for cleanup by calling the
 * unsubscribe function.
 */

import { getChatSupabase } from "./supabase";

type MessageHandler = (message: any) => void;

let activeChannels: any[] = [];

/**
 * Subscribe to new messages in a conversation.
 *
 * The handler receives the raw Supabase record as `NewRecord`.
 */
export function subscribeToMessages(
  conversationId: string,
  onMessage: MessageHandler
): () => void {
  const supabase = getChatSupabase();
  if (!supabase) return () => {};

  const channelName = `chat:messages:${conversationId}`;

  // Clean up any existing subscription on this conversation
  if (activeChannels.find((c: any) => c.channelName === channelName)) {
    activeChannels.find((c: any) => c.channelName === channelName)!.unsubscribe();
  }

  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        const record = payload.new as any;
        onMessage({
          id: record.id,
          conversation_id: record.conversation_id,
          sender_id: record.sender_id,
          content: record.content,
          content_type: record.content_type,
          created_at: record.created_at,
          edited_at: record.edited_at,
          deleted_at: record.deleted_at,
          send_state: record.send_state,
        });
      }
    )
    .subscribe((status) => {
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        // Supabase Realtime will attempt to reconnect automatically.
        // No manual re-subscribe needed — the library handles it.
        console.warn(`[chat] Realtime channel ${channelName} status: ${status}`);
      }
    });

  activeChannels.push({ channelName, unsubscribe: () => channel.unsubscribe() });

  return () => {
    channel.unsubscribe();
    activeChannels = activeChannels.filter((c: any) => c.channelName !== channelName);
  };
}

/**
 * Subscribe to read-state changes for a conversation.
 * Used to update the unread indicator when the other party reads our messages.
 */
export function subscribeToReads(
  conversationId: string,
  onRead: MessageHandler
): () => void {
  const supabase = getChatSupabase();
  if (!supabase) return () => {};

  const channelName = `chat:reads:${conversationId}`;

  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "conversation_participants",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        const record = payload.new as any;
        if (record.last_read_at) {
          onRead({
            id: record.id,
            conversation_id: record.conversation_id,
            user_id: record.user_id,
            last_read_at: record.last_read_at,
          });
        }
      }
    )
    .subscribe((status) => {
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        console.warn(`[chat] Read channel ${channelName} status: ${status}`);
      }
    });

  const entry = { channelName, unsubscribe: () => channel.unsubscribe() };
  activeChannels.push(entry);

  return () => {
    channel.unsubscribe();
    activeChannels = activeChannels.filter((c: any) => c.channelName !== channelName);
  };
}

/**
 * Subscribe to conversation status changes.
 */
export function subscribeToConversationUpdates(
  conversationId: string,
  onUpdate: (conversation: any) => void
): () => void {
  const supabase = getChatSupabase();
  if (!supabase) return () => {};

  const channelName = `chat:conv:${conversationId}`;

  if (activeChannels.find((c: any) => c.channelName === channelName)) {
    activeChannels.find((c: any) => c.channelName === channelName)!.unsubscribe();
  }

  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "conversations",
        filter: `id=eq.${conversationId}`,
      },
      (payload) => {
        onUpdate(payload.new);
      }
    )
    .subscribe((status) => {
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        console.warn(`[chat] Conv channel ${channelName} status: ${status}`);
      }
    });

  activeChannels.push({ channelName, unsubscribe: () => channel.unsubscribe() });

  return () => {
    channel.unsubscribe();
    activeChannels = activeChannels.filter((c: any) => c.channelName !== channelName);
  };
}

/**
 * Clean up all active channels (e.g., on logout / page unload).
 */
export function cleanupAllRealtime() {
  for (const c of activeChannels) {
    c.unsubscribe();
  }
  activeChannels = [];
}
