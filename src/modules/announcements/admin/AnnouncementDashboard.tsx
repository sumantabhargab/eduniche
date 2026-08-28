import { requireAdmin } from "@/modules/content-cms/lib/auth";
import { listAllAnnouncements } from "@/modules/announcements/services/announcements";
import {
  ANNOUNCEMENT_STATUSES,
  ANNOUNCEMENT_TYPES,
  ANNOUNCEMENT_PRIORITIES,
} from "@/modules/announcements/config/constants";
import AnnouncementListClient from "./AnnouncementListClient";
import type { AnnouncementFilters } from "@/modules/announcements/types";

export default async function AnnouncementsDashboard({
  searchParams,
}: {
  searchParams?: Record<string, string | string[]>;
}) {
  await requireAdmin();

  const filters: AnnouncementFilters = {};
  if (searchParams?.status && typeof searchParams.status === "string") {
    filters.status = searchParams.status as AnnouncementFilters["status"];
  }
  if (searchParams?.type && typeof searchParams.type === "string") {
    filters.type = searchParams.type as AnnouncementFilters["type"];
  }
  if (searchParams?.priority && typeof searchParams.priority === "string") {
    filters.priority = searchParams.priority as AnnouncementFilters["priority"];
  }
  if (searchParams?.search && typeof searchParams.search === "string") {
    filters.search = searchParams.search;
  }

  const { data: announcements } = await listAllAnnouncements(filters);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif text-foreground">Announcements</h1>
          <p className="text-sm text-muted mt-1">Manage and publish announcements</p>
        </div>
        <a
          href="/admin/announcements/new"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-background bg-accent rounded-lg hover:bg-accent-hover transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Announcement
        </a>
      </div>
      <AnnouncementListClient
        initialAnnouncements={announcements || []}
        statuses={ANNOUNCEMENT_STATUSES}
        types={ANNOUNCEMENT_TYPES}
        priorities={ANNOUNCEMENT_PRIORITIES}
        initialFilters={filters}
      />
    </div>
  );
}