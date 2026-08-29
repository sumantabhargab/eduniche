/**
 * Input validation utilities for the Content CMS.
 * Uses simple runtime checks — no external validation library needed.
 *
 * File-type validation delegates to ../config/file-types which is the single
 * source of truth for both allowed extensions and allowed MIME types.
 */

import {
  MAX_FILE_SIZE_BYTES,
  matchFileType,
  formatAllowedTypesHint,
} from "../config/file-types";

const MAX_NAME = 100;
const MAX_FILENAME = 255;
const MAX_PATH = 500;
const MAX_MIME = 100;
const MAX_TAG = 50;
const MAX_TAGS = 20;
const MAX_DESC = 2000;
const MAX_SEARCH = 200;

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

export type FileValidationResult =
  | { valid: true }
  | { valid: false; error: string };

/**
 * Validate an uploaded file using both extension and MIME type.
 *
 * Browsers and OSes report inconsistent MIME types for plain-text formats
 * (.md → text/plain, .csv → text/plain, .rtf → application/rtf). This
 * function accepts a file when EITHER its extension OR its MIME type matches
 * an allowed rule defined in ../config/file-types.
 */
export function validateFileUpload(file: File): FileValidationResult {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File "${file.name}" exceeds the ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB limit.`,
    };
  }

  const match = matchFileType(file.name, file.type);
  if (!match) {
    return {
      valid: false,
      error: `File type not supported. ${formatAllowedTypesHint()}`,
    };
  }

  return { valid: true };
}
