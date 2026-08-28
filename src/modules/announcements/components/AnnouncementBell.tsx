"use client";

import { useUnreadAnnouncements } from "@/modules/announcements/hooks/useUnreadAnnouncements";

interface AnnouncementBellProps {
  onClick: () => void;
}

export default function AnnouncementBell({ onClick }: AnnouncementBellProps) {
  const { unread, isLoading } = useUnreadAnnouncements();

  const hasUnread = unread.totalUnread > 0;
  const hasImportant = unread.unreadImportant > 0;

  return (
    <button
      onClick={onClick}
      className="relative inline-flex items-center justify-center w-9 h-9 text-muted hover:text-foreground transition-colors duration-200"
      aria-label={`Notifications${hasUnread ? ` - ${unread.totalUnread} unread` : ""}`}
      title="Notifications"
    >
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
        />
      </svg>

      {/* Badge */}
      {hasUnread && !isLoading && (
        <span
          className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold text-background ${
            hasImportant ? "bg-error animate-pulse" : "bg-accent"
          }`}
        >
          {unread.totalUnread > 99 ? "99+" : unread.totalUnread}
        </span>
      )}
    </button>
  );
}
