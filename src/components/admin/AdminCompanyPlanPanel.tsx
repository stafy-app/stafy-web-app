import { useState, type FormEvent } from 'react'
import { useAdminCompanySubscription, useAdminSetSubscription, useAdminSubscriptionEvents } from '@stafy/hooks/useAdmin'
import {
  AdminSubscriptionChangeInPlanType,
  type AdminSubscriptionChangeIn,
} from '@stafy/api/generated/endpoints/index.schemas'
import { ADMIN_CONTROL, AdminField } from '@stafy/components/admin/ui/AdminField'
import { AdminSheet, AdminSheetSection } from '@stafy/components/admin/ui/AdminSheet'
import { AdminTable } from '@stafy/components/admin/ui/AdminTable'
import { EVENT_LABELS, STATUS_LABELS, formatPlanDate, planLabel } from '@stafy/utils/planLabels'

type PlanChoice = AdminSubscriptionChangeIn['plan_type']

const PLAN_CHOICES: PlanChoice[] = Object.values(AdminSubscriptionChangeInPlanType)

const dateTimeFormatter = new Intl.DateTimeFormat('ro-RO', {
  dateStyle: 'short',
  timeStyle: 'short',
})

export function AdminCompanyPlanPanel({ companyId }: { companyId: number }) {
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

  const current = subscription
    ? `${planLabel(subscription.plan_type)} · ${STATUS_LABELS[subscription.plan_status]} · ${subscription.seats_limit === 0 ? 'fără locuri pentru membri' : `${subscription.seats_used} / ${subscription.seats_limit ?? 'nelimitat'} locuri`}${subscription.plan_expires_at ? ` · expiră ${formatPlanDate(subscription.plan_expires_at)}` : ''}`
    : undefined

  return (
    <>
      <AdminSheet>
        <AdminSheetSection title="Planul acum" caption={current}>
          <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
            <AdminField label="Alege planul">
              <select
                className={`select ${ADMIN_CONTROL}`}
                value={planType}
                onChange={(event) => setPlanType(event.target.value as PlanChoice)}
              >
                {PLAN_CHOICES.map((plan) => (
                  <option key={plan} value={plan}>
                    {planLabel(plan)}
                  </option>
                ))}
              </select>
            </AdminField>
            {isPilot && (
              <AdminField label="Expiră pe">
                <input
                  type="date"
                  className={`input ${ADMIN_CONTROL}`}
                  required
                  value={expiryDate}
                  onChange={(event) => setExpiryDate(event.target.value)}
                />
              </AdminField>
            )}
            <AdminField label="Notă (opțional)" className="min-w-[220px] flex-1">
              <input
                type="text"
                className={`input w-full ${ADMIN_CONTROL}`}
                maxLength={1000}
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </AdminField>
            <button type="submit" className="btn btn-primary" disabled={setSubscription.isPending}>
              Aplică planul
            </button>
          </form>
        </AdminSheetSection>

        <AdminSheetSection title="Istoric" flush>
          <AdminTable>
            <thead>
              <tr>
                <th>Data</th>
                <th>Eveniment</th>
                <th>Plan</th>
                <th className="num">Locuri</th>
                <th>Expiră</th>
                <th>Modificat de</th>
                <th>Notă</th>
              </tr>
            </thead>
            <tbody>
              {events?.data.map((event) => (
                <tr key={event.id}>
                  <td className="whitespace-nowrap tabular-nums">
                    {dateTimeFormatter.format(new Date(event.created_at))}
                  </td>
                  <td>{EVENT_LABELS[event.event_type] ?? event.event_type}</td>
                  <td>{planLabel(event.plan_type)}</td>
                  <td className="num">{event.seats_limit ?? '∞'}</td>
                  <td className="tabular-nums">{event.expires_at ? formatPlanDate(event.expires_at) : '—'}</td>
                  <td>{event.actor}</td>
                  <td>{event.note ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        </AdminSheetSection>
      </AdminSheet>
    </>
  )
}
