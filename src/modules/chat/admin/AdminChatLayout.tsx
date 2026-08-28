/**
 * Admin chat dashboard — full admin interface for managing all conversations.
 *
 * Accessible at /admin/chat, protected by both:
 *   - Next.js middleware (verifies admin role)
 *   - Server Component (requiresAdmin)
 */

import { requireAdmin } from "@/modules/content-cms/lib/auth";
import AdminChatLayout from "./AdminChatLayout";

export const dynamic = "force-dynamic";

export default async function AdminChatPage() {
  const admin = await requireAdmin();

  return (
    <AdminChatLayout admin={admin}>
      <AdminChatDashboard admin={admin} />
    </AdminChatLayout>
  );
}

import { Suspense } from "react";
import { useMessages } from "../hooks/useAdminMessages";
import { useAdminConversations } from "../hooks/useAdminConversations";
import { listParticipants } from "../services/conversations";
import { formatRelativeTime } from "../utils/format";

function AdminChatDashboard({ admin }: { admin: any }) {
  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Sidebar: conversation list */}
      <AdminConversationSidebar />

      {/* Main: conversation view */}
      <AdminConversationPanel admin={admin} />
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function AdminConversationSidebar() {
  const {
    conversations,
    isLoading,
    error,
    refresh,
    totalUnread,
    searchQuery,
    setSearchQuery,
  } = useAdminConversations();

  return (
    <aside className="w-80 border-r border-border flex flex-col bg-background shrink-0">
      {/* Header */}
      <div className="p-3 border-b border-border shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-sm font-medium text-foreground">Support Chat</h1>
          {totalUnread > 0 && (
            <span className="text-xs font-medium text-accent bg-accent-subtle px-2 py-0.5 rounded-full">
              {totalUnread} unread
            </span>
          )}
        </div>
        {/* Search */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search users, subjects…"
          className="
            w-full px-3 py-2 text-sm rounded-lg
            border border-border bg-background-alt
            text-foreground placeholder:text-muted
            focus:outline-none focus:ring-2 focus:ring-accent/40
          "
        />
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="m-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}
        {isLoading ? (
          <div className="p-3 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse h-16 bg-background-alt rounded-lg"
                style={{ animationDelay: `${i * 50}ms` }}
              />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted">
            No conversations yet.
          </div>
        ) : (
          <AdminConversationItemList conversations={conversations} refresh={refresh} />
        )}
      </div>
    </aside>
  );
}

function AdminConversationItemList({ conversations, refresh }: { conversations: any[]; refresh: () => void }) {
  const [selectedId, setSelectedId] = useAdminConversationSelection();

  return (
    <>
      {conversations.map((conv) => (
        <button
          key={conv.id}
          onClick={() => setSelectedId(conv.id)}
          className={`
            w-full flex items-start gap-3 px-3 py-3 text-left
            hover:bg-background-alt transition-colors duration-150
            border-l-2
            ${selectedId === conv.id ? "border-accent bg-background-alt" : "border-transparent"}
          `}
        >
          <div className="w-9 h-9 rounded-full bg-accent-subtle text-accent flex items-center justify-center text-sm font-medium shrink-0">
            {(conv.other_participant?.full_name ?? conv.other_participant?.email ?? "U")
              .charAt(0)
              .toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-foreground truncate">
                {conv.other_participant?.full_name ?? conv.other_participant?.email ?? "Unknown"}
              </span>
              {conv.last_message && (
                <span className="text-[10px] text-muted shrink-0">
                  {formatRelativeTime(conv.last_message.created_at)}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between gap-2 mt-0.5">
              <p className="text-xs text-muted truncate">
                {conv.last_message?.deleted_at
                  ? "Message deleted"
                  : conv.last_message?.content
                    ? conv.last_message.content.length > 40
                      ? conv.last_message.content.slice(0, 40) + "…"
                      : conv.last_message.content
                    : "No messages yet"}
              </p>
              {conv.unread_count > 0 && (
                <span className="shrink-0 min-w-[20px] h-5 bg-accent text-background text-xs font-bold rounded-full flex items-center justify-center px-1.5">
                  {conv.unread_count > 9 ? "9+" : conv.unread_count}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              {conv.subject && (
                <span className="text-[10px] text-muted-light bg-background px-1.5 py-0.5 rounded">
                  {conv.subject}
                </span>
              )}
              {conv.status === "closed" && (
                <span className="text-[10px] text-muted-light bg-background px-1.5 py-0.5 rounded">
                  Closed
                </span>
              )}
            </div>
          </div>
        </button>
      ))}
    </>
  );
}

// ─── Shared state for sidebar + panel ─────────────────────────────────────────

// We use a simple module-level variable to share the selected conversation ID
// between the sidebar and panel. In a real app you'd use a URL param or context.
let selectedConvId: string | null = null;
let selectedConvListeners = new Set<() => void>();

function useAdminConversationSelection() {
  const [, forceUpdate] = useState(0);

  // We use a module-level store to sync sidebar ↔ panel
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).__adminConvId = selectedConvId;

  const setSelectedId = (id: string | null) => {
    selectedConvId = id;
    selectedConvListeners.forEach((fn) => fn());
  };

  return [selectedConvId, setSelectedId] as const;
}

// ─── Conversation Panel ───────────────────────────────────────────────────────

function AdminConversationPanel({ admin }: { admin: any }) {
  // Read the current selection from the module-level variable
  // and subscribe to changes
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const listener = () => forceUpdate((n) => n + 1);
    selectedConvListeners.add(listener);
    return () => { selectedConvListeners.delete(listener); };
  }, []);

  const conversationId = (globalThis as any).__adminConvId as string | null;

  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-background-alt flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5 21.73V12a9 9 0 0 1 9-9h.25" />
            </svg>
          </div>
          <p className="text-sm text-muted">Select a conversation to view messages.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <AdminConversationHeader conversationId={conversationId} />
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center">
            <div className="text-sm text-muted">Loading…</div>
          </div>
        }
      >
        <AdminConversationView conversationId={conversationId} />
      </Suspense>
    </div>
  );
}

import { type Conversation } from "../../types/chat";

// We need to fetch conversation info for the header — do this as a client component
"use client";

function AdminConversationHeader({ conversationId }: { conversationId: string }) {
  const [conv, setConv] = useState<Conversation | null>(null);
  const [isClosed, setIsClosed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    import("../../services/conversations").then(({ findConversationById }) => {
      findConversationById(conversationId).then((result) => {
        if (cancelled) return;
        if (result.data) {
          setConv(result.data);
          setIsClosed(result.data.status === "closed");
        }
      });
    });
    return () => { cancelled = true; };
  }, [conversationId]);

  const handleToggleStatus = async () => {
    const { updateConversation } = await import("../../services/conversations");
    const newStatus = isClosed ? "open" : "closed";
    await updateConversation(conversationId, { status: newStatus });
    setIsClosed(!isClosed);
  };

  return (
    <div className="flex items-center justify-between px-4 h-14 border-b border-border shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-full bg-accent text-background flex items-center justify-center text-sm font-medium shrink-0">
          {conv?.other_participant?.full_name?.charAt(0)?.toUpperCase() ??
            conv?.other_participant?.email?.charAt(0)?.toUpperCase() ??
            "?"}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {conv?.other_participant?.full_name ??
              conv?.other_participant?.email ??
              "Unknown User"}
          </p>
          <p className="text-xs text-muted">
            {conv?.subject ?? "No subject"}
          </p>
        </div>
      </div>
      <button
        onClick={handleToggleStatus}
        className={`
          text-xs px-3 py-1.5 rounded-lg font-medium
          transition-colors
          ${isClosed
            ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
            : "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
          }
        `}
      >
        {isClosed ? "Reopen" : "Close"}
      </button>
    </div>
  );
}

// Use dynamic import for admin messages hook since it uses "use client" boundaries differently
"use client";

function AdminConversationView({ conversationId }: { conversationId: string }) {
  const {
    messages,
    isLoading,
    hasMore,
    error,
    send,
    loadOlder,
  } = useAdminMessages({ conversationId });

  return (
    <>
      {error && (
        <div className="m-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}
      <MessageList
        messages={messages}
        isLoading={isLoading}
        hasMore={hasMore}
        onLoadOlder={loadOlder}
        currentUserId="admin"
      />
      <MessageComposer onSend={send} disabled={false} placeholder="Reply as admin…" />
    </>
  );
}
