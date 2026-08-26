/**
 * UTM attribution — parse, store, and retrieve campaign parameters.
 */

export interface UTMContext {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
}

export interface AttributionData extends UTMContext {
  referrer: string | null;
  firstTouch: UTMContext;
  lastTouch: UTMContext;
}

/**
 * Parse UTM parameters from a URL string.
 */
export function parseUTM(urlString: string): UTMContext {
  try {
    const url = new URL(urlString);
    return {
      utm_source: url.searchParams.get("utm_source"),
      utm_medium: url.searchParams.get("utm_medium"),
      utm_campaign: url.searchParams.get("utm_campaign"),
      utm_content: url.searchParams.get("utm_content"),
      utm_term: url.searchParams.get("utm_term"),
    };
  } catch {
    return {
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_content: null,
      utm_term: null,
    };
  }
}

/**
 * Parse UTM parameters from the current browser URL.
 */
export function parseUTMFromCurrentUrl(): UTMContext {
  if (typeof window === "undefined") {
    return {
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_content: null,
      utm_term: null,
    };
  }
  return parseUTM(window.location.href);
}

/**
 * Get source category for grouping analytics.
 */
export function categorizeSource(utmSource: string | null): string {
  if (!utmSource) return "direct";
  const lower = utmSource.toLowerCase();
  if (["instagram", "facebook", "ig", "fb"].some((s) => lower.includes(s)))
    return "instagram";
  if (["whatsapp", "wa"].some((s) => lower.includes(s))) return "whatsapp";
  if (["youtube", "yt"].some((s) => lower.includes(s))) return "youtube";
  if (["linkedin", "li"].some((s) => lower.includes(s))) return "linkedin";
  if (["google", "organic", "bing", "search"].some((s) => lower.includes(s)))
    return "organic";
  if (["email", "newsletter", "mail"].some((s) => lower.includes(s)))
    return "email";
  return "other";
}

/**
 * Storage keys for attribution data.
 */
const STORAGE_KEY = "eduneuro_attribution";
const FIRST_TOUCH_KEY = "eduneuro_first_touch";

/**
 * Save attribution data to sessionStorage.
 */
export function saveAttribution(data: UTMContext): void {
  if (typeof sessionStorage === "undefined") return;
  const hasUTM = Object.values(data).some((v) => v !== null);
  if (!hasUTM) return;

  const existing = sessionStorage.getItem(STORAGE_KEY);
  const current: UTMContext = existing ? JSON.parse(existing) : {};

  // If no first touch recorded, this IS the first touch
  const firstTouchStr = sessionStorage.getItem(FIRST_TOUCH_KEY);
  if (!firstTouchStr) {
    sessionStorage.setItem(FIRST_TOUCH_KEY, JSON.stringify(data));
  }

  // Merge: last-touch wins
  const merged = { ...current, ...data };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
}

/**
 * Get current session attribution.
 */
export function getAttribution(): UTMContext {
  if (typeof sessionStorage === "undefined") {
    return {
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_content: null,
      utm_term: null,
    };
  }
  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (!stored) return parseUTMFromCurrentUrl();
  return JSON.parse(stored);
}

/**
 * Get first-touch attribution.
 */
export function getFirstTouchAttribution(): UTMContext {
  if (typeof sessionStorage === "undefined") {
    return {
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_content: null,
      utm_term: null,
    };
  }
  const stored = sessionStorage.getItem(FIRST_TOUCH_KEY);
  if (!stored) return parseUTMFromCurrentUrl();
  return JSON.parse(stored);
}

/**
 * Get combined attribution data (current, first-touch).
 */
export function getFullAttribution(): AttributionData {
  const current = getAttribution();
  return {
    ...current,
    referrer: typeof document !== "undefined" ? document.referrer || null : null,
    firstTouch: getFirstTouchAttribution(),
    lastTouch: current,
  };
}
