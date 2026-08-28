/**
 * Conversation service — all CRUD and queries against the conversations table.
 *
 * Designed to be safe under RLS: every query uses the per-user browser client,
 * so Supabase enforces row-level security server-side.
 */

import { getChatSupabase } from "./supabase";
import type {
  Conversation,
  ConversationRow,
  ConversationParticipantRow,
  ConversationStatus,
  CreateConversationInput,
  MessageRow,
  ParticipantInfo,
  UpdateConversationInput,
  CurrentUser,
  UnreadSummary,
} from "../types/chat";

const CONVERSATION_SELECT = `
  id, status, created_at, updated_at, last_message_at, created_by, subject,
  last_message:messages!messages_conversation_id_fkey (
    id, conversation_id, sender_id, content, content_type,
    created_at, edited_at, deleted_at, send_state
  ),
  participants:conversation_participants!conversation_participants_conversation_id_fkey (
    id, conversation_id, user_id, joined_at, last_read_at,
    profile:profiles!conversation_participants_user_id_fkey (
      id, full_name, email, avatar_url
    )
  )
`;

/**
 * Fetch conversations the current user participates in.
 * Returns enriched Conversation objects with last_message + unread_count.
 */
export async function listMyConversations(opts?: {
  status?: ConversationStatus;
  limit?: number;
}): Promise<{ data: Conversation[]; error: string | null }> {
  const supabase = getChatSupabase();
  if (!supabase) return { data: [], error: "Chat service unavailable." };

  // Fetch current user
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes?.user;
  if (!user) return { data: [], error: "Not authenticated." };

  // Fetch participant rows for current user → conversation IDs
  let q = supabase
    .from("conversation_participants")
    .select("conversation_id, last_read_at")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false });

  if (opts?.limit) q = q.limit(opts.limit);

  const { data: parts, error: pErr } = await q;
  if (pErr) return { data: [], error: pErr.message };
  if (!parts || parts.length === 0) return { data: [], error: null };

  const conversationIds = parts.map((p) => p.conversation_id);
  const lastReadById = new Map(
    parts.map((p) => [p.conversation_id, p.last_read_at] as const)
  );

  // Fetch conversations + their messages + all participants
  const { data: convs, error: cErr } = await supabase
    .from("conversations")
    .select(CONVERSATION_SELECT)
    .in("id", conversationIds)
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (cErr) return { data: [], error: cErr.message };
  if (!convs) return { data: [], error: null };

  const result: Conversation[] = convs
    .filter((c: any) => !opts?.status || c.status === opts.status)
    .map((c: any): Conversation => {
      const otherParticipant = (c.participants ?? []).find(
        (p: any) => p.user_id !== user.id
      );
      const lastMessage: MessageRow | undefined = Array.isArray(c.last_message)
        ? c.last_message[c.last_message.length - 1]
        : c.last_message;
      const lastRead = lastReadById.get(c.id);
      const unreadCount =
        lastMessage && lastMessage.sender_id !== user.id && (!lastRead || lastMessage.created_at > lastRead)
          ? countUnread((c.last_message ?? []) as MessageRow[], user.id, lastRead)
          : 0;

      return {
        id: c.id,
        status: c.status,
        created_at: c.created_at,
        updated_at: c.updated_at,
        last_message_at: c.last_message_at,
        created_by: c.created_by,
        subject: c.subject,
        other_participant: otherParticipant
          ? {
              id: otherParticipant.profile?.id ?? otherParticipant.user_id,
              full_name: otherParticipant.profile?.full_name ?? null,
              email: otherParticipant.profile?.email ?? "",
              avatar_url: otherParticipant.profile?.avatar_url ?? null,
            }
          : undefined,
        last_message: lastMessage,
        unread_count: unreadCount,
        participant_count: (c.participants ?? []).length,
      };
    });

  return { data: result, error: null };
}

function countUnread(
  messages: MessageRow[],
  currentUserId: string,
  lastReadIso: string | null
): number {
  let count = 0;
  for (const m of messages) {
    if (m.sender_id === currentUserId) continue;
    if (m.deleted_at) continue;
    if (!lastReadIso || m.created_at > lastReadIso) count++;
  }
  return count;
}

/**
 * Fetch the single conversation the current user has with the admin/support
 * (or any given user). Returns null if it doesn't exist.
 */
export async function findConversationWith(
  otherUserId: string
): Promise<{ data: Conversation | null; error: string | null }> {
  const supabase = getChatSupabase();
  if (!supabase) return { data: null, error: "Chat service unavailable." };

  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes?.user;
  if (!user) return { data: null, error: "Not authenticated." };

  // Find conversations where current user participates
  const { data: myParts, error: myErr } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", user.id);

  if (myErr) return { data: null, error: myErr.message };
  if (!myParts || myParts.length === 0) return { data: null, error: null };

  const myConvIds = myParts.map((p) => p.conversation_id);

  // Of those, find which include the other user
  const { data: theirParts, error: theirErr } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", otherUserId)
    .in("conversation_id", myConvIds);

  if (theirErr) return { data: null, error: theirErr.message };
  if (!theirParts || theirParts.length === 0) return { data: null, error: null };

  // Pick the most recent
  const { data: conv, error: cErr } = await supabase
    .from("conversations")
    .select(CONVERSATION_SELECT)
    .in("id", theirParts.map((p) => p.conversation_id))
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (cErr) return { data: null, error: cErr.message };
  if (!conv) return { data: null, error: null };

  const c = conv as any;
  const lastRead = (myParts.find((mp) => mp.conversation_id === c.id) as any)?.last_read_at ?? null;
  const otherParticipant = (c.participants ?? []).find(
    (p: any) => p.user_id !== user.id
  );
  const lastMessage: MessageRow | undefined = Array.isArray(c.last_message)
    ? c.last_message[c.last_message.length - 1]
    : c.last_message;
  const unreadCount =
    lastMessage && lastMessage.sender_id !== user.id && (!lastRead || lastMessage.created_at > lastRead)
      ? countUnread((c.last_message ?? []) as MessageRow[], user.id, lastRead)
      : 0;

  const enriched: Conversation = {
    id: c.id,
    status: c.status,
    created_at: c.created_at,
    updated_at: c.updated_at,
    last_message_at: c.last_message_at,
    created_by: c.created_by,
    subject: c.subject,
    other_participant: otherParticipant
      ? {
          id: otherParticipant.profile?.id ?? otherParticipant.user_id,
          full_name: otherParticipant.profile?.full_name ?? null,
          email: otherParticipant.profile?.email ?? "",
          avatar_url: otherParticipant.profile?.avatar_url ?? null,
        }
      : undefined,
    last_message: lastMessage,
    unread_count: unreadCount,
    participant_count: (c.participants ?? []).length,
  };

  return { data: enriched, error: null };
}

/**
 * Create a new conversation. The current user becomes a participant; if the
 * other user is given, they're added too.
 *
 * Uses an RPC function for atomicity under RLS (create + participants insert
 * must succeed together). Falls back to a manual flow if the RPC isn't
 * installed yet — surfaces a clear error in that case.
 */
export async function createConversation(
  input: CreateConversationInput
): Promise<{ data: Conversation | null; error: string | null }> {
  const supabase = getChatSupabase();
  if (!supabase) return { data: null, error: "Chat service unavailable." };

  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes?.user;
  if (!user) return { data: null, error: "Not authenticated." };

  // Try RPC first
  const { data: rpcRes, error: rpcErr } = await supabase.rpc(
    "chat_create_conversation",
    {
      p_subject: input.subject ?? null,
      p_initiator_id: user.id,
    }
  );

  if (rpcErr) {
    // If function missing, fall back to manual flow
    if (rpcErr.code === "42883" || /function.*does not exist/i.test(rpcErr.message)) {
      return createConversationFallback(input, user.id);
    }
    return { data: null, error: rpcErr.message };
  }

  if (!rpcRes) return { data: null, error: "Failed to create conversation." };
  return findConversationById(rpcRes as string);
}

/**
 * Fallback path: insert conversation + current user as participant.
 * Admin support will be assigned on first reply.
 */
async function createConversationFallback(
  input: CreateConversationInput,
  userId: string
): Promise<{ data: Conversation | null; error: string | null }> {
  const supabase = getChatSupabase();
  if (!supabase) return { data: null, error: "Chat service unavailable." };

  const { data: conv, error: cErr } = await supabase
    .from("conversations")
    .insert({
      created_by: userId,
      status: "open",
      subject: input.subject ?? null,
    })
    .select("id")
    .single();

  if (cErr || !conv) return { data: null, error: cErr?.message ?? "Insert failed." };

  const { error: pErr } = await supabase
    .from("conversation_participants")
    .insert({
      conversation_id: conv.id,
      user_id: userId,
    });

  if (pErr) {
    // Rollback conversation if participant insert fails
    await supabase.from("conversations").delete().eq("id", conv.id);
    return { data: null, error: pErr.message };
  }

  return findConversationById(conv.id);
}

export async function findConversationById(
  id: string
): Promise<{ data: Conversation | null; error: string | null }> {
  const supabase = getChatSupabase();
  if (!supabase) return { data: null, error: "Chat service unavailable." };

  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes?.user;
  if (!user) return { data: null, error: "Not authenticated." };

  const { data, error } = await supabase
    .from("conversations")
    .select(CONVERSATION_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: null };

  const c = data as any;
  const { data: myPart } = await supabase
    .from("conversation_participants")
    .select("last_read_at")
    .eq("conversation_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  const lastRead = (myPart as any)?.last_read_at ?? null;
  const otherParticipant = (c.participants ?? []).find(
    (p: any) => p.user_id !== user.id
  );
  const lastMessage: MessageRow | undefined = Array.isArray(c.last_message)
    ? c.last_message[c.last_message.length - 1]
    : c.last_message;
  const unreadCount =
    lastMessage && lastMessage.sender_id !== user.id && (!lastRead || lastMessage.created_at > lastRead)
      ? countUnread((c.last_message ?? []) as MessageRow[], user.id, lastRead)
      : 0;

  return {
    data: {
      id: c.id,
      status: c.status,
      created_at: c.created_at,
      updated_at: c.updated_at,
      last_message_at: c.last_message_at,
      created_by: c.created_by,
      subject: c.subject,
      other_participant: otherParticipant
        ? {
            id: otherParticipant.profile?.id ?? otherParticipant.user_id,
            full_name: otherParticipant.profile?.full_name ?? null,
            email: otherParticipant.profile?.email ?? "",
            avatar_url: otherParticipant.profile?.avatar_url ?? null,
          }
        : undefined,
      last_message: lastMessage,
      unread_count: unreadCount,
      participant_count: (c.participants ?? []).length,
    },
    error: null,
  };
}

/**
 * Update conversation (admin-only update). Status / subject.
 */
export async function updateConversation(
  id: string,
  patch: UpdateConversationInput
): Promise<{ data: Conversation | null; error: string | null }> {
  const supabase = getChatSupabase();
  if (!supabase) return { data: null, error: "Chat service unavailable." };

  const { error } = await supabase
    .from("conversations")
    .update({
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.subject !== undefined ? { subject: patch.subject } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { data: null, error: error.message };
  return findConversationById(id);
}

/**
 * Mark all messages in a conversation as read for the current user.
 * Updates conversation_participants.last_read_at.
 */
export async function markConversationRead(
  conversationId: string
): Promise<{ error: string | null }> {
  const supabase = getChatSupabase();
  if (!supabase) return { error: "Chat service unavailable." };

  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes?.user;
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("conversation_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return { error: null };
}

/**
 * Compute total unread message count for the current user across all conversations.
 */
export async function getUnreadSummary(): Promise<UnreadSummary> {
  const { data: convs, error } = await listMyConversations();
  if (error || !convs) return { totalUnread: 0, conversationUnreads: [] };

  let total = 0;
  const conversationUnreads: { conversationId: string; unreadCount: number }[] = [];
  for (const c of convs) {
    if (c.unread_count > 0) {
      total += c.unread_count;
      conversationUnreads.push({
        conversationId: c.id,
        unreadCount: c.unread_count,
      });
    }
  }
  return { totalUnread: total, conversationUnreads };
}

/**
 * Fetch participants of a conversation (admin-only).
 */
export async function listParticipants(
  conversationId: string
): Promise<{ data: ParticipantInfo[]; error: string | null }> {
  const supabase = getChatSupabase();
  if (!supabase) return { data: [], error: "Chat service unavailable." };

  const { data, error } = await supabase
    .from("conversation_participants")
    .select(
      `
      id, conversation_id, user_id, joined_at, last_read_at,
      profile:profiles!conversation_participants_user_id_fkey (
        id, full_name, email, avatar_url, role
      )
    `
    )
    .eq("conversation_id", conversationId);

  if (error) return { data: [], error: error.message };

  return {
    data: (data ?? []).map((row: any) => ({
      id: row.id,
      conversation_id: row.conversation_id,
      user_id: row.user_id,
      joined_at: row.joined_at,
      last_read_at: row.last_read_at,
      full_name: row.profile?.full_name ?? null,
      email: row.profile?.email ?? "",
      avatar_url: row.profile?.avatar_url ?? null,
      role: row.profile?.role ?? null,
    })),
    error: null,
  };
}

/**
 * Add the current admin as a participant in a conversation (for replying).
 * No-op if already a participant.
 */
export async function joinConversationAsAdmin(
  conversationId: string
): Promise<{ error: string | null }> {
  const supabase = getChatSupabase();
  if (!supabase) return { error: "Chat service unavailable." };

  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes?.user;
  if (!user) return { error: "Not authenticated." };

  // Verify user is admin before joining (defense in depth)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") {
    return { error: "Only admins can join conversations." };
  }

  // Insert if not already a participant
  const { error } = await supabase
    .from("conversation_participants")
    .upsert(
      {
        conversation_id: conversationId,
        user_id: user.id,
      },
      { onConflict: "conversation_id,user_id", ignoreDuplicates: true }
    );

  if (error) return { error: error.message };
  return { error: null };
}

/**
 * Fetch the current user's profile.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = getChatSupabase();
  if (!supabase) return null;

  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes?.user;
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return {
      id: user.id,
      email: user.email ?? "",
      full_name: null,
      avatar_url: null,
      role: "user",
    };
  }

  return {
    id: profile.id,
    email: profile.email ?? user.email ?? "",
    full_name: profile.full_name,
    avatar_url: profile.avatar_url,
    role: profile.role ?? "user",
  };
}
