import { useState } from 'react'
import { Clock, Mail, Users, Wallet } from 'lucide-react'
import { ActivityDonut } from '../../components/dashboard/ActivityDonut'
import { KpiCard } from '../../components/dashboard/KpiCard'
import { PeriodBar } from '../../components/dashboard/PeriodBar'
import { TopEmployeesTable } from '../../components/dashboard/TopEmployeesTable'
import { useTopBar } from '../../hooks/useTopBar'
import { useCompanyDashboard } from '../../hooks/useCompanyDashboard'
import { useTeam } from '../../hooks/useTeam'
import { getCurrentPeriod } from '../../utils/period'

const ronFormatter = new Intl.NumberFormat('ro-RO', { maximumFractionDigits: 0 })
const monthYearFormatter = new Intl.DateTimeFormat('ro-RO', { month: 'long', year: 'numeric' })

const formatRon = (value: number) => `${ronFormatter.format(value)} RON`
const formatHours = (value: number) => `${value.toFixed(1)}h`
const formatCount = (value: number) => Math.round(value).toString()

export default function DashboardPage() {
  useTopBar({ title: 'Dashboard', subtitle: 'Prezentare generală a echipei tale' })

  const [period, setPeriod] = useState(getCurrentPeriod)
  const current = getCurrentPeriod()
  const isCurrentMonth = period.year === current.year && period.month === current.month

  const { data: dashboard } = useCompanyDashboard(period.year, period.month)
  const { data: team } = useTeam()
  const teamCount = team?.data.filter((u) => u.role === 'employee').length ?? 0

  function goToPrevMonth() {
    setPeriod((p) => (p.month === 1 ? { year: p.year - 1, month: 12 } : { year: p.year, month: p.month - 1 }))
  }

  function goToNextMonth() {
    setPeriod((p) => (p.month === 12 ? { year: p.year + 1, month: 1 } : { year: p.year, month: p.month + 1 }))
  }

  function jumpToCurrent() {
    setPeriod(getCurrentPeriod())
  }

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-5">
      <div className="animate-fade-slide-in" style={{ animationDelay: '0ms' }}>
        <PeriodBar
          year={period.year}
          month={period.month}
          isCurrentMonth={isCurrentMonth}
          onPrev={goToPrevMonth}
          onNext={goToNextMonth}
          onJumpToCurrent={jumpToCurrent}
        />
      </div>

      <div
        className="animate-fade-slide-in grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        style={{ animationDelay: '60ms' }}
      >
        <KpiCard
          label="Angajați activi"
          icon={Users}
          value={dashboard?.active_employee_count ?? 0}
          durationMs={700}
          formatValue={formatCount}
        />
        <KpiCard
          label="Total ore"
          icon={Clock}
          value={dashboard?.total_hours ?? 0}
          durationMs={850}
          formatValue={formatHours}
        />
        <KpiCard
          label="Total plată"
          icon={Wallet}
          value={dashboard ? parseFloat(dashboard.total_gross_salary) : 0}
          durationMs={1000}
          formatValue={formatRon}
        />
        <KpiCard
          label="Invitații"
          icon={Mail}
          value={dashboard?.invitation_count ?? 0}
          durationMs={1100}
          formatValue={formatCount}
        />
      </div>

      <div
        className="animate-fade-slide-in rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]"
        style={{ animationDelay: '120ms' }}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="text-[16px] font-semibold text-[var(--color-ink)]">Distribuția activităților</div>
          <div className="text-[12px] text-[var(--color-ink-muted)]">
            {monthYearFormatter.format(new Date(period.year, period.month - 1, 1))}
          </div>
        </div>
        <ActivityDonut segments={dashboard?.activity_distribution ?? []} totalHours={dashboard?.total_hours ?? 0} />
      </div>

      <div className="animate-fade-slide-in" style={{ animationDelay: '180ms' }}>
        <TopEmployeesTable employees={dashboard?.top_employees ?? []} totalEmployeeCount={teamCount} />
      </div>
    </div>
  )
}
