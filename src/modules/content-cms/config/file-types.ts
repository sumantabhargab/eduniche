/**
 * Centralized configuration for upload file types.
 *
 * This is the single source of truth used by both the client and the server.
 * Use ALLOWED_EXTENSIONS / ALLOWED_MIME_TYPES / MAX_FILE_SIZE_BYTES for validation.
 *
 * Browsers and operating systems report inconsistent MIME types, especially for
 * plain text formats (.md, .txt, .csv, .rtf). Validation therefore accepts a
 * file when EITHER the extension OR the MIME type is in the allowed set.
 */

export interface FileTypeRule {
  /** Lowercase file extension, including the leading dot (e.g. ".pdf") */
  ext: string;
  /** MIME types that browsers commonly report for this format */
  mime: string[];
  /** Human-readable label used in UI */
  label: string;
}

export const FILE_TYPE_RULES: FileTypeRule[] = [
  // Documents
  { ext: ".pdf", mime: ["application/pdf"], label: "PDF" },
  { ext: ".md", mime: ["text/markdown", "text/x-markdown", "text/plain", ""], label: "Markdown" },
  { ext: ".txt", mime: ["text/plain"], label: "Plain text" },
  { ext: ".doc", mime: ["application/msword"], label: "Word (legacy)" },
  { ext: ".docx", mime: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"], label: "Word" },
  { ext: ".rtf", mime: ["application/rtf", "text/rtf", "text/plain"], label: "Rich text" },

  // Presentations
  { ext: ".ppt", mime: ["application/vnd.ms-powerpoint"], label: "PowerPoint (legacy)" },
  { ext: ".pptx", mime: ["application/vnd.openxmlformats-officedocument.presentationml.presentation"], label: "PowerPoint" },

  // Spreadsheets
  { ext: ".xls", mime: ["application/vnd.ms-excel"], label: "Excel (legacy)" },
  { ext: ".xlsx", mime: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"], label: "Excel" },
  { ext: ".csv", mime: ["text/csv", "application/vnd.ms-excel", "text/plain"], label: "CSV" },

  // Images
  { ext: ".png", mime: ["image/png"], label: "PNG image" },
  { ext: ".jpg", mime: ["image/jpeg", "image/jpg"], label: "JPEG image" },
  { ext: ".jpeg", mime: ["image/jpeg", "image/jpg"], label: "JPEG image" },
  { ext: ".webp", mime: ["image/webp"], label: "WebP image" },
  { ext: ".gif", mime: ["image/gif"], label: "GIF image" },
  { ext: ".svg", mime: ["image/svg+xml"], label: "SVG image" },

  // Archives
  { ext: ".zip", mime: ["application/zip", "application/x-zip-compressed"], label: "ZIP archive" },
];

/** Lowercase extensions allowed for upload, used by the file picker `accept` attribute */
export const ALLOWED_EXTENSIONS: string[] = FILE_TYPE_RULES.map((r) => r.ext);

/** All MIME types accepted by any rule */
export const ALLOWED_MIME_TYPES: string[] = Array.from(
  new Set(FILE_TYPE_RULES.flatMap((r) => r.mime).filter(Boolean))
);

/** Comma-separated `accept` string for <input type="file"> */
export const FILE_INPUT_ACCEPT = [
  ...ALLOWED_EXTENSIONS,
  ...ALLOWED_MIME_TYPES,
].join(",");

/**
 * Maximum upload size for content resources.
 *
 * Set to 200 MB to comfortably accommodate large educational PDFs
 * (textbooks, mock-test bundles, image-rich study material).
 *
 * This is the AUTHORITATIVE limit; if the framework or hosting platform
 * has a lower default body limit, raise it (see next.config.ts bodySizeLimit
 * and any reverse proxy / serverless platform settings).
 */
export const MAX_FILE_SIZE_BYTES = 200 * 1024 * 1024;
export const MAX_FILE_SIZE_MB = MAX_FILE_SIZE_BYTES / (1024 * 1024);

export const STORAGE_BUCKET =
  process.env.NEXT_PUBLIC_CONTENT_BUCKET || "eduniche-content";

/**
 * Accept a file when EITHER its extension OR its MIME type matches an allowed
 * rule. Returns the matched rule, or null when the file is not allowed.
 */
export function matchFileType(filename: string, mimeType: string): FileTypeRule | null {
  const lowerName = filename.toLowerCase();
  const lowerMime = (mimeType || "").toLowerCase();

  // Extension match first — most reliable signal
  const ext = lowerName.includes(".")
    ? lowerName.slice(lowerName.lastIndexOf("."))
    : "";
  const byExt = ext ? FILE_TYPE_RULES.find((r) => r.ext === ext) : null;
  if (byExt) return byExt;

  // Fallback: MIME-only match
  if (lowerMime) {
    const byMime = FILE_TYPE_RULES.find((r) => r.mime.includes(lowerMime));
    if (byMime) return byMime;
  }

  return null;
}

export function formatAllowedTypesHint(): string {
  const labels = FILE_TYPE_RULES.map((r) => r.label).filter(
    (label, i, arr) => arr.indexOf(label) === i
  );
  return `Supported: ${labels.join(", ")}. Max size ${MAX_FILE_SIZE_MB} MB.`;
}
