import { getAdminSession, requireAdmin } from "@/modules/content-cms/lib/auth";
import { getFolder, listChildFolders } from "@/modules/content-cms/services/folder-service";
import { notFound } from "next/navigation";
import AdminLayoutClient from "@/modules/content-cms/components/admin-layout/AdminLayoutClient";
import AdminFileManager from "@/modules/content-cms/components/admin-file-manager/FileManagerClient";

export default async function AdminFolderPage({
  params,
}: {
  params: Promise<{ folderId: string }>;
}) {
  const admin = await requireAdmin();
  const { folderId } = await params;

  const folderResult = await getFolder(folderId);
  if (folderResult.error || !folderResult.folder) {
    notFound();
  }

  const { folders } = await listChildFolders(folderId);

  return (
    <AdminLayoutClient admin={admin}>
      <AdminFileManager
        initialFolders={folders}
        initialFolderId={folderId}
      />
    </AdminLayoutClient>
  );
}
