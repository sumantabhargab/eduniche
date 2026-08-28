"use client";

import type { Announcement } from "@/modules/announcements/types";
import { ANNOUNCEMENT_PRIORITIES, getTargetLabel } from "@/modules/announcements/config/constants";

interface AnnouncementViewerProps {
  announcement: Announcement;
  onClose: () => void;
}

export default function AnnouncementViewer({ announcement, onClose }: AnnouncementViewerProps) {
  const priorityMeta = ANNOUNCEMENT_PRIORITIES.find(
    (p) => p.value === announcement.priority
  );
  const isImportant = announcement.type === "important";

  const formatDate = (iso: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 my-8 bg-background border border-border rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border px-6 py-4 flex items-start justify-between gap-4 z-10">
          <div className="flex items-center gap-2 flex-wrap">
            {isImportant && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-accent text-background">
                Important
              </span>
            )}
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-background-alt border border-border text-muted capitalize">
              {announcement.type.replace("_", " ")}
            </span>
            {priorityMeta && (
              <span
                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ backgroundColor: priorityMeta.color + "18", color: priorityMeta.color }}
              >
                {priorityMeta.label}
              </span>
            )}
            {announcement.target_value && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-background-alt border border-border text-muted">
                {getTargetLabel(announcement.target_value)}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground transition-colors shrink-0"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          <h1 className="text-xl md:text-2xl font-serif text-foreground mb-3">
            {announcement.title}
          </h1>

          <div className="flex items-center gap-3 mb-6 text-xs text-muted">
            <span>{formatDate(announcement.published_at || announcement.created_at)}</span>
            {announcement.expires_at && (
              <>
                <span>·</span>
                <span>Expires {formatDate(announcement.expires_at)}</span>
              </>
            )}
          </div>

          {announcement.description && (
            <div className="text-base text-foreground/80 leading-relaxed mb-4 font-medium">
              {announcement.description}
            </div>
          )}

          {announcement.content && (
            <div
              className="text-sm text-muted leading-relaxed whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: announcement.content }}
            />
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-muted hover:text-foreground border border-border rounded-lg hover:border-foreground/30 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
