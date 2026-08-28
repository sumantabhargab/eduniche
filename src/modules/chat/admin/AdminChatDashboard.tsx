/**
 * AdminChatDashboard — admin chat interface.
 *
 * Renders the sidebar + conversation panel layout with shared selection state.
 */

"use client";

import { useState } from "react";
import { useAdminConversations } from "../hooks/useAdminConversations";
import AdminConversationSidebar from "./AdminConversationSidebar";
import AdminConversationView from "./AdminConversationView";

interface AdminChatDashboardProps {
  admin: {
    user: {
      email: string;
      role: string;
    };
  };
}

export default function AdminChatDashboard({ admin }: AdminChatDashboardProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { refresh } = useAdminConversations();

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <AdminConversationSidebar
        admin={admin}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
      <AdminConversationView
        conversationId={selectedId ?? undefined}
        onRefresh={refresh}
      />
    </div>
  );
}
