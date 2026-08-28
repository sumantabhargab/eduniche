"use client";

import type { Announcement } from "@/modules/announcements/types";
import { ANNOUNCEMENT_PRIORITIES, getTargetLabel } from "@/modules/announcements/config/constants";

interface AnnouncementCardProps {
  announcement: Announcement;
  onClick?: () => void;
  showTarget?: boolean;
  compact?: boolean;
}

export default function AnnouncementCard({
  announcement,
  onClick,
  showTarget = false,
  compact = false,
}: AnnouncementCardProps) {
  const priorityMeta = ANNOUNCEMENT_PRIORITIES.find(
    (p) => p.value === announcement.priority
  );
  const isImportant = announcement.type === "important";

  const formatDate = (iso: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={`w-full text-left p-3 rounded-lg border transition-colors duration-200 ${
          isImportant
            ? "border-accent bg-accent-subtle hover:border-accent-hover"
            : "border-border hover:border-foreground/20 bg-background"
        } ${!announcement.is_read ? "ring-1 ring-accent/30" : ""}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              {!announcement.is_read && (
                <span className="w-2 h-2 rounded-full bg-accent shrink-0 mt-1" />
              )}
              <p
                className={`text-sm truncate ${
                  !announcement.is_read ? "font-medium text-foreground" : "text-muted"
                }`}
              >
                {announcement.title}
              </p>
            </div>
            <p className="text-xs text-muted truncate pl-4">
              {announcement.description || announcement.content}
            </p>
          </div>
          <span className="text-[11px] text-muted-light shrink-0 whitespace-nowrap">
            {formatDate(announcement.published_at || announcement.created_at)}
          </span>
        </div>
      </button>
    );
  }

  return (
    <div
      className={`p-4 rounded-xl border transition-colors duration-200 ${
        isImportant
          ? "border-accent bg-accent-subtle"
          : "border-border bg-background"
      } ${!announcement.is_read ? "ring-1 ring-accent/30" : ""}`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          {isImportant && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-accent text-background">
              Important
            </span>
          )}
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-background-alt border border-border text-muted capitalize">
            {announcement.type.replace("_", " ")}
          </span>
          {priorityMeta && (
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium"
              style={{ backgroundColor: priorityMeta.color + "18", color: priorityMeta.color }}
            >
              {priorityMeta.label}
            </span>
          )}
          {showTarget && announcement.target_value && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-background-alt border border-border text-muted">
              {getTargetLabel(announcement.target_value)}
            </span>
          )}
        </div>
        <span className="text-xs text-muted-light whitespace-nowrap shrink-0">
          {formatDate(announcement.published_at || announcement.created_at)}
        </span>
      </div>

      <h3
        className={`text-base mb-1 ${
          !announcement.is_read ? "font-medium text-foreground" : "text-muted font-normal"
        }`}
      >
        {!announcement.is_read && (
          <span className="inline-block w-2 h-2 rounded-full bg-accent mr-2 align-middle" />
        )}
        {announcement.title}
      </h3>

      <p className="text-sm text-muted leading-relaxed line-clamp-2">
        {announcement.description || announcement.content}
      </p>
    </div>
  );
}
