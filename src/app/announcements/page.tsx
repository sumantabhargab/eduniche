"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AnnouncementCard from "@/modules/announcements/components/AnnouncementCard";
import AnnouncementViewer from "@/modules/announcements/components/AnnouncementViewer";
import { getVisibleAnnouncements } from "@/modules/announcements/services/announcements";
import type { Announcement } from "@/modules/announcements/types";

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<Announcement | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await getVisibleAnnouncements(1, 50);
      setAnnouncements(data || []);
      setIsLoading(false);
    }
    load();
  }, []);

  async function handleCardClick(announcement: Announcement) {
    try {
      await fetch("/api/announcements/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark-one", announcementId: announcement.id }),
      });
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === announcement.id ? { ...a, is_read: true, read_at: new Date().toISOString() } : a))
      );
    } catch {
      // proceed anyway
    }
    setSelected(announcement);
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-6">
        <h1 className="text-3xl font-serif text-foreground mb-2">Announcements</h1>
        <p className="text-sm text-muted mb-8">
          Stay updated with the latest news, exam schedules, and library releases.
        </p>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-background-alt border border-border rounded-xl animate-pulse" />
            ))}
          </div>
        ) : announcements.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-muted">No announcements right now.</p>
            <p className="text-xs text-muted-light mt-1">
              New announcements from EduNeuro will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((a) => (
              <AnnouncementCard
                key={a.id}
                announcement={a}
                showTarget
                onClick={() => handleCardClick(a)}
              />
            ))}
          </div>
        )}
      </div>

      {selected && (
        <AnnouncementViewer announcement={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
