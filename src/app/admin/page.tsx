import { getAdminSession, requireAdmin } from "@/modules/content-cms/lib/auth";
import { listChildFolders } from "@/modules/content-cms/services/folder-service";
import { redirect } from "next/navigation";
import AdminLayoutClient from "@/modules/content-cms/components/admin-layout/AdminLayoutClient";
import AdminFileManager from "@/modules/content-cms/components/admin-file-manager/FileManagerClient";

export default async function AdminPage() {
  const admin = await requireAdmin();

  const { folders, error } = await listChildFolders(null);

  if (error) {
    return (
      <AdminLayoutClient admin={admin}>
        <div className="p-6">
          <p className="text-red-600">Failed to load content: {error}</p>
        </div>
      </AdminLayoutClient>
    );
  }

  return (
    <AdminLayoutClient admin={admin}>
      <AdminFileManager initialFolders={folders} initialFolderId={null} />
    </AdminLayoutClient>
  );
}
