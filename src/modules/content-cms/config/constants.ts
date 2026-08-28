/**
 * Constants for the Content CMS module.
 */

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

export const MAX_UPLOAD_SIZE_MB = 50;
export const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;
export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/svg+xml",
  "application/zip",
  "application/x-zip-compressed",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export const STORAGE_BUCKET = process.env.NEXT_PUBLIC_CONTENT_BUCKET || "eduniche-content";

export const ITEMS_PER_PAGE = 50;
