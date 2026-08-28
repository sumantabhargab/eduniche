/**
 * AdminChatLayoutClient — client shell for the admin chat dashboard.
 */

"use client";

import { useState, useCallback } from "react";
import AdminConversationSidebar from "./AdminConversationSidebar";
import AdminConversationView from "./AdminConversationView";

interface AdminChatLayoutClientProps {
  admin: {
    user: {
      email: string;
      role: string;
    };
  };
  children: React.ReactNode;
}

export default function AdminChatLayoutClient({ admin }: AdminChatLayoutClientProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <AdminConversationSidebar
        selectedId={selectedId}
        onSelect={setSelectedId}
        admin={admin}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        {selectedId ? (
          <AdminConversationView key={selectedId} conversationId={selectedId} />
        ) : (
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
        )}
      </main>
    </div>
  );
}
