/**
 * AdminChatLayout — server wrapper for the admin chat dashboard.
 *
 * Provides the outer layout shell; the interactive content lives in
 * AdminChatLayoutClient.
 */

import AdminChatLayoutClient from "./AdminChatLayoutClient";

interface AdminChatLayoutProps {
  admin: {
    user: {
      email: string;
      role: string;
    };
  };
  children: React.ReactNode;
}

export default function AdminChatLayout({ admin, children }: AdminChatLayoutProps) {
  return (
    <AdminChatLayoutClient admin={admin}>
      {children}
    </AdminChatLayoutClient>
  );
}
