/**
 * Public API for the Chat module.
 *
 * Import from this file when consuming the module from outside.
 * Within the module, import directly from sub-files.
 */

// ─── Components ───────────────────────────────────────────────────────────────

export { ChatWidgetProvider, ChatButton, useChatWidget } from "./components/ChatWidget";
export { ChatWindow } from "./components/ChatWindow";
export { ChatHeader } from "./components/ChatHeader";
export { ConversationList } from "./components/ConversationList";
export { ConversationItem } from "./components/ConversationItem";
export { MessageList } from "./components/MessageList";
export { MessageBubble } from "./components/MessageBubble";
export { MessageComposer } from "./components/MessageComposer";

// ─── Hooks ───────────────────────────────────────────────────────────────────

export { useConversations } from "./hooks/useConversations";
export { useMessages } from "./hooks/useMessages";

// ─── Services ─────────────────────────────────────────────────────────────────

export {
  listMyConversations,
  findConversationWith,
  createConversation,
  findConversationById,
  updateConversation,
  markConversationRead,
  getUnreadSummary,
  listParticipants,
  joinConversationAsAdmin,
  getCurrentUser,
} from "./services/conversations";

export {
  listMessages,
  sendMessage,
  deleteMessage,
} from "./services/messages";

export {
  subscribeToMessages,
  subscribeToReads,
  subscribeToConversationUpdates,
  cleanupAllRealtime,
} from "./services/realtime";

// ─── Types ────────────────────────────────────────────────────────────────────

export type {
  ConversationStatus,
  MessageSendState,
  MessageContentType,
  ConversationRow,
  ConversationParticipantRow,
  MessageRow,
  Conversation,
  Message,
  ParticipantInfo,
  CreateConversationInput,
  SendMessageInput,
  UpdateConversationInput,
  ConversationFilters,
  ConversationsPage,
  MessagesPage,
  UnreadSummary,
  CurrentUser,
  RealtimeEvent,
} from "./types/chat";

// ─── Utils ────────────────────────────────────────────────────────────────────

export {
  formatRelativeTime,
  formatClockTime,
  formatDayLabel,
  truncate,
  displayName,
} from "./utils/format";
