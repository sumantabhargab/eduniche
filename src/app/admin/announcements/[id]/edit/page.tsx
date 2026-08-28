import { requireAdmin } from "@/modules/content-cms/lib/auth";
import { getAnnouncementById } from "@/modules/announcements/services/announcements";
import AdminLayoutClient from "@/modules/content-cms/components/admin-layout/AdminLayoutClient";
import AnnouncementEditor from "@/modules/announcements/admin/AnnouncementEditor";
import type { Announcement } from "@/modules/announcements/types";

export const dynamic = "force-dynamic";

export default async function EditAnnouncementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id } = await params;
  const { data, error } = await getAnnouncementById(id);

  if (error || !data) {
    return (
      <AdminLayoutClient
        admin={{
          user: {
            email: "",
            role: "admin",
          },
        }}
      >
        <div className="p-6">
          <p className="text-error">Announcement not found.</p>
        </div>
      </AdminLayoutClient>
    );
  }

  const row = data as unknown as Announcement;

  return (
    <AdminLayoutClient
      admin={{
        user: {
          email: "",
          role: "admin",
        },
      }}
    >
      <AnnouncementEditor initial={row} />
    </AdminLayoutClient>
  );
}
