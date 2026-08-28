"use client";

import { useState, useEffect, useRef } from "react";
import type { Announcement } from "@/modules/announcements/types";
import { useAnnouncements } from "@/modules/announcements/hooks/useAnnouncements";
import { markAllAnnouncementsRead } from "@/modules/announcements/services/announcements";
import AnnouncementCard from "./AnnouncementCard";

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onViewAnnouncement: (announcement: Announcement) => void;
}

export default function NotificationPanel({
  isOpen,
  onClose,
  onViewAnnouncement,
}: NotificationPanelProps) {
  const { announcements, isLoading, markRead, markAllRead } = useAnnouncements({
    refreshMs: 30000,
    pageSize: 8,
  });
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const unreadCount = announcements.filter((a) => !a.is_read).length;

  const handleCardClick = async (announcement: Announcement) => {
    if (!announcement.is_read) {
      await markRead(announcement.id);
    }
    onViewAnnouncement(announcement);
  };

  const handleMarkAllRead = async () => {
    setIsMarkingAll(true);
    await markAllRead();
    setIsMarkingAll(false);
  };

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Notifications">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div
        ref={panelRef}
        className="absolute top-14 right-4 md:right-6 w-[calc(100%-2rem)] md:w-[420px] max-h-[70vh] bg-background border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden animate-slide-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-sm font-medium text-foreground">Notifications</h2>
            {unreadCount > 0 && (
              <p className="text-xs text-muted mt-0.5">
                {unreadCount} unread
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 1 && (
              <button
                onClick={handleMarkAllRead}
                disabled={isMarkingAll}
                className="text-xs text-accent hover:text-accent-hover transition-colors disabled:opacity-50"
              >
                {isMarkingAll ? "Marking..." : "Mark all read"}
              </button>
            )}
            <button
              onClick={onClose}
              className="text-muted hover:text-foreground transition-colors"
              aria-label="Close notifications"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="px-5 py-8 text-center text-sm text-muted">
              Loading...
            </div>
          ) : announcements.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-muted mb-1">No notifications yet</p>
              <p className="text-xs text-muted-light">
                Announcements from EduNeuro will appear here.
              </p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {announcements.map((a) => (
                <AnnouncementCard
                  key={a.id}
                  announcement={a}
                  compact
                  onClick={() => handleCardClick(a)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
