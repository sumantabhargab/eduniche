/**
 * Core types for the Announcements & Notifications module.
 */

// ─── Announcement type/category ───────────────────────────────────────────────

export type AnnouncementType =
  | "general"
  | "library"
  | "exam"
  | "mock_test"
  | "maintenance"
  | "important";

export type AnnouncementPriority = "low" | "normal" | "high" | "urgent";

export type AnnouncementStatus = "draft" | "published" | "archived";

export type TargetType = "all" | "branch";

// ─── Database row (mirrors the schema) ────────────────────────────────────────

export interface AnnouncementRow {
  id: string;
  title: string;
  description: string;
  content: string;
  type: AnnouncementType;
  priority: AnnouncementPriority;
  status: AnnouncementStatus;
  target_type: TargetType;
  target_value: string | null;
  created_by: string;
  published_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Read record ──────────────────────────────────────────────────────────────

export interface AnnouncementReadRow {
  id: string;
  announcement_id: string;
  user_id: string;
  read_at: string;
}

// ─── Enriched announcement (with read state for current user) ──────────────────

export interface Announcement extends AnnouncementRow {
  is_read?: boolean;
  read_at?: string | null;
}

// ─── Filter / list types ──────────────────────────────────────────────────────

export interface AnnouncementFilters {
  status?: AnnouncementStatus;
  type?: AnnouncementType;
  priority?: AnnouncementPriority;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface AnnouncementsPage {
  announcements: Announcement[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface UnreadCount {
  totalUnread: number;
  unreadImportant: number;
}

// ─── Input types ──────────────────────────────────────────────────────────────

export type AnnouncementCreateInput = {
  title: string;
  description?: string;
  content?: string;
  type?: AnnouncementType;
  priority?: AnnouncementPriority;
  status?: AnnouncementStatus;
  target_type?: TargetType;
  target_value?: string | null;
  expires_at?: string | null;
};

export type AnnouncementUpdateInput = Partial<AnnouncementCreateInput> & {
  published_at?: string | null;
};

// ─── Target options (derived from existing branch values) ─────────────────────

export type TargetOption =
  | { value: "all"; label: "All users" }
  | { value: string; label: string };
