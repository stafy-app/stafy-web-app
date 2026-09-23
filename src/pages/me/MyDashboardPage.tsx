import { Clock, Wallet } from 'lucide-react'
import { ActivityDonut } from '@stafy/components/dashboard/ActivityDonut'
import { KpiCard } from '@stafy/components/dashboard/KpiCard'
import { useTopBar } from '@stafy/hooks/useTopBar'
import { useMyDashboard } from '@stafy/hooks/useMyTime'
import { useProfile } from '@stafy/hooks/useProfile'
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

  const donutSegments = Object.entries(dashboard?.activity_gross ?? {}).map(([name]) => ({
    activity_name: name,
    hours: (dashboard?.time_entries ?? [])
      .filter((entry) => entry.activity_name === name)
      .reduce((sum, entry) => sum + entry.activity_hours, 0),
  }))
  const hasRates = (dashboard?.hourly_rates.length ?? 0) > 0

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-5">
      {!hasRates && (
        <div className="animate-fade-slide-in rounded-[var(--radius-lg)] border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 p-5 shadow-[var(--shadow-sm)]">
          <div className="text-[14px] font-semibold text-[var(--color-ink)]">
            Nu ai niciun tarif configurat încă
          </div>
          <div className="mt-1 text-[13px] text-[var(--color-ink-soft)]">
            Ca să poți înregistra ore, configurează-ți mai întâi tarifele orare pe activități.
          </div>
          <Link
            to="/me/rates"
            className="btn btn-primary btn-sm mt-3"
          >
            Configurează tarife
          </Link>
        </div>
      )}

      <div
        className="animate-fade-slide-in grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
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
        className="animate-fade-slide-in rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]"
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
