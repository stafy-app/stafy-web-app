import type { SubscriptionOut } from '@stafy/api/generated/endpoints/index.schemas'

/**
 * Display labels for the backend's plan values (`plan_type`). One place, so renaming a tier in the
 * UI never touches a component. Seat limits mirror stafy-backend's `PLAN_SEAT_LIMITS` for the
 * picker's descriptions only — the backend stays the source of truth for enforcement.
 */
export const PLAN_LABELS: Record<string, string> = {
  trial: 'Trial',
  pilot: 'Pilot',
  solo: 'Solo',
  small: 'Mic',
  standard: 'Standard',
  large: 'Mare',
}

export const PAID_PLANS = ['small', 'standard', 'large'] as const

export const PAID_PLAN_SEATS: Record<(typeof PAID_PLANS)[number], number> = {
  small: 5,
  standard: 15,
  large: 30,
}

export const STATUS_LABELS: Record<string, string> = {
  active: 'Activ',
  read_only: 'Doar citire',
}

export const EVENT_LABELS: Record<string, string> = {
  trial_started: 'Trial început',
  solo_assigned: 'Plan Solo atribuit',
  pilot_granted: 'Pilot acordat',
  pilot_extended: 'Pilot extins',
  upgraded: 'Upgrade',
  downgraded: 'Downgrade',
  expired_to_read_only: 'Expirat (doar citire)',
  reactivated: 'Reactivat',
}

export function planLabel(planType: string): string {
  return PLAN_LABELS[planType] ?? planType
}

export function formatPlanDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ro-RO', { day: '2-digit', month: 'long', year: 'numeric' })
}

/**
 * What an owner may pick without an admin — mirrors stafy-backend's `_owner_may_switch`: `solo`
 * from anywhere except an active pilot, and a different paid plan only once already on one. The
 * backend re-checks and answers 409 `plan_change_not_allowed` otherwise.
 */
export function ownerPlanOptions(subscription: SubscriptionOut): {
  canPickSolo: boolean
  paidOptions: (typeof PAID_PLANS)[number][]
} {
  const { plan_type: type, plan_status: status } = subscription
  const onPaid = (PAID_PLANS as readonly string[]).includes(type)
  return {
    canPickSolo: type !== 'solo' && (type !== 'pilot' || status === 'read_only'),
    paidOptions: onPaid && status === 'active' ? PAID_PLANS.filter((plan) => plan !== type) : [],
  }
}
