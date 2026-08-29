/**
 * AdminChatPage — Admin chat moderation dashboard.
 *
 * Shows recent global chat messages with moderation actions
 * (delete message, mute user, ban user).
 *
 * Uses the actual chat_messages / muted_users / banned_users tables.
 */

import { requireAdmin } from "@/modules/content-cms/lib/auth";
import AdminChatClient from "./AdminChatClient";

export const dynamic = "force-dynamic";

export default async function AdminChatPage() {
  const admin = await requireAdmin();
  return <AdminChatClient admin={admin} />;
}
