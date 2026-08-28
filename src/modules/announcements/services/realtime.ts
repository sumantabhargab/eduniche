/**
 * Realtime subscription management for the Announcements module.
 *
 * Uses Supabase Realtime channels to listen for INSERT on announcements
 * when a new one is published. Subscriptions are scoped and lightweight.
 * The caller is responsible for cleanup by calling the unsubscribe function.
 */

import { getAnnouncementsSupabase } from "./supabase";

export type RealtimeHandler = () => void;

const activeChannels: any[] = [];

/**
 * Subscribe to new published announcements.
 */
export function subscribeToAnnouncements(
  onUpdate: RealtimeHandler
): () => void {
  const supabase = getAnnouncementsSupabase();
  if (!supabase) return () => {};

  const channelName = "announcements:public";

  if (activeChannels.length > 0) {
    activeChannels.forEach((ch: any) => ch.unsubscribe());
    activeChannels.length = 0;
  }

  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "announcements",
        filter: "status=eq.published",
      },
      () => {
        onUpdate();
      }
    )
    .subscribe((status) => {
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        console.warn(`[announcements] Realtime channel status: ${status}`);
      }
    });

  activeChannels.push(channel);

  return () => {
    channel.unsubscribe();
    const idx = activeChannels.indexOf(channel);
    if (idx >= 0) activeChannels.splice(idx, 1);
  };
}
