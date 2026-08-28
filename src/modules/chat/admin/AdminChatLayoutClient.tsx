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

export default function AdminChatLayoutClient({ admin, children }: AdminChatLayoutClientProps) {
  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {children}
    </div>
  );
}
