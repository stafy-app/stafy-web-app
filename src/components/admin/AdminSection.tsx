import { useState } from 'react'
import { Users, UserCog, UserX, Building2 } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { KpiCard } from '@stafy/components/dashboard/KpiCard'
import { useAdminActivity, useAdminGrowth, useAdminInvitationFunnel, useAdminOverview } from '@stafy/hooks/useAdmin'
import {
  GetAdminActivityPeriod,
  GetAdminGrowthPeriod,
  type AdminInvitationFunnelOut,
} from '@stafy/api/generated/endpoints/index.schemas'

const dateFormatter = new Intl.DateTimeFormat('ro-RO', { day: '2-digit', month: 'short' })

const FUNNEL_LABELS: Record<keyof AdminInvitationFunnelOut, string> = {
  pending: 'În așteptare',
  accepted: 'Acceptate',
  rejected: 'Refuzate',
  expired: 'Expirate',
  cancelled: 'Anulate',
}

interface AxisTooltipProps {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}

function ChartTooltip({ active, payload, label }: AxisTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 shadow-[var(--shadow-md)]">
      <div className="text-[11px] text-[var(--color-ink-muted)]">{label && dateFormatter.format(new Date(label))}</div>
      {payload.map((entry) => (
        <div key={entry.name} className="text-[13px] font-semibold" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </div>
      ))}
    </div>
  )
}

function PeriodToggle<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  return (
    <div className="join">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`btn btn-sm join-item ${value === option.value ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function AdminSection() {
  const [growthPeriod, setGrowthPeriod] = useState<GetAdminGrowthPeriod>(GetAdminGrowthPeriod.week)
  const [activityPeriod, setActivityPeriod] = useState<GetAdminActivityPeriod>(GetAdminActivityPeriod.day)

  const { data: overview } = useAdminOverview()
  const { data: growth } = useAdminGrowth({ period: growthPeriod })
  const { data: funnel } = useAdminInvitationFunnel()
  const { data: activity } = useAdminActivity({ period: activityPeriod })

  const growthData = (growth?.data ?? []).map((point) => ({
    ...point,
    label: point.period_start,
  }))
  const activityData = (activity?.data ?? []).map((point) => ({
    ...point,
    label: point.period_start,
  }))
  const funnelEntries = funnel
    ? (Object.entries(FUNNEL_LABELS) as [keyof AdminInvitationFunnelOut, string][]).map(([key, label]) => ({
        key,
        label,
        count: funnel[key],
      }))
    : []
  const funnelMax = Math.max(1, ...funnelEntries.map((entry) => entry.count))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-[16px] font-semibold text-[var(--color-ink)]">Admin</h2>
        <p className="text-[13px] text-[var(--color-ink-muted)]">Statistici la nivel de platformă, pe toate companiile.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Manageri" icon={UserCog} value={overview?.total_managers ?? 0} durationMs={600} />
        <KpiCard label="Angajați" icon={Users} value={overview?.total_employees ?? 0} durationMs={600} />
        <KpiCard label="Total useri" icon={Building2} value={overview?.total_users ?? 0} durationMs={600} />
        <KpiCard
          label="Fără manager"
          icon={UserX}
          value={overview?.employees_without_manager ?? 0}
          durationMs={600}
          subtext="Angajați care nu au acceptat nicio invitație"
        />
      </div>

      <div className="rounded-[var(--radius-lg)] border border-[var(--color-line)] p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[14px] font-semibold text-[var(--color-ink)]">Înregistrări noi</h3>
          <PeriodToggle
            value={growthPeriod}
            onChange={setGrowthPeriod}
            options={[
              { value: GetAdminGrowthPeriod.week, label: 'Săptămânal' },
              { value: GetAdminGrowthPeriod.month, label: 'Lunar' },
            ]}
          />
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={growthData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" />
            <XAxis dataKey="label" tickFormatter={(value: string) => dateFormatter.format(new Date(value))} fontSize={11} />
            <YAxis allowDecimals={false} fontSize={11} />
            <Tooltip content={<ChartTooltip />} />
            <Line type="monotone" dataKey="new_managers" name="Manageri" stroke="var(--color-primary)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="new_employees" name="Angajați" stroke="#2a78d6" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-[var(--radius-lg)] border border-[var(--color-line)] p-5">
        <h3 className="mb-3 text-[14px] font-semibold text-[var(--color-ink)]">Invitații</h3>
        <div className="flex flex-col gap-2">
          {funnelEntries.map((entry) => (
            <div key={entry.key} className="flex items-center gap-3">
              <div className="w-24 flex-shrink-0 text-[12px] text-[var(--color-ink-muted)]">{entry.label}</div>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
                <div
                  className="h-full rounded-full bg-[var(--color-primary)]"
                  style={{ width: `${(entry.count / funnelMax) * 100}%` }}
                />
              </div>
              <div className="w-8 flex-shrink-0 text-right text-[13px] font-semibold text-[var(--color-ink)]">{entry.count}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[var(--radius-lg)] border border-[var(--color-line)] p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[14px] font-semibold text-[var(--color-ink)]">Activitate (pontaje)</h3>
          <PeriodToggle
            value={activityPeriod}
            onChange={setActivityPeriod}
            options={[
              { value: GetAdminActivityPeriod.day, label: 'Zilnic' },
              { value: GetAdminActivityPeriod.week, label: 'Săptămânal' },
            ]}
          />
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={activityData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" />
            <XAxis dataKey="label" tickFormatter={(value: string) => dateFormatter.format(new Date(value))} fontSize={11} />
            <YAxis allowDecimals={false} fontSize={11} />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="time_entries_count" name="Pontaje" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
