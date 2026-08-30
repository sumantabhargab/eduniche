/**
 * Constants for the Content CMS module.
 *
 * ALLOWED_MIME_TYPES, ALLOWED_EXTENSIONS, MAX_FILE_SIZE_BYTES and friends are
 * imported from ../config/file-types — the single source of truth for upload
 * rules. Do NOT define them here.
 */

import {
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
  FILE_INPUT_ACCEPT,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
  STORAGE_BUCKET,
  formatAllowedTypesHint,
} from "../config/file-types";

export const RESOURCE_TYPES: { value: string; label: string }[] = [
  { value: "notes", label: "Notes" },
  { value: "pyqs", label: "Previous Year Questions" },
  { value: "books", label: "Books" },
  { value: "practice", label: "Practice" },
  { value: "other", label: "Other" },
];

export const VISIBILITY_OPTIONS: { value: string; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

export const ACCESS_TIER_OPTIONS: { value: string; label: string }[] = [
  { value: "free", label: "Free" },
  { value: "premium", label: "Premium" },
];

export const BRANCHES: { id: string; name: string; shortName: string }[] = [
  { id: "cse", name: "Computer Science & Engineering", shortName: "CSE" },
  { id: "ece", name: "Electronics & Communication Engineering", shortName: "ECE" },
  { id: "ee", name: "Electrical Engineering", shortName: "EE" },
  { id: "me", name: "Mechanical Engineering", shortName: "ME" },
  { id: "ce", name: "Civil Engineering", shortName: "CE" },
  { id: "in", name: "Instrumentation Engineering", shortName: "IN" },
  { id: "pi", name: "Production & Industrial Engineering", shortName: "PI" },
  { id: "da", name: "Data Science & AI", shortName: "DA" },
];

export const DEFAULT_CATEGORIES = ["Notes", "PYQs", "Books", "Practice", "Other"];

// Re-export from file-types for convenience
export {
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  FILE_INPUT_ACCEPT,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
  STORAGE_BUCKET,
  formatAllowedTypesHint,
};
