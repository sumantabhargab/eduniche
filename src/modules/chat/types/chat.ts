/**
 * Core types for the Live Chat module.
 *
 * This file is the canonical source for all chat domain types.
 * Keep types stable — many files import from here.
 */

// ─── Status & Message Types ────────────────────────────────────────────────────

/** Conversation lifecycle status. */
export type ConversationStatus = "open" | "closed" | "archived";

/** Message delivery state for optimistic UI. */
export type MessageSendState = "sending" | "sent" | "delivered" | "read" | "failed";

/** The kind of content a message carries. */
export type MessageContentType = "text" | "system" | "typing" | "info";

// ─── Database Row Types (mirror the schema) ────────────────────────────────────

export interface ConversationRow {
  id: string;
  created_at: string;
  updated_at: string;
  status: ConversationStatus;
  created_by: string;
  last_message_at: string | null;
  subject: string | null;
}

export interface ConversationParticipantRow {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
  last_read_at: string | null;
}

export interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  content_type: MessageContentType;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
  send_state: MessageSendState;
}

// ─── Enriched Types (with joined data) ────────────────────────────────────────

export interface Conversation {
  id: string;
  status: ConversationStatus;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
  created_by: string;
  subject: string | null;

  // Joined fields
  other_participant?: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
  last_message?: MessageRow;
  unread_count: number;
  participant_count: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  content_type: MessageContentType;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
  send_state: MessageSendState;

  // Joined sender info
  sender?: {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

export interface ParticipantInfo {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
  last_read_at: string | null;

  // Joined profile
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  role: string | null;
}

// ─── Input Types ──────────────────────────────────────────────────────────────

export interface CreateConversationInput {
  subject?: string;
}

export interface SendMessageInput {
  conversationId: string;
  content: string;
  contentType?: MessageContentType;
}

export interface UpdateConversationInput {
  status?: ConversationStatus;
  subject?: string;
}

// ─── Filter / List Types ──────────────────────────────────────────────────────

export interface ConversationFilters {
  status?: ConversationStatus;
  search?: string;
  hasUnread?: boolean;
}

export interface ConversationsPage {
  conversations: Conversation[];
  total: number;
  hasMore: boolean;
}

export interface MessagesPage {
  messages: Message[];
  hasMore: boolean;
}

// ─── Unread Summary ──────────────────────────────────────────────────────────

export interface UnreadSummary {
  totalUnread: number;
  conversationUnreads: { conversationId: string; unreadCount: number }[];
}

// ─── Auth types ───────────────────────────────────────────────────────────────

export interface CurrentUser {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
}

// ─── Realtime event types ─────────────────────────────────────────────────────

export type RealtimeEvent =
  | { type: "message_inserted"; message: MessageRow }
  | { type: "conversation_updated"; conversation: ConversationRow }
  | { type: "participant_updated"; participant: ConversationParticipantRow };
