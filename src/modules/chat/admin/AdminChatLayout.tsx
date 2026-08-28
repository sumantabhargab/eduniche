/**
 * AdminChatLayout — server wrapper for the admin chat dashboard.
 *
 * Provides the outer layout shell; the interactive content lives in
 * AdminChatLayoutClient.
 */

import AdminChatLayoutClient from "./AdminChatLayoutClient";

interface AdminChatLayoutProps {
  children: React.ReactNode;
}

export default function AdminChatLayout({ children }: AdminChatLayoutProps) {
  return (
    <AdminChatLayoutClient>
      {children}
    </AdminChatLayoutClient>
  );
}
