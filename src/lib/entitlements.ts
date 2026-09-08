/**
 * PadhaiShuru — Entitlement / access-control utilities.
 *
 * Single authoritative check for whether a user has premium access.
 * Checks BOTH the profile plan (for admin-granted premium) AND active subscription.
 *
 * All API routes should import from here instead of duplicating the check.
 */

import { createServerClient } from '@/lib/supabase/server'
import type { PlanId } from '@/config/plans'

export interface SubscriptionInfo {
  plan: PlanId
  status: 'active' | 'expired' | 'cancelled' | 'pending' | 'failed'
  expiresAt: string | null
  startedAt: string | null
}

export interface EntitlementResult {
  isPremium: boolean
  plan: PlanId
  subscription: SubscriptionInfo | null
}

const ACTIVE_SUBSCRIPTION_STATUSES = ['active'] as const

/**
 * Return the user's current entitlement.
 * @param userId — Supabase auth user ID
 */
export async function getEntitlement(userId: string): Promise<EntitlementResult> {
  const supabase = createServerClient()

  // Parallel-fetch profile and subscription
  const [{ data: profile }, { data: subRows }] = await Promise.all([
    supabase.from('profiles').select('plan').eq('id', userId).maybeSingle(),
    supabase
      .from('user_subscriptions')
      .select('plan, status, expires_at, started_at')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const profilePlanId = (profile?.plan as string | null) ?? null
  const canonicalPlan: PlanId = legacyToPlanId(profilePlanId)
  const profileIsPremium = canonicalPlan !== 'free'

  const sub = subRows as { plan: string; status: string; expires_at: string | null; started_at: string | null } | null
  const subIsActive = !!sub
    && ACTIVE_SUBSCRIPTION_STATUSES.includes(sub.status as 'active')
    && (!sub.expires_at || new Date(sub.expires_at) > new Date())

  const isPremium = profileIsPremium || subIsActive

  let effectivePlan: PlanId = 'free'
  if (isPremium) {
    if (subIsActive) {
      effectivePlan = legacyToPlanId(sub.plan)
    } else if (profileIsPremium) {
      effectivePlan = canonicalPlan
    }
  }

  return {
    isPremium,
    plan: effectivePlan,
    subscription: sub
      ? {
          plan: legacyToPlanId(sub.plan),
          status: sub.status as SubscriptionInfo['status'],
          expiresAt: sub.expires_at,
          startedAt: sub.started_at,
        }
      : null,
  }
}

/**
 * Require premium. Throws a typed error (not a generic Error) so API handlers
 * can return a structured response.
 */
export class PremiumRequiredError extends Error {
  constructor() {
    super('Premium subscription required')
    this.name = 'PremiumRequiredError'
  }
}

export async function requirePremium(userId: string): Promise<EntitlementResult> {
  const result = await getEntitlement(userId)
  if (!result.isPremium) {
    throw new PremiumRequiredError()
  }
  return result
}

/**
 * Map legacy profile plan enums to canonical PlanId.
 *
 * profiles.plan CHECK ('free', 'weekly_premium', 'monthly_premium')
 * user_subscriptions.plan CHECK ('free', 'weekly', 'monthly')
 */
function legacyToPlanId(legacy: string | null | undefined): PlanId {
  switch (legacy) {
    case 'weekly':
    case 'weekly_premium':
      return 'weekly'
    case 'monthly':
    case 'monthly_premium':
      return 'monthly'
    case 'free':
    default:
      return 'free'
  }
}
