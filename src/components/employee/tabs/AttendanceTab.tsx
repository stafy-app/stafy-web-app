import { useMemo, useState } from 'react'
import { PeriodBar } from '@stafy/components/dashboard/PeriodBar'
import { useEmployeeTimeEntries } from '@stafy/hooks/useEmployeeTimeEntries'
import { useEmployeeReport } from '@stafy/hooks/useReports'
import { getAdjacentPeriod, getCurrentPeriod } from '@stafy/utils/period'

interface AttendanceTabProps {
  employeeId: number
}

const dateFormatter = new Intl.DateTimeFormat('ro-RO', { weekday: 'short', day: 'numeric', month: 'short' })
const timeFormatter = new Intl.DateTimeFormat('ro-RO', { hour: '2-digit', minute: '2-digit' })
const ron = new Intl.NumberFormat('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function AttendanceTab({ employeeId }: AttendanceTabProps) {
  const [period, setPeriod] = useState(getCurrentPeriod)
  const current = getCurrentPeriod()
  const isCurrentMonth = period.year === current.year && period.month === current.month

  const { data, isLoading } = useEmployeeTimeEntries(employeeId, period.year, period.month)
  const entries = useMemo(() => data?.data ?? [], [data])
  const { data: report } = useEmployeeReport(employeeId, period.year, period.month)
  const bonus = report?.bonus && parseFloat(report.bonus.amount) > 0 ? report.bonus : null

  const [activityFilter, setActivityFilter] = useState<'all' | number>('all')

  const activities = useMemo(() => {
    const map = new Map<number, string>()
    for (const entry of entries) map.set(entry.activity.id, entry.activity.activity_name)
    return Array.from(map, ([id, name]) => ({ id, name }))
  }, [entries])

  const filteredEntries = useMemo(
    () => (activityFilter === 'all' ? entries : entries.filter((e) => e.activity.id === activityFilter)),
    [entries, activityFilter],
  )

  const totalHours = filteredEntries.reduce(
    (sum, e) => sum + (new Date(e.time_end).getTime() - new Date(e.time_start).getTime()) / 3_600_000,
    0,
  )

  function goToPrevMonth() {
    setPeriod((p) => getAdjacentPeriod(p, -1))
  }

  function goToNextMonth() {
    setPeriod((p) => getAdjacentPeriod(p, 1))
  }

  return (
    <div className="flex flex-col gap-4">
      <PeriodBar
        year={period.year}
        month={period.month}
        isCurrentMonth={isCurrentMonth}
        onPrev={goToPrevMonth}
        onNext={goToNextMonth}
        onJumpToCurrent={() => setPeriod(getCurrentPeriod())}
      />

      <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[16px] font-semibold text-[var(--color-ink)]">Pontaje</div>
            <div className="mt-0.5 text-[12px] text-[var(--color-ink-muted)]">
              {filteredEntries.length} înregistrări · {totalHours.toFixed(1)}h total
            </div>
          </div>
          {activities.length > 0 && (
            <select
              value={activityFilter}
              onChange={(e) => setActivityFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="select select-sm rounded-[var(--radius-md)] border-[var(--color-line)] bg-[var(--color-surface)] text-[12px]"
            >
              <option value="all">Toate activitățile</option>
              {activities.map((activity) => (
                <option key={activity.id} value={activity.id}>
                  {activity.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {isLoading ? null : filteredEntries.length === 0 && !bonus ? (
          <div className="py-8 text-center text-[13px] text-[var(--color-ink-muted)]">
            Niciun pontaj în această perioadă.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[var(--color-line-soft)] text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--color-ink-muted)]">
                  <th className="pb-2 pr-3 font-semibold">Dată</th>
                  <th className="pb-2 pr-3 font-semibold">Interval</th>
                  <th className="pb-2 pr-3 font-semibold">Activitate</th>
                  <th className="pb-2 pr-3 text-right font-semibold">Durată</th>
                  <th className="pb-2 pr-3 text-right font-semibold">Tarif</th>
                  <th className="pb-2 text-right font-semibold">Sumă</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => {
                  const start = new Date(entry.time_start)
                  const end = new Date(entry.time_end)
                  const hours = (end.getTime() - start.getTime()) / 3_600_000
                  const rate = parseFloat(entry.rate_applied)
                  return (
                    <tr key={entry.id} className="border-b border-[var(--color-line-soft)] last:border-0">
                      <td className="py-2.5 pr-3 text-[var(--color-ink)]">{dateFormatter.format(start)}</td>
                      <td className="py-2.5 pr-3 font-[var(--font-mono)] text-[var(--color-ink-soft)]">
                        {timeFormatter.format(start)}–{timeFormatter.format(end)}
                      </td>
                      <td className="py-2.5 pr-3">
                        <span className="rounded-full bg-[var(--color-surface-2)] px-2 py-0.5 text-[12px] text-[var(--color-ink-soft)]">
                          {entry.activity.activity_name}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 text-right font-[var(--font-mono)] text-[var(--color-ink)]">
                        {hours.toFixed(1)}h
                      </td>
                      <td className="py-2.5 pr-3 text-right font-[var(--font-mono)] text-[var(--color-ink-muted)]">
                        {ron.format(rate)} RON
                      </td>
                      <td className="py-2.5 text-right font-[var(--font-mono)] font-semibold text-[var(--color-ink)]">
                        {ron.format(hours * rate)} RON
                      </td>
                    </tr>
                  )
                })}
                {bonus && (
                  <tr className="border-b border-[var(--color-line-soft)] bg-[var(--color-success)]/5 last:border-0">
                    <td className="py-2.5 pr-3" colSpan={3}>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-[var(--color-success)]/10 px-2 py-0.5 text-[12px] font-medium text-[var(--color-success)]">
                          Bonus lunar
                        </span>
                        {bonus.reason && (
                          <span className="text-[12px] text-[var(--color-ink-muted)]">{bonus.reason}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 pr-3 text-right font-[var(--font-mono)] text-[var(--color-ink-muted)]">—</td>
                    <td className="py-2.5 pr-3 text-right font-[var(--font-mono)] text-[var(--color-ink-muted)]">—</td>
                    <td className="py-2.5 text-right font-[var(--font-mono)] font-semibold text-[var(--color-success)]">
                      {ron.format(parseFloat(bonus.amount))} RON
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
