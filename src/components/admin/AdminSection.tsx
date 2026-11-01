import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AdminSheet, AdminSheetSection } from '@stafy/components/admin/ui/AdminSheet'
import { AdminPageHeader } from '@stafy/components/admin/ui/AdminPageHeader'
import { AdminSegmented } from '@stafy/components/admin/ui/AdminSegmented'
import { AdminStatStrip } from '@stafy/components/admin/ui/AdminStatStrip'
import {
  useAdminActivity,
  useAdminCompaniesSummary,
  useAdminGrowth,
  useAdminInvitationFunnel,
  useAdminOverview,
} from '@stafy/hooks/useAdmin'
import { planLabel } from '@stafy/utils/planLabels'
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
      <div className="text-[12px] text-[var(--color-ink-muted)]">{label && dateFormatter.format(new Date(label))}</div>
      {payload.map((entry) => (
        <div key={entry.name} className="text-[13px] font-semibold" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </div>
      ))}
    </div>
  )
}

const PLAN_COLORS: Record<string, string> = {
  trial: 'var(--color-ink-muted)',
  pilot: 'var(--color-info)',
  solo: 'var(--color-success)',
  small: 'var(--color-warning)',
  standard: 'var(--color-primary)',
  large: 'var(--color-night)',
}

/** Companies per plan as one stacked bar with a legend, instead of a six-row list. */
function PlanBar({ plans }: { plans: { plan_type: string; count: number }[] }) {
  const total = plans.reduce((sum, entry) => sum + entry.count, 0)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex h-3 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
        {plans
          .filter((entry) => entry.count > 0)
          .map((entry) => (
            <div
              key={entry.plan_type}
              title={`${planLabel(entry.plan_type)}: ${entry.count}`}
              className="h-full transition-[width] duration-500"
              style={{ width: `${(entry.count / total) * 100}%`, background: PLAN_COLORS[entry.plan_type] }}
            />
          ))}
      </div>
      <ul className="grid grid-cols-2 gap-x-6 gap-y-2 text-[13px] sm:grid-cols-3 lg:grid-cols-6">
        {plans.map((entry) => (
          <li key={entry.plan_type} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: PLAN_COLORS[entry.plan_type] }}
              aria-hidden
            />
            <span className="text-[var(--color-ink-soft)]">{planLabel(entry.plan_type)}</span>
            <span
              className={`ml-auto font-semibold tabular-nums ${entry.count === 0 ? 'text-[var(--color-ink-muted)]' : 'text-[var(--color-ink)]'}`}
            >
              {entry.count}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function AdminSection() {
  const [growthPeriod, setGrowthPeriod] = useState<GetAdminGrowthPeriod>(GetAdminGrowthPeriod.week)
  const [activityPeriod, setActivityPeriod] = useState<GetAdminActivityPeriod>(GetAdminActivityPeriod.day)

  const { data: overview } = useAdminOverview()
  const { data: companies } = useAdminCompaniesSummary()
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
    <>
      <AdminPageHeader title="Privire generală" subtitle="Cum stă platforma, pe toate companiile." />

      <AdminStatStrip
        items={[
          {
            label: 'Companii',
            value: companies?.total_companies ?? 0,
            hint: `${companies?.active ?? 0} active, ${companies?.read_only ?? 0} doar citire`,
          },
          {
            label: 'Utilizatori',
            value: overview?.total_users ?? 0,
            hint: `${overview?.total_managers ?? 0} manageri, ${overview?.total_employees ?? 0} angajați`,
          },
          {
            label: 'Expiră în 7 zile',
            value: companies?.expiring_soon ?? 0,
            hint: 'Active, cu planul aproape de final',
            tone: 'warning',
          },
          {
            label: 'La limita de locuri',
            value: companies?.at_seat_limit ?? 0,
            hint: 'Toate locurile planului sunt ocupate',
            tone: 'warning',
          },
          {
            label: 'Angajați fără manager',
            value: overview?.employees_without_manager ?? 0,
            hint: 'Nu au acceptat nicio invitație',
          },
        ]}
      />

      <AdminSheet>
        <AdminSheetSection title="Planuri" caption="Câte companii are fiecare plan.">
          <PlanBar plans={companies?.plans ?? []} />
        </AdminSheetSection>

        <AdminSheetSection
          title="Înregistrări noi"
          action={
            <AdminSegmented
              label="Perioada înregistrărilor"
              value={growthPeriod}
              onChange={setGrowthPeriod}
              options={[
                { value: GetAdminGrowthPeriod.week, label: 'Săptămânal' },
                { value: GetAdminGrowthPeriod.month, label: 'Lunar' },
              ]}
            />
          }
        >
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={growthData} margin={{ top: 12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line-soft)" vertical={false} />
              <XAxis
                dataKey="label"
                tickFormatter={(value: string) => dateFormatter.format(new Date(value))}
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis allowDecimals={false} fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Legend
                verticalAlign="top"
                align="left"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 13, paddingBottom: 8 }}
              />
              <Line
                type="monotone"
                dataKey="new_managers"
                name="Manageri"
                stroke="var(--color-primary)"
                strokeWidth={2.5}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="new_employees"
                name="Angajați"
                stroke="var(--color-info)"
                strokeWidth={2.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </AdminSheetSection>

        <div className="grid divide-y divide-[var(--color-line)] lg:grid-cols-2 lg:divide-x lg:divide-y-0">
          <AdminSheetSection title="Invitații" caption="Câte au ajuns în fiecare stare.">
            <div className="flex flex-col gap-3.5">
              {funnelEntries.map((entry) => (
                <div key={entry.key} className="flex items-center gap-3">
                  <div className="w-28 flex-shrink-0 text-[13px] text-[var(--color-ink-soft)]">{entry.label}</div>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
                    <div
                      className="h-full rounded-full bg-[var(--color-primary)] transition-[width] duration-500"
                      style={{ width: `${(entry.count / funnelMax) * 100}%` }}
                    />
                  </div>
                  <div className="w-8 flex-shrink-0 text-right text-[14px] font-semibold text-[var(--color-ink)] tabular-nums">
                    {entry.count}
                  </div>
                </div>
              ))}
            </div>
          </AdminSheetSection>

          <AdminSheetSection
            title="Pontaje"
            action={
              <AdminSegmented
                label="Perioada pontajelor"
                value={activityPeriod}
                onChange={setActivityPeriod}
                options={[
                  { value: GetAdminActivityPeriod.day, label: 'Zilnic' },
                  { value: GetAdminActivityPeriod.week, label: 'Săptămânal' },
                ]}
              />
            }
          >
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line-soft)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tickFormatter={(value: string) => dateFormatter.format(new Date(value))}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis allowDecimals={false} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="time_entries_count" name="Pontaje" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </AdminSheetSection>
        </div>
      </AdminSheet>
    </>
  )
}
