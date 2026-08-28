import { requireAdmin } from "@/modules/content-cms/lib/auth";
import AdminLayoutClient from "@/modules/content-cms/components/admin-layout/AdminLayoutClient";
import AnnouncementEditor from "@/modules/announcements/admin/AnnouncementEditor";

export const dynamic = "force-dynamic";

export default async function NewAnnouncementPage() {
  await requireAdmin();

  return (
    <AdminLayoutClient
      admin={{
        user: {
          email: "",
          role: "admin",
        },
      }}
    >
      <AnnouncementEditor />
    </AdminLayoutClient>
  );
}
