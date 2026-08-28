/**
 * Input validation utilities for the Content CMS.
 * Uses simple runtime checks — no external validation library needed.
 */

const MAX_NAME = 100;
const MAX_FILENAME = 255;
const MAX_PATH = 500;
const MAX_MIME = 100;
const MAX_TAG = 50;
const MAX_TAGS = 20;
const MAX_DESC = 2000;
const MAX_SEARCH = 200;
const MAX_FILE_SIZE = 200 * 1024 * 1024;

const INVALID_NAME_CHARS = /[<>:"/\\|?*\x00-\x1f]/;

export function validateFolderName(name: unknown): { valid: true; value: string } | { valid: false; error: string } {
  if (typeof name !== "string") return { valid: false, error: "Name is required." };
  const trimmed = name.trim();
  if (trimmed.length === 0) return { valid: false, error: "Name is required." };
  if (trimmed.length > MAX_NAME) return { valid: false, error: `Name must be under ${MAX_NAME} characters.` };
  if (INVALID_NAME_CHARS.test(trimmed)) return { valid: false, error: "Name contains invalid characters." };
  return { valid: true, value: trimmed };
}

export function validateResourceName(name: unknown): { valid: true; value: string } | { valid: false; error: string } {
  if (typeof name !== "string") return { valid: false, error: "Name is required." };
  const trimmed = name.trim();
  if (trimmed.length === 0) return { valid: false, error: "Name is required." };
  if (trimmed.length > MAX_NAME) return { valid: false, error: `Name must be under ${MAX_NAME} characters.` };
  return { valid: true, value: trimmed };
}

export function validateUuid(value: unknown, field = "ID"): { valid: true; value: string } | { valid: false; error: string } {
  if (typeof value !== "string") return { valid: false, error: `${field} is required.` };
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    return { valid: false, error: `Invalid ${field}.` };
  }
  return { valid: true, value };
}

export function validateVisibility(value: unknown): { valid: true; value: string } | { valid: false; error: string } {
  if (value === "draft" || value === "published" || value === "archived") {
    return { valid: true, value };
  }
  return { valid: false, error: "Visibility must be draft, published, or archived." };
}

export function validateTags(tags: unknown): { valid: true; value: string[] } | { valid: false; error: string } {
  if (!Array.isArray(tags)) return { valid: false, error: "Tags must be an array." };
  if (tags.length > MAX_TAGS) return { valid: false, error: `Maximum ${MAX_TAGS} tags allowed.` };
  for (const tag of tags) {
    if (typeof tag !== "string") return { valid: false, error: "Each tag must be a string." };
    if (tag.length > MAX_TAG) return { valid: false, error: `Each tag must be under ${MAX_TAG} characters.` };
  }
  return { valid: true, value: tags.map((t) => t.trim().toLowerCase()).filter(Boolean) };
}

export function validateSearchQuery(q: string, limit = 50) {
  const trimmed = q.trim().slice(0, MAX_SEARCH);
  const safeLimit = Math.min(Math.max(1, limit), 100);
  return { q: trimmed, limit: safeLimit };
}

export function validateFileUpload(file: File): { valid: true } | { valid: false; error: string } {
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE;
  const ALLOWED_MIME_TYPES = [
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
    "application/octet-stream",
  ];
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: `File exceeds ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB limit.` };
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: `File type "${file.type}" is not allowed.` };
  }
  return { valid: true };
}
