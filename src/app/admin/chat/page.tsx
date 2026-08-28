import { requireAdmin } from "@/modules/content-cms/lib/auth";
import AdminChatLayoutClient from "@/modules/chat/admin/AdminChatLayoutClient";
import AdminChatDashboard from "@/modules/chat/admin/AdminChatDashboard";

export const dynamic = "force-dynamic";

export default async function AdminChatPage() {
  const admin = await requireAdmin();

  return (
    <AdminChatLayoutClient>
      <AdminChatDashboard admin={admin} />
    </AdminChatLayoutClient>
  );
}