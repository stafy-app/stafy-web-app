import { useState } from 'react'
import { useProfile } from '@stafy/hooks/useProfile'
import { useChangeMyPlan, useMySubscription } from '@stafy/hooks/useSubscription'
import type { SubscriptionChangeIn } from '@stafy/api/generated/endpoints/index.schemas'
import {
  PAID_PLAN_SEATS,
  STATUS_LABELS,
  formatPlanDate,
  ownerPlanOptions,
  planLabel,
} from '@stafy/utils/planLabels'

type PlanChoice = SubscriptionChangeIn['plan_type']

export function SubscriptionSection() {
  const { data: profile } = useProfile()
  const { data: subscription, isLoading, isError } = useMySubscription()
  const changePlan = useChangeMyPlan()
  const [pending, setPending] = useState<PlanChoice | null>(null)

  if (isLoading) {
    return <span className="loading loading-spinner loading-sm" />
  }
  if (isError || !subscription) {
    return <p className="text-[13px] text-[var(--color-ink-muted)]">Nu am putut încărca abonamentul.</p>
  }

  const isOwner = profile?.role === 'owner'
  const isReadOnly = subscription.plan_status === 'read_only'
  const { canPickSolo, paidOptions } = ownerPlanOptions(subscription)
  const limit = subscription.seats_limit
  const usedPercent = limit ? Math.min(100, Math.round((subscription.seats_used / limit) * 100)) : 0

  function confirmChange(plan: PlanChoice) {
    changePlan.mutate({ plan_type: plan }, { onSettled: () => setPending(null) })
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-[16px] font-semibold text-[var(--color-ink)]">Abonament</h2>
        <p className="text-[13px] text-[var(--color-ink-muted)]">Planul companiei tale și locurile folosite.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-[22px] font-semibold text-[var(--color-ink)]">
          {planLabel(subscription.plan_type)}
        </span>
        <span className={`badge ${isReadOnly ? 'badge-error' : 'badge-success'} badge-soft`}>
          {STATUS_LABELS[subscription.plan_status] ?? subscription.plan_status}
        </span>
      </div>

      {isReadOnly && (
        <div role="alert" className="alert alert-error text-sm">
          Planul a expirat: pontajul angajaților funcționează în continuare, dar restul modificărilor sunt blocate.
          {isOwner ? ' Alege planul Solo mai jos sau contactează-ne pentru un plan plătit.' : ' Owner-ul companiei poate reactiva planul.'}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between text-[13px]">
          <span className="text-[var(--color-ink-soft)]">Locuri folosite</span>
          <span className="font-semibold text-[var(--color-ink)]">
            {subscription.seats_used} / {limit ?? 'nelimitat'}
          </span>
        </div>
        {limit !== null && (
          <progress
            className={`progress ${usedPercent >= 100 ? 'progress-error' : 'progress-primary'} w-full`}
            value={usedPercent}
            max={100}
          />
        )}
        <p className="text-[12px] text-[var(--color-ink-muted)]">
          Owner-ul nu ocupă loc. Un membru suspendat eliberează locul.
        </p>
      </div>

      {subscription.plan_expires_at && (
        <div className="text-[13px] text-[var(--color-ink-soft)]">
          {isReadOnly ? 'A expirat pe ' : 'Expiră pe '}
          <span className="font-semibold text-[var(--color-ink)]">{formatPlanDate(subscription.plan_expires_at)}</span>
          {subscription.expiring_soon && <span className="ml-2 badge badge-warning badge-soft">în curând</span>}
        </div>
      )}

      {isOwner ? (
        <div className="flex flex-col gap-3 border-t border-[var(--color-line)] pt-5">
          <h3 className="text-[14px] font-semibold text-[var(--color-ink)]">Schimbă planul</h3>

          {canPickSolo && (
            <PlanChoiceRow
              title="Solo"
              description="Gratuit, doar tu, fără angajați. Nu expiră."
              choice="solo"
              pending={pending}
              isBusy={changePlan.isPending}
              onAsk={setPending}
              onConfirm={confirmChange}
              onCancel={() => setPending(null)}
            />
          )}
          {paidOptions.map((plan) => (
            <PlanChoiceRow
              key={plan}
              title={planLabel(plan)}
              description={`Până la ${PAID_PLAN_SEATS[plan]} angajați.`}
              choice={plan}
              pending={pending}
              isBusy={changePlan.isPending}
              onAsk={setPending}
              onConfirm={confirmChange}
              onCancel={() => setPending(null)}
            />
          ))}

          {paidOptions.length === 0 && (
            <p className="text-[13px] text-[var(--color-ink-muted)]">
              Pentru un plan plătit sau peste 30 de angajați, contactează-ne — activăm planul pentru tine.
            </p>
          )}
        </div>
      ) : (
        <p className="border-t border-[var(--color-line)] pt-5 text-[13px] text-[var(--color-ink-muted)]">
          Doar owner-ul companiei poate schimba planul.
        </p>
      )}
    </div>
  )
}

interface PlanChoiceRowProps {
  title: string
  description: string
  choice: PlanChoice
  pending: PlanChoice | null
  isBusy: boolean
  onAsk: (choice: PlanChoice) => void
  onConfirm: (choice: PlanChoice) => void
  onCancel: () => void
}

function PlanChoiceRow({ title, description, choice, pending, isBusy, onAsk, onConfirm, onCancel }: PlanChoiceRowProps) {
  const isPending = pending === choice

  return (
    <div className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-line)] px-4 py-3">
      <div>
        <div className="text-[14px] font-semibold text-[var(--color-ink)]">{title}</div>
        <div className="text-[12px] text-[var(--color-ink-muted)]">{description}</div>
      </div>
      {isPending ? (
        <div className="flex gap-2">
          <button type="button" className="btn btn-sm btn-primary" disabled={isBusy} onClick={() => onConfirm(choice)}>
            Confirmă
          </button>
          <button type="button" className="btn btn-sm btn-ghost" disabled={isBusy} onClick={onCancel}>
            Anulează
          </button>
        </div>
      ) : (
        <button type="button" className="btn btn-sm btn-outline" onClick={() => onAsk(choice)}>
          Alege
        </button>
      )}
    </div>
  )
}
