import { useMySubscription } from '@stafy/hooks/useSubscription'
import { formatPlanDate } from '@stafy/utils/planLabels'

/**
 * Persistent plan warning under the topbar for owners/managers (the query is disabled for anyone
 * else, so employees and admins never see it). Read-only wins over "expiring soon".
 */
export function PlanStatusBanner() {
  const { data: subscription } = useMySubscription()

  if (!subscription) return null

  if (subscription.plan_status === 'read_only') {
    return (
      <div role="alert" className="alert alert-error rounded-none text-sm">
        Planul companiei a expirat — pontajul angajaților merge în continuare, dar restul modificărilor sunt blocate.
        Deschide Setări → Abonament.
      </div>
    )
  }

  if (subscription.expiring_soon && subscription.plan_expires_at) {
    return (
      <div role="alert" className="alert alert-warning rounded-none text-sm">
        Planul companiei expiră pe {formatPlanDate(subscription.plan_expires_at)}. Deschide Setări → Abonament.
      </div>
    )
  }

  return null
}
