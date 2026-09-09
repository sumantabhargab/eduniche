/**
 * PadhaiShuru — Distributed rate limiter backed by Supabase.
 *
 * Uses an atomic SQL RPC so the check is safe across serverless instances
 * (each Next.js function invocation shares the same Postgres row).
 */

import { createServerClient } from '@/lib/supabase/server'

export interface RateLimitConfig {
  windowSeconds: number
  maxRequests: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
}

/**
 * Call the `rate_limit_check` Postgres function.
 *
 * The function atomically increments a counter if within the window,
 * returning the new count and whether the call is allowed.
 *
 * On RPC error (e.g. function doesn't exist yet), we fail OPEN to avoid
 * blocking all traffic — log and return allowed=true.
 */
export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  try {
    const supabase = await createServerClient()
    if (!supabase) {
      return buildOpenResult(config)
    }
    const { data, error } = await supabase.rpc('rate_limit_check', {
      p_identifier: identifier,
      p_endpoint: endpoint,
      p_window_seconds: config.windowSeconds,
      p_max_requests: config.maxRequests,
    })

    if (error) {
      console.error('[rate-limit] RPC error, failing open:', error.message)
      return buildOpenResult(config)
    }

    const row = (data as { allowed: boolean; count: number; reset_at: string } | null) ?? null
    if (!row) {
      return buildOpenResult(config)
    }

    return {
      allowed: row.allowed,
      remaining: Math.max(0, config.maxRequests - row.count),
      resetAt: new Date(row.reset_at),
    }
  } catch (err) {
    console.error('[rate-limit] unexpected error, failing open:', err)
    return buildOpenResult(config)
  }
}

function buildOpenResult(config: RateLimitConfig): RateLimitResult {
  const now = Math.floor(Date.now() / 1000)
  const windowEnd = now + config.windowSeconds
  return { allowed: true, remaining: config.maxRequests, resetAt: new Date(windowEnd * 1000) }
}

// ---------- Convenience endpoints ----------

export async function rateLimitAI(identifier: string, isPremium: boolean): Promise<RateLimitResult> {
  return checkRateLimit(identifier, 'ai_doubt', {
    windowSeconds: 60,
    maxRequests: isPremium ? 20 : 10,
  })
}

export async function rateLimitChat(identifier: string): Promise<RateLimitResult> {
  return checkRateLimit(identifier, 'chat', {
    windowSeconds: 60,
    maxRequests: 30,
  })
}

export async function rateLimitWrite(identifier: string): Promise<RateLimitResult> {
  return checkRateLimit(identifier, 'write', {
    windowSeconds: 60,
    maxRequests: 20,
  })
}

export async function rateLimitGeneral(identifier: string): Promise<RateLimitResult> {
  return checkRateLimit(identifier, 'general', {
    windowSeconds: 60,
    maxRequests: 60,
  })
}
