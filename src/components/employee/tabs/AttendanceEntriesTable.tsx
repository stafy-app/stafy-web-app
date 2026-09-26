import { useState } from 'react'
import { useDeleteTimeEntry } from '@stafy/hooks/useMyTime'
import { ICONS } from '@stafy/lib/icons'
import type { AttendanceMonthData } from './useAttendanceMonth'

const dateFormatter = new Intl.DateTimeFormat('ro-RO', { weekday: 'short', day: 'numeric', month: 'short' })
const timeFormatter = new Intl.DateTimeFormat('ro-RO', { hour: '2-digit', minute: '2-digit' })
const ron = new Intl.NumberFormat('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

interface AttendanceEntriesTableProps {
  data: AttendanceMonthData
  /** Delete column on the table. Backend ownership-checks DELETE /time-entries/{id} to the
   * entry's own owner, so this only makes sense in the /me personal shell — a manager
   * viewing an employee's history (EmployeeProfilePage) can never delete on their behalf. */
  allowDelete?: boolean
}

export function AttendanceEntriesTable({ data, allowDelete = false }: AttendanceEntriesTableProps) {
  const { isLoading, bonus, activities, activityFilter, setActivityFilter, filteredEntries, totalHours } = data
  const deleteEntry = useDeleteTimeEntry()
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  return (
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
                {allowDelete && <th className="pb-2 pl-3 text-right font-semibold">Acțiuni</th>}
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry) => {
                const start = new Date(entry.time_start)
                const end = new Date(entry.time_end)
                const hours = (end.getTime() - start.getTime()) / 3_600_000
                const rate = parseFloat(entry.rate_applied)
                const isConfirming = confirmDeleteId === entry.id
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
                    {allowDelete && (
                      <td className="py-2.5 pl-3 text-right">
                        {isConfirming ? (
                          <span className="flex items-center justify-end gap-2 whitespace-nowrap">
                            <span className="text-[12px] text-[var(--color-ink-muted)]">Sigur?</span>
                            <button
                              type="button"
                              onClick={() => {
                                deleteEntry.mutate(entry.id, { onSuccess: () => setConfirmDeleteId(null) })
                              }}
                              disabled={deleteEntry.isPending}
                              className="text-[12px] font-semibold text-[var(--color-error)] disabled:opacity-50"
                            >
                              Da, șterge
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-[12px] text-[var(--color-ink-muted)]"
                            >
                              Anulează
                            </button>
                          </span>
                        ) : (
                          <button
                            type="button"
                            aria-label="Șterge pontaj"
                            title="Șterge pontaj"
                            onClick={() => setConfirmDeleteId(entry.id)}
                            className="ml-auto flex min-h-11 min-w-11 items-center justify-center text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-error)] sm:min-h-0 sm:min-w-0"
                          >
                            <ICONS.trash className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    )}
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
                  {allowDelete && <td className="py-2.5 pl-3" />}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
