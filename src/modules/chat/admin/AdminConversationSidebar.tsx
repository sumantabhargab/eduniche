/**
 * AdminConversationSidebar — sidebar with search + conversation list.
 */

"use client";

import { useState } from "react";
import { useAdminConversations } from "../../hooks/useAdminConversations";
import ConversationItemList from "./AdminConversationList";

interface AdminConversationSidebarProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
  admin: {
    user: {
      email: string;
      role: string;
    };
  };
}

export default function AdminConversationSidebar({ selectedId, onSelect, admin }: AdminConversationSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const {
    conversations,
    isLoading,
    error,
    totalUnread,
  } = useAdminConversations();

  // Apply client-side search filter on top of the server-side results
  const filteredConversations = conversations;

  return (
    <aside className="w-80 border-r border-border flex flex-col bg-background shrink-0">
      {/* Header */}
      <div className="px-4 h-14 border-b border-border flex items-center justify-between shrink-0">
        <h1 className="text-sm font-medium text-foreground">Support Chat</h1>
        {totalUnread > 0 && (
          <span className="text-xs font-medium text-accent bg-accent-subtle px-2 py-0.5 rounded-full">
            {totalUnread} unread
          </span>
        )}
      </div>

      {/* Search */}
      <div className="p-3 border-b border-border shrink-0">
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

      {/* Error */}
      {error && (
        <div className="m-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg shrink-0">
          {error}
        </div>
      )}

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
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
        ) : filteredConversations.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted">
            {searchQuery ? "No conversations match your search." : "No conversations yet."}
          </div>
        ) : (
          <ConversationItemList
            conversations={filteredConversations}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        )}
      </div>

      {/* User info */}
      <div className="p-3 border-t border-border shrink-0">
        <p className="text-xs text-muted truncate">{admin.user.email}</p>
        <p className="text-xs text-muted capitalize">{admin.user.role}</p>
      </div>
    </aside>
  );
}
