import { useState, type FormEvent } from 'react'
import {
  useAdminCompanySubscription,
  useAdminSetSubscription,
  useAdminSubscriptionEvents,
} from '@stafy/hooks/useAdmin'
import {
  AdminSubscriptionChangeInPlanType,
  type AdminSubscriptionChangeIn,
} from '@stafy/api/generated/endpoints/index.schemas'
import { EVENT_LABELS, STATUS_LABELS, formatPlanDate, planLabel } from '@stafy/utils/planLabels'

type PlanChoice = AdminSubscriptionChangeIn['plan_type']

const PLAN_CHOICES: PlanChoice[] = Object.values(AdminSubscriptionChangeInPlanType)

const dateTimeFormatter = new Intl.DateTimeFormat('ro-RO', { dateStyle: 'short', timeStyle: 'short' })

interface AdminCompanyPlanPanelProps {
  companyId: number
  companyName: string
  onClose: () => void
}

export function AdminCompanyPlanPanel({ companyId, companyName, onClose }: AdminCompanyPlanPanelProps) {
  const { data: subscription } = useAdminCompanySubscription(companyId)
  const { data: events } = useAdminSubscriptionEvents(companyId)
  const setSubscription = useAdminSetSubscription(companyId)

  const [planType, setPlanType] = useState<PlanChoice>('small')
  const [expiryDate, setExpiryDate] = useState('')
  const [note, setNote] = useState('')

  const isPilot = planType === 'pilot'

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubscription.mutate(
      {
        plan_type: planType,
        // End of the chosen day, local time — the backend needs an instant in the future.
        expires_at: isPilot && expiryDate ? new Date(`${expiryDate}T23:59:59`).toISOString() : null,
        note: note.trim() || null,
      },
      {
        onSuccess: () => {
          setNote('')
          setExpiryDate('')
        },
      },
    )
  }

  return (
    <div className="flex flex-col gap-5 rounded-[var(--radius-md)] border border-[var(--color-line)] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold text-[var(--color-ink)]">{companyName}</h3>
          {subscription && (
            <p className="text-[13px] text-[var(--color-ink-muted)]">
              {planLabel(subscription.plan_type)} · {STATUS_LABELS[subscription.plan_status]} ·{' '}
              {subscription.seats_used} / {subscription.seats_limit ?? 'nelimitat'} locuri
              {subscription.plan_expires_at && ` · expiră ${formatPlanDate(subscription.plan_expires_at)}`}
            </p>
          )}
        </div>
        <button type="button" className="btn btn-sm btn-ghost" onClick={onClose}>
          Închide
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-[12px] text-[var(--color-ink-soft)]">
            Plan
            <select
              className="select select-sm"
              value={planType}
              onChange={(event) => setPlanType(event.target.value as PlanChoice)}
            >
              {PLAN_CHOICES.map((plan) => (
                <option key={plan} value={plan}>
                  {planLabel(plan)}
                </option>
              ))}
            </select>
          </label>
          {isPilot && (
            <label className="flex flex-col gap-1 text-[12px] text-[var(--color-ink-soft)]">
              Expiră pe
              <input
                type="date"
                className="input input-sm"
                required
                value={expiryDate}
                onChange={(event) => setExpiryDate(event.target.value)}
              />
            </label>
          )}
        </div>
        <label className="flex flex-col gap-1 text-[12px] text-[var(--color-ink-soft)]">
          Notă (opțional)
          <input
            type="text"
            className="input input-sm w-full"
            maxLength={1000}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </label>
        <div>
          <button type="submit" className="btn btn-sm btn-primary" disabled={setSubscription.isPending}>
            Aplică planul
          </button>
        </div>
      </form>

      <div className="flex flex-col gap-2">
        <h4 className="text-[13px] font-semibold text-[var(--color-ink)]">Istoric</h4>
        <div className="overflow-x-auto">
          <table className="table table-sm">
            <thead>
              <tr>
                <th>Data</th>
                <th>Eveniment</th>
                <th>Plan</th>
                <th>Locuri</th>
                <th>Expiră</th>
                <th>Actor</th>
                <th>Notă</th>
              </tr>
            </thead>
            <tbody>
              {events?.data.map((event) => (
                <tr key={event.id}>
                  <td className="whitespace-nowrap">{dateTimeFormatter.format(new Date(event.created_at))}</td>
                  <td>{EVENT_LABELS[event.event_type] ?? event.event_type}</td>
                  <td>{planLabel(event.plan_type)}</td>
                  <td>{event.seats_limit ?? '∞'}</td>
                  <td>{event.expires_at ? formatPlanDate(event.expires_at) : '—'}</td>
                  <td>{event.actor}</td>
                  <td>{event.note ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
