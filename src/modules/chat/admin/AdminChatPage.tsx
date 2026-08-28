/**
 * Admin chat dashboard — full admin interface for managing all conversations.
 *
 * Accessible at /admin/chat, protected by:
 *   - Next.js middleware (verifies admin role)
 *   - Server Component (requiresAdmin)
 */

import { requireAdmin } from "@/modules/content-cms/lib/auth";
import AdminChatLayoutClient from "./AdminChatLayoutClient";

export const dynamic = "force-dynamic";

export default async function AdminChatPage() {
  const admin = await requireAdmin();

  return (
    <AdminChatLayoutClient admin={admin}>
      <AdminChatDashboard />
    </AdminChatLayoutClient>
  );
}
