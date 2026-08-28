/**
 * useAnnouncements — fetch and manage the user's visible announcements.
 */

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Announcement, AnnouncementFilters } from "../types";
import {
  getVisibleAnnouncements,
  markAnnouncementRead,
  markAllAnnouncementsRead,
} from "../services/announcements";

export interface UseAnnouncementsOptions {
  pageSize?: number;
  refreshMs?: number;
  filters?: AnnouncementFilters;
}

export interface UseAnnouncementsReturn {
  announcements: Announcement[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

export function useAnnouncements(
  opts: UseAnnouncementsOptions = {}
): UseAnnouncementsReturn {
  const { pageSize = 20, refreshMs = 30000 } = opts;
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const { data, error } = await getVisibleAnnouncements(1, pageSize);

    if (error) {
      setError(error);
      return;
    }

    setAnnouncements(data ?? []);
    setIsLoading(false);
  }, [pageSize]);

  useEffect(() => {
    setIsLoading(true);
    load();
  }, [load]);

  useEffect(() => {
    if (refreshMs <= 0) return;
    const interval = setInterval(load, refreshMs);
    return () => clearInterval(interval);
  }, [load, refreshMs]);

  const markRead = useCallback(async (id: string) => {
    await markAnnouncementRead(id);
    setAnnouncements((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, is_read: true, read_at: new Date().toISOString() } : a
      )
    );
  }, []);

  const markAllRead = useCallback(async () => {
    await markAllAnnouncementsRead();
    setAnnouncements((prev) =>
      prev.map((a) => ({ ...a, is_read: true, read_at: new Date().toISOString() }))
    );
  }, []);

  return {
    announcements,
    isLoading,
    error,
    refresh: load,
    markRead,
    markAllRead,
  };
}
