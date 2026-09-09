/**
 * PadhaiShuru — Helper to extract authenticated user from a Supabase request.
 * Returns null when no session is present (caller decides between 401 vs anon fallback).
 */

import { createServerClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

export async function getUser(): Promise<User | null> {
  try {
    const supabase = await createServerClient()
    if (!supabase) {
      return null
    }
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user
  } catch {
    return null
  }
}

export async function requireUser(): Promise<{ ok: true; user: User } | { ok: false }> {
  const user = await getUser()
  if (!user) return { ok: false }
  return { ok: true, user }
}

/**
 * Build a stable per-user/per-IP identifier for rate limiting.
 * Prefers the user ID when authenticated; falls back to the request IP.
 */
export function clientIdentifier(userId: string | null, request: Request): string {
  if (userId) return `user:${userId}`
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return `ip:${forwarded ?? 'unknown'}`
}
