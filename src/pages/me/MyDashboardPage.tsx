import { useState } from 'react'
import { Clock, Wallet } from 'lucide-react'
import { ActivityDonut } from '@stafy/components/dashboard/ActivityDonut'
import { KpiCard } from '@stafy/components/dashboard/KpiCard'
import { useTopBar } from '@stafy/hooks/useTopBar'
import { useMyDashboard } from '@stafy/hooks/useMyTime'
import { useProfile } from '@stafy/hooks/useProfile'
import { useMyInvitations, useAcceptInvitation, useRejectInvitation } from '@stafy/hooks/useInvitations'
import { getCurrentPeriod } from '@stafy/utils/period'
import { Link } from '@tanstack/react-router'

const ronFormatter = new Intl.NumberFormat('ro-RO', { maximumFractionDigits: 0 })
const monthYearFormatter = new Intl.DateTimeFormat('ro-RO', { month: 'long', year: 'numeric' })

const formatRon = (value: number) => `${ronFormatter.format(value)} RON`
const formatHours = (value: number) => `${value.toFixed(1)}h`

export default function MyDashboardPage() {
  useTopBar({ title: 'Pontajul meu', subtitle: 'Orele și câștigurile tale luna aceasta' })

  const { year, month } = getCurrentPeriod()
  const { data: dashboard } = useMyDashboard()
  const { data: profile } = useProfile()
  const { data: invitationsData } = useMyInvitations()
  const acceptInvitation = useAcceptInvitation()
  const rejectInvitation = useRejectInvitation()
  const [respondingId, setRespondingId] = useState<string | null>(null)
  const invitations = invitationsData?.data ?? []

  const donutSegments = Object.entries(dashboard?.activity_gross ?? {}).map(([name]) => ({
    activity_name: name,
    hours: (dashboard?.time_entries ?? [])
      .filter((entry) => entry.activity_name === name)
      .reduce((sum, entry) => sum + entry.activity_hours, 0),
  }))
  const hasRates = (dashboard?.hourly_rates.length ?? 0) > 0

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-4 sm:gap-5">
      {invitations.map((invitation) => (
        <div
          key={invitation.id}
          className="animate-fade-slide-in rounded-[var(--radius-lg)] border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 p-4 shadow-[var(--shadow-sm)] sm:p-5"
        >
          <div className="text-[14px] font-semibold text-[var(--color-ink)]">
            Invitație de la {invitation.manager_name} · {invitation.company_name}
          </div>
          <div className="mt-1 text-[13px] text-[var(--color-ink-soft)]">
            Acceptă pentru a intra în echipa {invitation.company_name}. Pontajele și tarifele tale se reîncarcă automat.
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              disabled={respondingId === invitation.id}
              onClick={() => {
                setRespondingId(invitation.id)
                acceptInvitation.mutate(invitation.id, {
                  onSettled: () => setRespondingId(null),
                })
              }}
              className="btn btn-primary min-h-12 flex-1 sm:btn-sm disabled:opacity-50"
            >
              {respondingId === invitation.id ? 'Se procesează…' : 'Acceptă invitația'}
            </button>
            <button
              type="button"
              disabled={respondingId === invitation.id}
              onClick={() => {
                setRespondingId(invitation.id)
                rejectInvitation.mutate(invitation.id, {
                  onSettled: () => setRespondingId(null),
                })
              }}
              className="btn btn-ghost min-h-12 flex-1 sm:btn-sm disabled:opacity-50"
            >
              Respinge
            </button>
          </div>
        </div>
      ))}
      {!hasRates && (
        <div className="animate-fade-slide-in rounded-[var(--radius-lg)] border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 p-4 shadow-[var(--shadow-sm)] sm:p-5">
          <div className="text-[14px] font-semibold text-[var(--color-ink)]">
            Nu ai niciun tarif configurat încă
          </div>
          <div className="mt-1 text-[13px] text-[var(--color-ink-soft)]">
            Ca să poți înregistra ore, configurează-ți mai întâi tarifele orare pe activități.
          </div>
          <Link
            to="/me/rates"
            className="btn btn-primary btn-sm mt-3 min-h-11 sm:min-h-0"
          >
            Configurează tarife
          </Link>
        </div>
      )}

      <div
        className="animate-fade-slide-in grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3"
        style={{ animationDelay: '60ms' }}
      >
        <KpiCard
          label="Total ore"
          icon={Clock}
          value={dashboard?.total_hours ?? 0}
          durationMs={700}
          formatValue={formatHours}
        />
        <KpiCard
          label="Total de plată"
          icon={Wallet}
          value={dashboard ? parseFloat(dashboard.total_gross_salary) : 0}
          durationMs={850}
          formatValue={formatRon}
        />
        <KpiCard
          label="Tarif mediu"
          icon={Wallet}
          value={dashboard ? parseFloat(dashboard.hourly_average) : 0}
          durationMs={1000}
          formatValue={(v) => `${ronFormatter.format(v)} RON/h`}
        />
      </div>

      <div
        className="animate-fade-slide-in rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)] sm:p-5"
        style={{ animationDelay: '120ms' }}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="text-[16px] font-semibold text-[var(--color-ink)]">Distribuția activităților</div>
          <div className="text-[12px] text-[var(--color-ink-muted)]">
            {monthYearFormatter.format(new Date(year, month - 1, 1))}
          </div>
        </div>
        <ActivityDonut segments={donutSegments} totalHours={dashboard?.total_hours ?? 0} />
      </div>

      {profile && (
        <div className="text-[12px] text-[var(--color-ink-muted)]">
          Pontaje înregistrate pe numele {profile.first_name} {profile.last_name} · apar și în
          statisticile companiei, la fel ca ale oricărui angajat.
        </div>
      )}
    </div>
  )
}
