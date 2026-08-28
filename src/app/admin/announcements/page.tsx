import AdminLayoutClient from "@/modules/content-cms/components/admin-layout/AdminLayoutClient";
import AnnouncementsDashboard from "@/modules/announcements/admin/AnnouncementDashboard";

export const dynamic = "force-dynamic";

export default async function AdminAnnouncementsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[]>;
}) {
  return (
    <AdminLayoutClient
      admin={{
        user: {
          email: "",
          role: "admin",
        },
      }}
    >
      <AnnouncementsDashboard searchParams={searchParams} />
    </AdminLayoutClient>
  );
}
