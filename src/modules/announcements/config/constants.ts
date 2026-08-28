/**
 * Constants for the Announcements module.
 *
 * Categories, priorities, and branch options are intentionally simple
 * — they map to the existing content-folder branch values.
 */

import type {
  AnnouncementPriority,
  AnnouncementStatus,
  AnnouncementType,
  TargetOption,
} from "../types";

// ─── Type / category options ──────────────────────────────────────────────────

export const ANNOUNCEMENT_TYPES: { value: AnnouncementType; label: string }[] =
  [
    { value: "general", label: "General" },
    { value: "library", label: "Library" },
    { value: "exam", label: "Exam" },
    { value: "mock_test", label: "Mock Test" },
    { value: "maintenance", label: "Maintenance" },
    { value: "important", label: "Important" },
  ];

// ─── Priority options ─────────────────────────────────────────────────────────

export const ANNOUNCEMENT_PRIORITIES: {
  value: AnnouncementPriority;
  label: string;
  color: string;
}[] = [
  { value: "low", label: "Low", color: "#6B6560" },
  { value: "normal", label: "Normal", color: "#B8710E" },
  { value: "high", label: "High", color: "#C43E3E" },
  { value: "urgent", label: "Urgent", color: "#C43E3E" },
];

// ─── Status options ───────────────────────────────────────────────────────────

export const ANNOUNCEMENT_STATUSES: {
  value: AnnouncementStatus;
  label: string;
}[] = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

// ─── Target options ───────────────────────────────────────────────────────────
// Reuses the same branch identifiers as content_folders. Adding/removing a
// branch here is the only place you need to touch — UI derives from this list.

export const TARGET_OPTIONS: TargetOption[] = [
  { value: "all", label: "All users" },
  { value: "cse", label: "GATE CSE" },
  { value: "da", label: "GATE DA" },
  { value: "ece", label: "GATE ECE" },
  { value: "ee", label: "GATE EE" },
  { value: "me", label: "GATE Mechanical" },
  { value: "ce", label: "GATE CE" },
  { value: "in", label: "GATE IN" },
  { value: "pi", label: "GATE PI" },
];

export function getTargetLabel(value: string | null | undefined): string {
  if (!value || value === "all") return "All users";
  return TARGET_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

// ─── UI copy ──────────────────────────────────────────────────────────────────

export const ANNOUNCEMENT_LIMITS = {
  TITLE_MAX: 140,
  DESCRIPTION_MAX: 280,
  CONTENT_MAX: 8000,
  PAGE_SIZE: 20,
  PANEL_LIMIT: 8,
} as const;

// ─── Realtime channel name ────────────────────────────────────────────────────

export const ANNOUNCEMENTS_REALTIME_CHANNEL = "announcements:public";