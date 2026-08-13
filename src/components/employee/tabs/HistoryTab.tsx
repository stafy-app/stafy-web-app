import { useMemo, useState } from 'react'
import { Clock, Wallet, BarChart3 } from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useEmployeeMonthlyHistory } from '../../../hooks/useEmployeeMonthlyHistory'
import { KpiCard } from '../../dashboard/KpiCard'

interface HistoryTabProps {
  employeeId: number
}

const HOURS_COLOR = 'var(--color-primary)'
// Same validated categorical slot 1 ActivityDonut uses for its top segment — kept as a
// literal hex, not a semantic token, for the same CVD/lightness reasons documented there.
const PAY_COLOR = '#2a78d6'
const MONTHS = 5

const monthShortFormatter = new Intl.DateTimeFormat('ro-RO', { month: 'short' })
const monthYearFormatter = new Intl.DateTimeFormat('ro-RO', { month: 'long', year: 'numeric' })
const ron = new Intl.NumberFormat('ro-RO', { maximumFractionDigits: 0 })

function formatHours(value: number) {
  return `${value.toFixed(1)}h`
}

function formatRon(value: number) {
  return `${ron.format(value)} RON`
}

interface ChartPoint {
  key: string
  year: number
  month: number
  label: string
  hours: number
  pay: number
  bonus: number
  isCurrent: boolean
}

interface MinimalTooltipProps {
  active?: boolean
  payload?: { payload: ChartPoint }[]
}

function HoursTooltip({ active, payload }: MinimalTooltipProps) {
  const point = payload?.[0]?.payload
  if (!active || !point) return null
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 shadow-[var(--shadow-md)]">
      <div className="text-[11px] text-[var(--color-ink-muted)]">{monthYearFormatter.format(new Date(point.year, point.month - 1, 1))}</div>
      <div className="font-[var(--font-mono)] text-[14px] font-bold text-[var(--color-ink)]">{formatHours(point.hours)}</div>
    </div>
  )
}

function PayTooltip({ active, payload }: MinimalTooltipProps) {
  const point = payload?.[0]?.payload
  if (!active || !point) return null
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 shadow-[var(--shadow-md)]">
      <div className="text-[11px] text-[var(--color-ink-muted)]">{monthYearFormatter.format(new Date(point.year, point.month - 1, 1))}</div>
      <div className="font-[var(--font-mono)] text-[14px] font-bold text-[var(--color-ink)]">{formatRon(point.pay)}</div>
      {point.bonus > 0 && (
        <div className="font-[var(--font-mono)] text-[11px] text-[var(--color-ink-muted)]">
          din care bonus {formatRon(point.bonus)}
        </div>
      )}
    </div>
  )
}

interface MinimalDotProps {
  cx?: number
  cy?: number
  payload?: ChartPoint
}

// Distinct marker (hollow ring vs. filled dot) only on months with an active bonus —
// same "mark the exception, don't label every point" rule endpointLabel follows above.
function payDot(rawProps: unknown) {
  const { cx, cy, payload } = rawProps as MinimalDotProps
  if (cx == null || cy == null) return <g />
  const hasBonus = (payload?.bonus ?? 0) > 0
  return hasBonus ? (
    <circle cx={cx} cy={cy} r={5} fill="var(--color-surface)" stroke={PAY_COLOR} strokeWidth={2.5} />
  ) : (
    <circle cx={cx} cy={cy} r={3} fill={PAY_COLOR} stroke="var(--color-surface)" strokeWidth={2} />
  )
}

interface MinimalMarkProps {
  x?: string | number
  y?: string | number
  value?: string | number | null
  index?: number
  payload?: { value: string }
}

// Direct-labels only the last (current month) point — never a number on every point.
// Text stays on an ink token, never the series hue: the mark carries color, the label doesn't.
// Recharts' own label-renderer prop type is a wide union (its value can be boolean/ReactNode
// in the general case) that a narrow local prop type can never structurally satisfy — read
// through `unknown` at the boundary instead of fighting that union.
function endpointLabel(format: (value: number) => string) {
  return (rawProps: unknown) => {
    const props = rawProps as MinimalMarkProps
    if (props.index !== MONTHS - 1 || props.value == null) return <g />
    return (
      <text
        x={Number(props.x ?? 0) + 6}
        y={Number(props.y ?? 0) - 8}
        textAnchor="start"
        className="font-[var(--font-mono)] text-[12px] font-semibold"
        fill="var(--color-ink)"
      >
        {format(Number(props.value))}
      </text>
    )
  }
}

function CurrentMonthTick(props: MinimalMarkProps) {
  const isCurrent = props.index === MONTHS - 1
  return (
    <text
      x={props.x}
      y={Number(props.y ?? 0) + 14}
      textAnchor="middle"
      className="text-[11px]"
      fill={isCurrent ? 'var(--color-ink)' : 'var(--color-ink-muted)'}
      fontWeight={isCurrent ? 700 : 400}
    >
      {props.payload?.value}
    </text>
  )
}

export function HistoryTab({ employeeId }: HistoryTabProps) {
  const { data, isLoading } = useEmployeeMonthlyHistory(employeeId, MONTHS)
  const [showTable, setShowTable] = useState(false)

  const points: ChartPoint[] = useMemo(() => {
    const rows = data?.data ?? []
    return rows.map((row, index) => {
      const bonus = parseFloat(row.bonus_amount ?? '0')
      return {
        key: `${row.year}-${row.month}`,
        year: row.year,
        month: row.month,
        label: monthShortFormatter.format(new Date(row.year, row.month - 1, 1)),
        hours: row.total_hours,
        // Bonus-inclusive, same "total pay" convention every other surface uses.
        pay: parseFloat(row.estimated_gross) + bonus,
        bonus,
        isCurrent: index === rows.length - 1,
      }
    })
  }, [data])

  const totalHours = points.reduce((sum, p) => sum + p.hours, 0)
  const totalPay = points.reduce((sum, p) => sum + p.pay, 0)
  const avgHoursPerMonth = points.length > 0 ? totalHours / points.length : 0

  if (isLoading || points.length === 0) return null

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-[16px] font-semibold text-[var(--color-ink)]">Istoric lunar</div>
          <button
            type="button"
            onClick={() => setShowTable((v) => !v)}
            className="text-[12px] font-medium text-[var(--color-ink-soft)] underline decoration-[var(--color-line)] underline-offset-2 hover:text-[var(--color-primary)]"
          >
            {showTable ? 'Vezi ca grafic' : 'Vezi ca tabel'}
          </button>
        </div>

        {showTable ? (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[var(--color-line-soft)] text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--color-ink-muted)]">
                <th className="pb-2 pr-3 font-semibold">Lună</th>
                <th className="pb-2 pr-3 text-right font-semibold">Ore</th>
                <th className="pb-2 pr-3 text-right font-semibold">Bonus</th>
                <th className="pb-2 text-right font-semibold">De plată</th>
              </tr>
            </thead>
            <tbody>
              {points.map((point) => (
                <tr key={point.key} className="border-b border-[var(--color-line-soft)] last:border-0">
                  <td className="py-2.5 pr-3 text-[var(--color-ink)]">
                    {monthYearFormatter.format(new Date(point.year, point.month - 1, 1))}
                  </td>
                  <td className="py-2.5 pr-3 text-right font-[var(--font-mono)] text-[var(--color-ink)]">
                    {formatHours(point.hours)}
                  </td>
                  <td className="py-2.5 pr-3 text-right font-[var(--font-mono)] text-[var(--color-ink-muted)]">
                    {point.bonus > 0 ? formatRon(point.bonus) : '—'}
                  </td>
                  <td className="py-2.5 text-right font-[var(--font-mono)] font-semibold text-[var(--color-ink)]">
                    {formatRon(point.pay)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <div className="mb-1 text-[12px] font-medium text-[var(--color-ink-soft)]">Ore lucrate</div>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={points} syncId="employee-history" margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--color-line-soft)" />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={(props) => <CurrentMonthTick {...props} />}
                  />
                  <YAxis hide />
                  <Tooltip content={<HoursTooltip />} cursor={{ stroke: 'var(--color-line)', strokeWidth: 1 }} />
                  <Area
                    type="monotone"
                    dataKey="hours"
                    stroke={HOURS_COLOR}
                    strokeWidth={2}
                    fill={HOURS_COLOR}
                    fillOpacity={0.1}
                    dot={{ r: 3, fill: HOURS_COLOR, strokeWidth: 2, stroke: 'var(--color-surface)' }}
                    activeDot={{ r: 4, fill: HOURS_COLOR, strokeWidth: 2, stroke: 'var(--color-surface)' }}
                    label={endpointLabel(formatHours)}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div>
              <div className="mb-1 text-[12px] font-medium text-[var(--color-ink-soft)]">Estimat de plată</div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={points} syncId="employee-history" margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--color-line-soft)" />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={(props) => <CurrentMonthTick {...props} />}
                  />
                  <YAxis hide />
                  <Tooltip content={<PayTooltip />} cursor={{ stroke: 'var(--color-line)', strokeWidth: 1 }} />
                  <Line
                    type="monotone"
                    dataKey="pay"
                    stroke={PAY_COLOR}
                    strokeWidth={2}
                    dot={payDot}
                    activeDot={{ r: 4, fill: PAY_COLOR, strokeWidth: 2, stroke: 'var(--color-surface)' }}
                    label={endpointLabel(formatRon)}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Total ore" icon={Clock} value={totalHours} durationMs={700} formatValue={formatHours} />
        <KpiCard label="Total de plată" icon={Wallet} value={totalPay} durationMs={850} formatValue={formatRon} />
        <KpiCard
          label="Medie ore/lună"
          icon={BarChart3}
          value={avgHoursPerMonth}
          durationMs={700}
          formatValue={formatHours}
        />
      </div>
    </div>
  )
}
