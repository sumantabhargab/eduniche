"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Announcement, AnnouncementStatus } from "@/modules/announcements/types";
import {
  ANNOUNCEMENT_TYPES,
  ANNOUNCEMENT_PRIORITIES,
  ANNOUNCEMENT_STATUSES,
  TARGET_OPTIONS,
  ANNOUNCEMENT_LIMITS,
  getTargetLabel,
} from "@/modules/announcements/config/constants";
import { createAnnouncement, updateAnnouncement } from "@/modules/announcements/services/announcements";
import { getAnnouncementsSupabase } from "@/modules/announcements/services/supabase";

interface AnnouncementEditorProps {
  initial?: Announcement;
}

export default function AnnouncementEditor({ initial }: AnnouncementEditorProps) {
  const router = useRouter();
  const isEdit = !!initial;

  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [content, setContent] = useState(initial?.content || "");
  const [type, setType] = useState<typeof ANNOUNCEMENT_TYPES[number]["value"]>(
    initial?.type || "general"
  );
  const [priority, setPriority] = useState<typeof ANNOUNCEMENT_PRIORITIES[number]["value"]>(
    initial?.priority || "normal"
  );
  const [status, setStatus] = useState<AnnouncementStatus>(initial?.status || "draft");
  const [targetType, setTargetType] = useState<"all" | "branch">(
    initial?.target_type === "branch" ? "branch" : "all"
  );
  const [targetValue, setTargetValue] = useState(initial?.target_value || "");
  const [expiresAt, setExpiresAt] = useState(
    initial?.expires_at
      ? new Date(initial.expires_at).toISOString().slice(0, 16)
      : ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validate(): string | null {
    if (!title.trim()) return "Title is required.";
    if (title.length > ANNOUNCEMENT_LIMITS.TITLE_MAX) {
      return `Title must be ${ANNOUNCEMENT_LIMITS.TITLE_MAX} characters or fewer.`;
    }
    if (description && description.length > ANNOUNCEMENT_LIMITS.DESCRIPTION_MAX) {
      return `Description must be ${ANNOUNCEMENT_LIMITS.DESCRIPTION_MAX} characters or fewer.`;
    }
    if (content && content.length > ANNOUNCEMENT_LIMITS.CONTENT_MAX) {
      return `Content must be ${ANNOUNCEMENT_LIMITS.CONTENT_MAX} characters or fewer.`;
    }
    if (targetType === "branch" && !targetValue) {
      return "Please select a target branch.";
    }
    return null;
  }

  async function handleSave() {
    setError(null);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    try {
      const input = {
        title: title.trim(),
        description: description.trim() || null,
        content: content.trim() || null,
        type,
        priority,
        status,
        target_type: targetType,
        target_value: targetType === "branch" ? targetValue : null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      };

      if (isEdit && initial) {
        const { error } = await updateAnnouncement(initial.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          content: content.trim() || undefined,
          type,
          priority,
          status,
          target_type: targetType,
          target_value: targetType === "branch" ? targetValue : null,
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        });
        if (error) {
          setError(error);
          return;
        }
        router.push("/admin/announcements");
      } else {
        const client = getAnnouncementsSupabase();
        const { data: { user } } = (await client?.auth.getUser().catch(() => ({ data: { user: null } }))) ?? { data: { user: null } };
        if (!user) {
          setError("You must be logged in to create an announcement.");
          return;
        }
        const { data, error } = await createAnnouncement({
          title: title.trim(),
          description: description.trim() || undefined,
          content: content.trim() || undefined,
          type,
          priority,
          status,
          target_type: targetType,
          target_value: targetType === "branch" ? targetValue : null,
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        }, user.id);
        if (error || !data) {
          setError(error || "Failed to create announcement");
          return;
        }
        router.push("/admin/announcements");
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <a
          href="/admin/announcements"
          className="text-sm text-muted hover:text-foreground transition-colors inline-flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Back to announcements
        </a>
        <h1 className="text-2xl font-serif text-foreground mt-2">
          {isEdit ? "Edit Announcement" : "New Announcement"}
        </h1>
      </div>

      <div className="space-y-6">
        {/* Status row */}
        <div className="bg-background-alt border border-border rounded-xl p-4">
          <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-2">
            Status
          </label>
          <div className="flex gap-2">
            {ANNOUNCEMENT_STATUSES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setStatus(s.value)}
                className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                  status === s.value
                    ? "bg-accent text-background border-accent"
                    : "bg-background border-border text-muted hover:text-foreground hover:border-foreground/30"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted mt-2">
            {status === "published"
              ? "Will be visible to all users matching the target."
              : status === "draft"
                ? "Saved but not visible to users."
                : "Hidden from users but kept for reference."}
          </p>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-2">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. New Mock Test Released"
            maxLength={ANNOUNCEMENT_LIMITS.TITLE_MAX}
            className="w-full px-3 py-2 text-base bg-background border border-border rounded-lg focus:outline-none focus:border-accent"
          />
          <p className="text-xs text-muted mt-1">
            {title.length}/{ANNOUNCEMENT_LIMITS.TITLE_MAX}
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-2">
            Short description (optional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A one-line summary that appears in the notification list"
            maxLength={ANNOUNCEMENT_LIMITS.DESCRIPTION_MAX}
            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:border-accent"
          />
          <p className="text-xs text-muted mt-1">
            {description.length}/{ANNOUNCEMENT_LIMITS.DESCRIPTION_MAX}
          </p>
        </div>

        {/* Content */}
        <div>
          <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-2">
            Full content (optional, HTML supported)
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Full announcement body..."
            maxLength={ANNOUNCEMENT_LIMITS.CONTENT_MAX}
            rows={8}
            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:border-accent font-mono"
          />
          <p className="text-xs text-muted mt-1">
            {content.length}/{ANNOUNCEMENT_LIMITS.CONTENT_MAX}
          </p>
        </div>

        {/* Type, Priority */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-2">
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as typeof type)}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:border-accent"
            >
              {ANNOUNCEMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-2">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as typeof priority)}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:border-accent"
            >
              {ANNOUNCEMENT_PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Target */}
        <div className="bg-background-alt border border-border rounded-xl p-4">
          <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-3">
            Audience
          </label>
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => {
                setTargetType("all");
                setTargetValue("");
              }}
              className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                targetType === "all"
                  ? "bg-accent text-background border-accent"
                  : "bg-background border-border text-muted hover:text-foreground hover:border-foreground/30"
              }`}
            >
              All users
            </button>
            <button
              type="button"
              onClick={() => setTargetType("branch")}
              className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                targetType === "branch"
                  ? "bg-accent text-background border-accent"
                  : "bg-background border-border text-muted hover:text-foreground hover:border-foreground/30"
              }`}
            >
              Specific branch
            </button>
          </div>
          {targetType === "branch" && (
            <div className="flex flex-wrap gap-2">
              {TARGET_OPTIONS.filter((t) => t.value !== "all").map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTargetValue(t.value)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                    targetValue === t.value
                      ? "bg-accent text-background border-accent"
                      : "bg-background border-border text-muted hover:text-foreground hover:border-foreground/30"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
          {targetType === "branch" && targetValue && (
            <p className="text-xs text-muted mt-3">
              Will be shown to users in <strong>{getTargetLabel(targetValue)}</strong> only.
            </p>
          )}
        </div>

        {/* Expiration */}
        <div>
          <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-2">
            Expires at (optional)
          </label>
          <input
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:border-accent"
          />
          <p className="text-xs text-muted mt-1">
            Announcement will be hidden from users after this time. Leave blank for no expiration.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 py-3 bg-error/10 border border-error/30 rounded-lg text-sm text-error">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2 border-t border-border">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 text-sm font-medium text-background bg-accent rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            {isSaving ? "Saving..." : isEdit ? "Save changes" : "Create announcement"}
          </button>
          <a
            href="/admin/announcements"
            className="px-5 py-2 text-sm text-muted hover:text-foreground border border-border rounded-lg hover:border-foreground/30 transition-colors"
          >
            Cancel
          </a>
        </div>
      </div>
    </div>
  );
}