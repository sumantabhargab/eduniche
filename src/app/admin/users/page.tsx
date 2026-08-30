import { getAdminSession, requireAdmin } from "@/modules/content-cms/lib/auth";
import AdminUsersClient from "./UsersClient";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ search?: string; plan?: string }> }) {
  const admin = await requireAdmin();
  const sp = await searchParams;

  return (
    <div className="p-6">
      <AdminUsersClient admin={admin} search={sp.search || ""} plan={sp.plan || ""} />
    </div>
  );
}
