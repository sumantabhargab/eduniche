/**
 * Announcement service — admin CRUD and user-facing queries.
 *
 * Admin operations use the SSR-aware server client (bypasses RLS via service role).
 * User queries use the browser client (RLS enforces visibility).
 */

import {
  getAnnouncementsSupabase,
  type SupabaseClient,
} from "./supabase";
import type {
  Announcement,
  AnnouncementFilters,
  AnnouncementRow,
  AnnouncementsPage,
  AnnouncementStatus,
  AnnouncementUpdateInput,
  UnreadCount,
} from "../types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toAnnouncement(row: AnnouncementRow, isRead?: boolean, readAt?: string | null): Announcement {
  return { ...row, is_read: isRead ?? false, read_at: readAt ?? null };
}

function supabase(): SupabaseClient | null {
  return getAnnouncementsSupabase();
}

async function currentUserId(): Promise<string | null> {
  const client = supabase();
  if (!client) return null;
  const { data } = await client.auth.getUser();
  return data.user?.id ?? null;
}

async function requireAuth(): Promise<string> {
  const userId = await currentUserId();
  if (!userId) throw new Error("Not authenticated.");
  return userId;
}

// ─── Admin: list all announcements (all statuses) ─────────────────────────────

export async function listAllAnnouncements(
  filters: AnnouncementFilters = {}
): Promise<{ data: Announcement[]; error: string | null; total: number }> {
  const client = supabase();
  if (!client) return { data: [], error: "Announcement service unavailable.", total: 0 };

  let query = client
    .from("announcements")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.type) query = query.eq("type", filters.type);
  if (filters.priority) query = query.eq("priority", filters.priority);
  if (filters.search) {
    const q = filters.search.trim();
    query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,content.ilike.%${q}%`);
  }

  const { data, error, count } = await query;

  if (error) return { data: [], error: error.message, total: 0 };
  return { data: (data as AnnouncementRow[]) ?? [], error: null, total: count ?? 0 };
}

// ─── Admin: create announcement ────────────────────────────────────────────────

export async function createAnnouncement(
  input: AnnouncementCreateInput,
  userId: string
): Promise<{ data: Announcement | null; error: string | null }> {
  const client = supabase();
  if (!client) return { data: null, error: "Announcement service unavailable." };

  // If publishing now, set published_at
  const status = input.status ?? "draft";
  const publishedAt = status === "published" ? new Date().toISOString() : null;

  const { data, error } = await client
    .from("announcements")
    .insert({
      title: input.title.trim(),
      description: (input.description ?? "").trim(),
      content: (input.content ?? "").trim(),
      type: input.type ?? "general",
      priority: input.priority ?? "normal",
      status,
      target_type: input.target_type ?? "all",
      target_value: input.target_value ?? null,
      expires_at: input.expires_at ?? null,
      created_by: userId,
      published_at: publishedAt,
    })
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: toAnnouncement(data as AnnouncementRow), error: null };
}

// ─── Admin: update announcement ────────────────────────────────────────────────

export async function updateAnnouncement(
  id: string,
  patch: AnnouncementUpdateInput
): Promise<{ data: Announcement | null; error: string | null }> {
  const client = supabase();
  if (!client) return { data: null, error: "Announcement service unavailable." };

  // If transitioning to published and wasn't before, stamp published_at
  const { data: existing } = await client
    .from("announcements")
    .select("status, published_at")
    .eq("id", id)
    .maybeSingle();

  if (!existing) return { data: null, error: "Announcement not found." };

  const update: Record<string, any> = { updated_at: new Date().toISOString() };

  if (patch.title !== undefined) update.title = patch.title.trim();
  if (patch.description !== undefined) update.description = patch.description.trim();
  if (patch.content !== undefined) update.content = patch.content.trim();
  if (patch.type !== undefined) update.type = patch.type;
  if (patch.priority !== undefined) update.priority = patch.priority;
  if (patch.target_type !== undefined) update.target_type = patch.target_type;
  if (patch.target_value !== undefined) update.target_value = patch.target_value ?? null;
  if (patch.expires_at !== undefined) update.expires_at = patch.expires_at;

  // Status change logic
  if (patch.status !== undefined && patch.status !== existing.status) {
    update.status = patch.status;
    if (patch.status === "published" && !existing.published_at) {
      update.published_at = new Date().toISOString();
    }
    if (patch.status === "draft" || patch.status === "archived") {
      update.published_at = null;
    }
  }

  if (patch.published_at !== undefined) {
    update.published_at = patch.published_at;
  }

  const { data, error } = await client
    .from("announcements")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: toAnnouncement(data as AnnouncementRow), error: null };
}

// ─── Admin: delete announcement ────────────────────────────────────────────────

export async function deleteAnnouncement(
  id: string
): Promise<{ error: string | null }> {
  const client = supabase();
  if (!client) return { error: "Announcement service unavailable." };

  const { error } = await client.from("announcements").delete().eq("id", id);
  return { error: error?.message ?? null };
}

// ─── User: get visible announcements (paginated) ──────────────────────────────

export async function getVisibleAnnouncements(
  page = 1,
  pageSize = 20
): Promise<{ data: Announcement[]; error: string | null; total: number }> {
  const client = supabase();
  if (!client) return { data: [], error: "Announcement service unavailable.", total: 0 };

  const userId = await currentUserId();

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await client
    .from("announcements")
    .select("*", { count: "exact" })
    .eq("status", "published")
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order("published_at", { ascending: false, nullsFirst: false })
    .range(from, to);

  if (error) return { data: [], error: error.message, total: 0 };

  // Enrich with read state
  let enriched: Announcement[] = (data as AnnouncementRow[]).map((row) =>
    toAnnouncement(row)
  );

  if (userId && enriched.length > 0) {
    const ids = enriched.map((a) => a.id);
    const { data: reads } = await client
      .from("announcement_reads")
      .select("announcement_id, read_at")
      .eq("user_id", userId)
      .in("announcement_id", ids);

    const readMap = new Map(
      (reads ?? []).map((r: any) => [r.announcement_id, r.read_at])
    );

    enriched = enriched.map((a) =>
      toAnnouncement(a, readMap.has(a.id), readMap.get(a.id) ?? null)
    );
  }

  return { data: enriched, error: null, total: count ?? 0 };
}

// ─── User: get unread count ────────────────────────────────────────────────────

export async function getUnreadCount(): Promise<UnreadCount> {
  const client = supabase();
  if (!client) return { totalUnread: 0, unreadImportant: 0 };

  const userId = await currentUserId();
  if (!userId) return { totalUnread: 0, unreadImportant: 0 };

  const now = new Date().toISOString();

  // Find published, non-expired announcements visible to this user
  const { data: visible, error: visErr } = await client
    .from("announcements")
    .select("id, type")
    .eq("status", "published")
    .or(`expires_at.is.null,expires_at.gt.${now}`);

  if (visErr || !visible || visible.length === 0) {
    return { totalUnread: 0, unreadImportant: 0 };
  }

  const visibleIds = visible.map((a: any) => a.id);

  const { data: reads, error: readErr } = await client
    .from("announcement_reads")
    .select("announcement_id")
    .eq("user_id", userId)
    .in("announcement_id", visibleIds);

  if (readErr) return { totalUnread: 0, unreadImportant: 0 };

  const readIds = new Set((reads ?? []).map((r: any) => r.announcement_id));

  const unread = visible.filter((a: any) => !readIds.has(a.id));
  const unreadImportant = unread.filter(
    (a: any) => a.type === "important"
  ).length;

  return {
    totalUnread: unread.length,
    unreadImportant,
  };
}

// ─── User: mark announcement as read ──────────────────────────────────────────

export async function markAnnouncementRead(
  announcementId: string
): Promise<{ error: string | null }> {
  const client = supabase();
  if (!client) return { error: "Announcement service unavailable." };

  const userId = await requireAuth();

  const { error } = await client
    .from("announcement_reads")
    .upsert(
      { announcement_id: announcementId, user_id: userId, read_at: new Date().toISOString() },
      { onConflict: "announcement_id,user_id" }
    );

  return { error: error?.message ?? null };
}

// ─── User: mark all visible announcements as read ──────────────────────────────

export async function markAllAnnouncementsRead(): Promise<{ error: string | null }> {
  const client = supabase();
  if (!client) return { error: "Announcement service unavailable." };

  const userId = await requireAuth();

  // Get all visible announcement IDs
  const now = new Date().toISOString();
  const { data: visible, error: visErr } = await client
    .from("announcements")
    .select("id")
    .eq("status", "published")
    .or(`expires_at.is.null,expires_at.gt.${now}`);

  if (visErr) return { error: visErr.message };
  if (!visible || visible.length === 0) return { error: null };

  const ids = visible.map((a: any) => a.id);
  const rows = ids.map((id: string) => ({
    announcement_id: id,
    user_id: userId,
    read_at: new Date().toISOString(),
  }));

  const { error } = await client
    .from("announcement_reads")
    .upsert(rows, { onConflict: "announcement_id,user_id" });

  return { error: error?.message ?? null };
}

// ─── User: get a single announcement (visible) ─────────────────────────────────

export async function getAnnouncement(
  id: string
): Promise<{ data: Announcement | null; error: string | null }> {
  const client = supabase();
  if (!client) return { data: null, error: "Announcement service unavailable." };

  const now = new Date().toISOString();
  const userId = await currentUserId();

  const { data, error } = await client
    .from("announcements")
    .select("*")
    .eq("id", id)
    .eq("status", "published")
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: null };

  let isRead = false;
  let readAt: string | null = null;

  if (userId) {
    const { data: readRow } = await client
      .from("announcement_reads")
      .select("read_at")
      .eq("announcement_id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (readRow) {
      isRead = true;
      readAt = (readRow as any).read_at;
    }
  }

  return { data: toAnnouncement(data as AnnouncementRow, isRead, readAt), error: null };
}

// ─── Admin: get a single announcement by ID (any status) ───────────────────────

export async function getAnnouncementById(
  id: string
): Promise<{ data: Announcement | null; error: string | null }> {
  const client = supabase();
  if (!client) return { data: null, error: "Announcement service unavailable." };

  const { data, error } = await client
    .from("announcements")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: null };

  return { data: toAnnouncement(data as AnnouncementRow), error: null };
}
