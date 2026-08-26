/**
 * Anonymous identity — generate and persist pseudonymous user identifiers.
 */

const ANONYMOUS_ID_COOKIE = "eduneuro_anon_id";
const ANONYMOUS_ID_LENGTH = 16;
const CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";

export function generateAnonymousId(): string {
  let id = "";
  const array = new Uint8Array(ANONYMOUS_ID_LENGTH);
  crypto.getRandomValues(array);
  for (let i = 0; i < ANONYMOUS_ID_LENGTH; i++) {
    id += CHARS[array[i] % CHARS.length];
  }
  return `anon_${id}`;
}

export function getAnonymousIdFromCookie(cookieHeader: string): string | null {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(";");
  for (const cookie of cookies) {
    const trimmed = cookie.trim();
    if (trimmed.startsWith(`${ANONYMOUS_ID_COOKIE}=`)) {
      const value = trimmed.split("=").slice(1).join("=");
      return value || null;
    }
  }
  return null;
}

export function getOrCreateAnonymousId(
  cookieHeader: string
): { anonymousId: string; isNew: boolean } {
  const existing = getAnonymousIdFromCookie(cookieHeader);
  if (existing && existing.startsWith("anon_") && existing.length > 10) {
    return { anonymousId: existing, isNew: false };
  }
  return { anonymousId: generateAnonymousId(), isNew: true };
}

export function generateSessionId(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}
