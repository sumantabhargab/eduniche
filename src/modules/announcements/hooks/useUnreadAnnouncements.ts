/**
 * useUnreadAnnouncements — lightweight unread count + realtime subscription.
 */

"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { getUnreadCount } from "../services/announcements";
import {
  subscribeToAnnouncements,
  type RealtimeHandler,
} from "../services/realtime";
import type { UnreadCount } from "../types";

export interface UseUnreadAnnouncementsReturn {
  unread: UnreadCount;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export function useUnreadAnnouncements(
  enabled = true
): UseUnreadAnnouncementsReturn {
  const [unread, setUnread] = useState<UnreadCount>({
    totalUnread: 0,
    unreadImportant: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const count = await getUnreadCount();
    setUnread(count);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    refresh();

    const handler: RealtimeHandler = () => {
      refresh();
    };

    const unsubscribe = subscribeToAnnouncements(handler);

    return () => {
      unsubscribe();
    };
  }, [enabled, refresh]);

  return { unread, isLoading, refresh };
}
