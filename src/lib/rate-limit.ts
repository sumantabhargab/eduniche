/**
 * Rate limiting utility for API routes.
 * Uses in-memory store with cleanup.
 */

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
  key?: string;
}

export function checkRateLimit(options: RateLimitOptions, identifier: string): { allowed: boolean; remaining: number } {
  const key = options.key ? `${options.key}:${identifier}` : identifier;
  const now = Date.now();

  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true, remaining: options.maxRequests - 1 };
  }

  if (entry.count >= options.maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: options.maxRequests - entry.count };
}

// Cleanup old entries periodically
if (typeof globalThis !== 'undefined' && !(globalThis as any).__rateLimitCleanupScheduled) {
  (globalThis as any).__rateLimitCleanupScheduled = true;
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitMap) {
      if (now > entry.resetAt + 60000) {
        rateLimitMap.delete(key);
      }
    }
  }, 60000);
}

export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0]?.trim() || realIp || 'unknown';
  return ip;
}
