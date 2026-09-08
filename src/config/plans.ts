/**
 * PadhaiShuru — Single source of truth for plan definitions.
 *
 * This file is the authoritative reference for:
 *   - Plan IDs used in database enums
 *   - Amounts passed to Razorpay (in paise)
 *   - Duration used by subscription activation
 *   - Feature flags checked by entitlement logic
 *   - UI copy rendered on pricing pages
 *
 * Adding or changing a plan → edit this file → everything else follows.
 */

export type PlanId = 'free' | 'weekly' | 'monthly'

export interface PlanDefinition {
  id: PlanId
  displayName: string
  amountInPaise: number
  currency: 'INR'
  durationDays: number
  isPremium: boolean
  features: string[]
  ctaLabel: string
  popular: boolean
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: 'free',
    displayName: 'Free',
    amountInPaise: 0,
    currency: 'INR',
    durationDays: 0,
    isPremium: false,
    features: [
      'Full PYQ library access',
      'Basic study tracker',
      'Leaderboard participation',
      '5 AI doubts per day',
      'Virtual library demo',
    ],
    ctaLabel: 'Current Plan',
    popular: false,
  },
  weekly: {
    id: 'weekly',
    displayName: 'Weekly',
    amountInPaise: 2000, // INR 20.00
    currency: 'INR',
    durationDays: 7,
    isPremium: true,
    features: [
      'Everything in Free',
      'Unlimited AI doubts',
      'Global study chat',
      'Premium content access',
      'Predicted papers',
      'Advanced analytics',
      'Virtual library full access',
    ],
    ctaLabel: 'Upgrade to Weekly',
    popular: false,
  },
  monthly: {
    id: 'monthly',
    displayName: 'Monthly',
    amountInPaise: 4900, // INR 49.00
    currency: 'INR',
    durationDays: 30,
    isPremium: true,
    features: [
      'Everything in Free',
      'Unlimited AI doubts',
      'Global study chat',
      'Premium content access',
      'Predicted papers',
      'Advanced analytics',
      'Virtual library full access',
      'Save 64% vs weekly',
    ],
    ctaLabel: 'Upgrade to Monthly',
    popular: true,
  },
}

export const PAID_PLAN_IDS: readonly PlanId[] = ['weekly', 'monthly']

export function getPlan(planId: string): PlanDefinition | undefined {
  return PLANS[planId as PlanId]
}

export function formatINR(amountInPaise: number): string {
  const rupees = amountInPaise / 100
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rupees)
}

/**
 * Canonicalize legacy profile.plan values to PlanId.
 *
 * Old profiles.plan enum: ('free', 'weekly_premium', 'monthly_premium')
 * user_subscriptions.plan enum: ('free', 'weekly', 'monthly')
 */
export function legacyPlanToPlanId(legacyPlan: string | null | undefined): PlanId {
  switch (legacyPlan) {
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

export function isPaidPlan(planId: string | null | undefined): boolean {
  return planId !== null && planId !== undefined && PAID_PLAN_IDS.includes(planId as PlanId)
}
