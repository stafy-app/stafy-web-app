import { useMemo } from 'react'
import { Clock, Wallet, BarChart3, CalendarDays } from 'lucide-react'
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
import { useEmployeeMonthlyHistory } from '@stafy/hooks/useEmployeeMonthlyHistory'
import { KpiCard } from '@stafy/components/dashboard/KpiCard'

/** Totals of the month picked in the page's period header (MyHistoryPage). */
export interface SelectedMonthSummary {
  year: number
  month: number
  totalHours: number
  /** Bonus-inclusive, backend-computed (`EmployeeReportOut.total_pay`). */
  totalPay: number
  workedDays: number
}

interface HistoryTabProps {
  employeeId: number
  /**
   * When set, the KPI cards show this month and the charts highlight it; the charts still
   * show the 5-month trend. When omitted (EmployeeProfilePage, which has no month picker on
   * this tab), the KPI cards summarize the 5-month window and the current month is highlighted.
   */
  selectedMonth?: SelectedMonthSummary
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

// Direct-labels only the highlighted point (selected month, else current month) — never a
// number on every point. Text stays on an ink token, never the series hue: the mark carries
// color, the label doesn't. Recharts' own label-renderer prop type is a wide union (its value
// can be boolean/ReactNode in the general case) that a narrow local prop type can never
// structurally satisfy — read through `unknown` at the boundary instead of fighting that union.
function endpointLabel(format: (value: number) => string, highlightIndex: number) {
  return (rawProps: unknown) => {
    const props = rawProps as MinimalMarkProps
    if (props.index !== highlightIndex || props.value == null) return <g />
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

function HighlightedMonthTick({ highlightIndex, ...props }: MinimalMarkProps & { highlightIndex: number }) {
  const isCurrent = props.index === highlightIndex
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

export function HistoryTab({ employeeId, selectedMonth }: HistoryTabProps) {
  const { data, isLoading } = useEmployeeMonthlyHistory(employeeId, MONTHS)

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

  const windowHours = points.reduce((sum, p) => sum + p.hours, 0)
  const windowPay = points.reduce((sum, p) => sum + p.pay, 0)
  const avgHoursPerMonth = points.length > 0 ? windowHours / points.length : 0

  // Selected month when it falls inside the 5-month window; -1 (nothing highlighted) when it
  // is older. Without a selection, the last point (current month).
  const highlightIndex = selectedMonth
    ? points.findIndex((p) => p.year === selectedMonth.year && p.month === selectedMonth.month)
    : points.length - 1

  if (isLoading || points.length === 0) return null

  const selectedLabel = selectedMonth
    ? monthYearFormatter.format(new Date(selectedMonth.year, selectedMonth.month - 1, 1))
    : null

  return (
    <div className="flex flex-col gap-4">
      {selectedMonth ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiCard
            label="Total ore"
            icon={Clock}
            value={selectedMonth.totalHours}
            durationMs={700}
            formatValue={formatHours}
            subtext={selectedLabel ?? undefined}
          />
          <KpiCard
            label="Total de plată"
            icon={Wallet}
            value={selectedMonth.totalPay}
            durationMs={850}
            formatValue={formatRon}
            subtext={selectedLabel ?? undefined}
          />
          <KpiCard
            label="Zile lucrate"
            icon={CalendarDays}
            value={selectedMonth.workedDays}
            durationMs={700}
            subtext={selectedLabel ?? undefined}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiCard
            label="Total ore"
            icon={Clock}
            value={windowHours}
            durationMs={700}
            formatValue={formatHours}
            subtext="ultimele 5 luni"
          />
          <KpiCard
            label="Total de plată"
            icon={Wallet}
            value={windowPay}
            durationMs={850}
            formatValue={formatRon}
            subtext="ultimele 5 luni"
          />
          <KpiCard
            label="Medie ore/lună"
            icon={BarChart3}
            value={avgHoursPerMonth}
            durationMs={700}
            formatValue={formatHours}
            subtext="ultimele 5 luni"
          />
        </div>
      )}

      <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)] sm:p-5">
        <div className="mb-4 text-[16px] font-semibold text-[var(--color-ink)]">Istoric lunar</div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <div className="mb-1 text-[12px] font-medium text-[var(--color-ink-soft)]">Ore lucrate</div>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={points} syncId="employee-history" margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--color-line-soft)" />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={(props) => <HighlightedMonthTick {...props} highlightIndex={highlightIndex} />}
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
                    label={endpointLabel(formatHours, highlightIndex)}
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
                    tick={(props) => <HighlightedMonthTick {...props} highlightIndex={highlightIndex} />}
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
                    label={endpointLabel(formatRon, highlightIndex)}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
        </div>
      </div>
    </div>
  )
}
