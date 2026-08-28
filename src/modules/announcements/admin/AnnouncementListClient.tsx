"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { Announcement, AnnouncementFilters } from "@/modules/announcements/types";
import {
  ANNOUNCEMENT_STATUSES,
  ANNOUNCEMENT_TYPES,
  ANNOUNCEMENT_PRIORITIES,
  getTargetLabel,
  TARGET_OPTIONS,
} from "@/modules/announcements/config/constants";
import { listAllAnnouncements, deleteAnnouncement } from "@/modules/announcements/services/announcements";

interface AnnouncementListClientProps {
  initialAnnouncements: Announcement[];
  statuses: typeof ANNOUNCEMENT_STATUSES;
  types: typeof ANNOUNCEMENT_TYPES;
  priorities: typeof ANNOUNCEMENT_PRIORITIES;
  initialFilters: AnnouncementFilters;
}

export default function AnnouncementListClient({
  initialAnnouncements,
  initialFilters,
}: AnnouncementListClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [searchValue, setSearchValue] = useState<string>(initialFilters.search || "");
  const [statusFilter, setStatusFilter] = useState<string>(initialFilters.status || "");
  const [typeFilter, setTypeFilter] = useState<string>(initialFilters.type || "");
  const [priorityFilter, setPriorityFilter] = useState<string>(initialFilters.priority || "");

  // Reload when URL search params change
  useEffect(() => {
    async function refresh() {
      const filters: AnnouncementFilters = {
        search: searchValue || undefined,
        status: (statusFilter || undefined) as AnnouncementFilters["status"],
        type: (typeFilter || undefined) as AnnouncementFilters["type"],
        priority: (priorityFilter || undefined) as AnnouncementFilters["priority"],
      };
      const { data } = await listAllAnnouncements(filters);
      setAnnouncements(data || []);
    }
    refresh();
  }, [searchValue, statusFilter, typeFilter, priorityFilter]);

  // Keep URL in sync
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchValue) params.set("search", searchValue);
    if (statusFilter) params.set("status", statusFilter);
    if (typeFilter) params.set("type", typeFilter);
    if (priorityFilter) params.set("priority", priorityFilter);
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    });
  }, [searchValue, statusFilter, typeFilter, priorityFilter, pathname, router]);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    const { error } = await deleteAnnouncement(id);
    if (!error) {
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } else {
      alert(`Failed to delete: ${error}`);
    }
  }

  const formatDate = (iso: string | null) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-background-alt border border-border rounded-xl">
        <input
          type="text"
          placeholder="Search title or description..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="flex-1 min-w-[200px] px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:border-accent"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:border-accent"
        >
          <option value="">All statuses</option>
          {ANNOUNCEMENT_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:border-accent"
        >
          <option value="">All types</option>
          {ANNOUNCEMENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:border-accent"
        >
          <option value="">All priorities</option>
          {ANNOUNCEMENT_PRIORITIES.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <div className="ml-auto text-sm text-muted">
          {isPending ? "..." : `${announcements.length} total`}
        </div>
      </div>

      {/* List */}
      {announcements.length === 0 ? (
        <div className="p-12 text-center bg-background-alt border border-border rounded-xl">
          <p className="text-sm text-muted">No announcements found.</p>
        </div>
      ) : (
        <div className="bg-background border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-background-alt border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted">Title</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted">Type</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted">Priority</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted">Target</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted">Published</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {announcements.map((a) => {
                const priority = ANNOUNCEMENT_PRIORITIES.find((p) => p.value === a.priority);
                return (
                  <tr key={a.id} className="border-b border-border last:border-0 hover:bg-background-alt/50">
                    <td className="px-4 py-3">
                      <a
                        href={`/admin/announcements/${a.id}/edit`}
                        className="text-sm font-medium text-foreground hover:text-accent line-clamp-1"
                      >
                        {a.title}
                      </a>
                      {a.description && (
                        <p className="text-xs text-muted line-clamp-1 mt-0.5">{a.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${
                          a.status === "published"
                            ? "bg-success/10 text-success"
                            : a.status === "draft"
                              ? "bg-muted/10 text-muted"
                              : "bg-error/10 text-error"
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted capitalize">
                      {a.type.replace("_", " ")}
                    </td>
                    <td className="px-4 py-3">
                      {priority && (
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium"
                          style={{ backgroundColor: priority.color + "18", color: priority.color }}
                        >
                          {priority.label}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {a.target_type === "all"
                        ? "All"
                        : getTargetLabel(a.target_value || "")}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                      {formatDate(a.published_at || a.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/admin/announcements/${a.id}/edit`}
                          className="px-2.5 py-1 text-xs text-muted hover:text-foreground border border-border rounded hover:border-foreground/30 transition-colors"
                        >
                          Edit
                        </a>
                        <button
                          onClick={() => handleDelete(a.id, a.title)}
                          className="px-2.5 py-1 text-xs text-error hover:bg-error/10 border border-border rounded hover:border-error/30 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}