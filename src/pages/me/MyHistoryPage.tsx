import { useMemo, useState } from 'react'
import { useTopBar } from '@stafy/hooks/useTopBar'
import { useProfile } from '@stafy/hooks/useProfile'
import { useEmployeeTimeEntries } from '@stafy/hooks/useEmployeeTimeEntries'
import { useDeleteTimeEntry } from '@stafy/hooks/useMyTime'
import { HistoryTab } from '@stafy/components/employee/tabs/HistoryTab'
import { AttendanceTab } from '@stafy/components/employee/tabs/AttendanceTab'
import { getCurrentPeriod } from '@stafy/utils/period'
import { ICONS } from '@stafy/lib/icons'

const timeFormatter = new Intl.DateTimeFormat('ro-RO', { hour: '2-digit', minute: '2-digit' })

export default function MyHistoryPage() {
  useTopBar({ title: 'Istoric', subtitle: 'Pontajele tale înregistrate' })

  const { data: profile } = useProfile()
  const employeeId = profile?.id
  const { year, month } = getCurrentPeriod()

  const { data } = useEmployeeTimeEntries(employeeId ?? 0, year, month, undefined, !!employeeId)
  const entries = useMemo(() => data?.data ?? [], [data])
  const deleteEntry = useDeleteTimeEntry()

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  if (!employeeId) return null

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-4 sm:gap-5">
      <HistoryTab employeeId={employeeId} />

      <AttendanceTab employeeId={employeeId} allowBonusEdit={false} />

      {entries.length > 0 && (
        <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)] sm:p-5">
          <div className="mb-3 text-[16px] font-semibold text-[var(--color-ink)]">Acțiuni pontaje</div>
          <div className="flex flex-col gap-2">
            {entries.map((entry) => {
              const start = new Date(entry.time_start)
              const end = new Date(entry.time_end)
              const hours = (end.getTime() - start.getTime()) / 3_600_000
              const isConfirming = confirmDeleteId === entry.id
              return (
                <div
                  key={entry.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] bg-[var(--color-surface-2)] px-3 py-3 text-[13px]"
                >
                  <span className="text-[var(--color-ink)]">
                    {entry.activity.activity_name} · {timeFormatter.format(start)}–{timeFormatter.format(end)} ·{' '}
                    {hours.toFixed(1)}h
                  </span>
                  {isConfirming ? (
                    <span className="flex w-full flex-wrap items-center gap-x-3 gap-y-2 sm:w-auto">
                      <span className="text-[var(--color-ink-muted)]">Sigur ștergi?</span>
                      <button
                        type="button"
                        onClick={() => {
                          deleteEntry.mutate(entry.id, { onSuccess: () => setConfirmDeleteId(null) })
                        }}
                        disabled={deleteEntry.isPending}
                        className="min-h-11 flex-1 px-3 font-semibold text-[var(--color-error)] disabled:opacity-50 sm:min-h-0 sm:flex-none sm:px-0"
                      >
                        Da, șterge
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="min-h-11 flex-1 px-3 text-[var(--color-ink-muted)] sm:min-h-0 sm:flex-none sm:px-0"
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
                      className="flex min-h-11 min-w-11 items-center justify-center text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-error)]"
                    >
                      <ICONS.trash className="h-5 w-5 sm:h-4 sm:w-4" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
