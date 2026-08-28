/**
 * Messages service — queries and mutations against the messages table.
 */

import { getChatSupabase } from "./supabase";
import type {
  Message,
  MessageRow,
  MessagesPage,
  SendMessageInput,
} from "../types/chat";

const MESSAGE_SELECT = `
  id, conversation_id, sender_id, content, content_type,
  created_at, edited_at, deleted_at, send_state,
  sender:profiles!messages_sender_id_fkey (
    id, full_name, email, avatar_url
  )
`;

/**
 * Fetch a page of messages for a conversation, ordered by created_at DESC
 * (newest first) so we can use limit/offset pagination.
 *
 * The MessagesPage returns messages oldest → newest for rendering.
 */
export async function listMessages(
  conversationId: string,
  opts?: { limit?: number; beforeIso?: string | null }
): Promise<{ data: MessagesPage; error: string | null }> {
  const supabase = getChatSupabase();
  if (!supabase) return { data: { messages: [], hasMore: false }, error: "Chat service unavailable." };

  const limit = Math.min(opts?.limit ?? 30, 100);

  let q = supabase
    .from("messages")
    .select(MESSAGE_SELECT)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit + 1); // fetch one extra to determine hasMore

  if (opts?.beforeIso) {
    q = q.lt("created_at", opts.beforeIso);
  }

  const { data, error } = await q;
  if (error) return { data: { messages: [], hasMore: false }, error: error.message };

  const rows = (data ?? []) as any[];
  const hasMore = rows.length > limit;
  const sliced = rows.slice(0, limit);

  // Reverse to ascending for rendering
  const messages: Message[] = sliced.reverse().map((r) => enrichMessage(r));

  return { data: { messages, hasMore }, error: null };
}

function enrichMessage(r: any): Message {
  return {
    id: r.id,
    conversation_id: r.conversation_id,
    sender_id: r.sender_id,
    content: r.content,
    content_type: r.content_type,
    created_at: r.created_at,
    edited_at: r.edited_at,
    deleted_at: r.deleted_at,
    send_state: r.send_state ?? "sent",
    sender: Array.isArray(r.sender) ? r.sender[0] ?? undefined : r.sender,
  };
}

/**
 * Send a message via RPC. The RPC atomically:
 *   1. Verifies the sender is a participant in the conversation
 *   2. Inserts the message with send_state='sent'
 *   3. Updates conversation.last_message_at + updated_at
 * and returns the inserted row.
 */
export async function sendMessage(
  input: SendMessageInput
): Promise<{ data: Message | null; error: string | null }> {
  const supabase = getChatSupabase();
  if (!supabase) return { data: null, error: "Chat service unavailable." };

  const content = input.content.trim();
  if (!content) return { data: null, error: "Message is empty." };

  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes?.user;
  if (!user) return { data: null, error: "Not authenticated." };

  // Try RPC first (atomic, includes participant check + convo touch)
  const { data: rpcRes, error: rpcErr } = await supabase.rpc("chat_send_message", {
    p_conversation_id: input.conversationId,
    p_sender_id: user.id,
    p_content: content,
    p_content_type: input.contentType ?? "text",
  });

  if (!rpcErr && rpcRes) {
    const row = Array.isArray(rpcRes) ? rpcRes[0] : rpcRes;
    // Enrich with sender info
    const { data: senderProfile } = await supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    return {
      data: {
        ...(row as MessageRow),
        sender: senderProfile ?? undefined,
      },
      error: null,
    };
  }

  // If RPC missing, fall back to direct insert + manual participant check
  if (rpcErr && (rpcErr.code === "42883" || /function.*does not exist/i.test(rpcErr.message))) {
    return sendMessageFallback(input, user.id);
  }

  return { data: null, error: rpcErr?.message ?? "Failed to send message." };
}

async function sendMessageFallback(
  input: SendMessageInput,
  senderId: string
): Promise<{ data: Message | null; error: string | null }> {
  const supabase = getChatSupabase();
  if (!supabase) return { data: null, error: "Chat service unavailable." };

  // Verify participant
  const { data: part, error: pErr } = await supabase
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", input.conversationId)
    .eq("user_id", senderId)
    .maybeSingle();

  if (pErr) return { data: null, error: pErr.message };
  if (!part) return { data: null, error: "You are not a participant in this conversation." };

  const { data: inserted, error: insErr } = await supabase
    .from("messages")
    .insert({
      conversation_id: input.conversationId,
      sender_id: senderId,
      content: input.content.trim(),
      content_type: input.contentType ?? "text",
      send_state: "sent",
    })
    .select(MESSAGE_SELECT)
    .single();

  if (insErr || !inserted) {
    return { data: null, error: insErr?.message ?? "Failed to send message." };
  }

  // Touch conversation
  await supabase
    .from("conversations")
    .update({
      last_message_at: (inserted as any).created_at,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.conversationId);

  return { data: enrichMessage(inserted), error: null };
}

/**
 * Soft-delete a message (only sender can do this).
 */
export async function deleteMessage(
  messageId: string
): Promise<{ error: string | null }> {
  const supabase = getChatSupabase();
  if (!supabase) return { error: "Chat service unavailable." };

  const { error } = await supabase
    .from("messages")
    .update({
      deleted_at: new Date().toISOString(),
      content: "",
    })
    .eq("id", messageId);

  if (error) return { error: error.message };
  return { error: null };
}
