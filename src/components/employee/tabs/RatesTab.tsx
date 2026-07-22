import { useState } from 'react'
import { useEmployeeRates, useSetEmployeeRate } from '../../../hooks/useEmployeeRates'
import { getCurrentPeriod } from '../../../utils/period'

interface RatesTabProps {
  employeeId: number
}

const ron = new Intl.NumberFormat('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function RatesTab({ employeeId }: RatesTabProps) {
  const { year, month } = getCurrentPeriod()
  const { data, isLoading } = useEmployeeRates(employeeId, year, month)
  const setRate = useSetEmployeeRate(employeeId)

  const [editingActivityId, setEditingActivityId] = useState<number | null>(null)
  const [draftValue, setDraftValue] = useState('')

  function startEditing(activityId: number, currentRate: string | null) {
    setEditingActivityId(activityId)
    setDraftValue(currentRate ?? '')
  }

  function save(activityId: number) {
    const value = parseFloat(draftValue)
    if (!Number.isFinite(value) || value <= 0) return
    setRate.mutate(
      { activityId, hourlyRateGross: draftValue },
      { onSuccess: () => setEditingActivityId(null) },
    )
  }

  const rates = data?.data ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
        <p className="text-[12px] text-[var(--color-ink-muted)]">
          Angajatul vede tariful configurat pentru fiecare activitate, dar nu îl poate modifica. O schimbare aici
          se aplică doar pontajelor viitoare — cele deja înregistrate păstrează tariful din momentul lucrului.
        </p>
      </div>

      <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
        {isLoading ? null : rates.length === 0 ? (
          <div className="py-8 text-center text-[13px] text-[var(--color-ink-muted)]">
            Compania nu are activități configurate încă.
          </div>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[var(--color-line-soft)] text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--color-ink-muted)]">
                <th className="pb-2 pr-3 font-semibold">Activitate</th>
                <th className="pb-2 pr-3 text-right font-semibold">Tarif (RON/h)</th>
                <th className="pb-2 pr-3 text-right font-semibold">Ore luna asta</th>
                <th className="pb-2 text-right font-semibold">Sumă estimată</th>
              </tr>
            </thead>
            <tbody>
              {rates.map((rate) => {
                const isEditing = editingActivityId === rate.activity_id
                const hasRate = rate.hourly_rate_gross !== null

                return (
                  <tr
                    key={rate.activity_id}
                    className={`border-b border-[var(--color-line-soft)] last:border-0 ${hasRate ? '' : 'opacity-50'}`}
                  >
                    <td className="py-2.5 pr-3 text-[var(--color-ink)]">{rate.activity_name}</td>
                    <td className="py-2.5 pr-3 text-right">
                      {isEditing ? (
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          autoFocus
                          value={draftValue}
                          onChange={(e) => setDraftValue(e.target.value)}
                          className="w-24 rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-surface)] px-2 py-1 text-right font-[var(--font-mono)] text-[13px] outline-none focus:border-[var(--color-primary)]"
                        />
                      ) : (
                        <span className="font-[var(--font-mono)] text-[var(--color-ink)]">
                          {hasRate ? `${ron.format(parseFloat(rate.hourly_rate_gross!))} RON` : '—'}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 pr-3 text-right font-[var(--font-mono)] text-[var(--color-ink-soft)]">
                      {rate.hours_this_month.toFixed(1)}h
                    </td>
                    <td className="py-2.5 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => save(rate.activity_id)}
                            disabled={setRate.isPending}
                            className="text-[12px] font-semibold text-[var(--color-primary)] disabled:opacity-50"
                          >
                            Salvează
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingActivityId(null)}
                            className="text-[12px] text-[var(--color-ink-muted)]"
                          >
                            Anulează
                          </button>
                        </div>
                      ) : hasRate ? (
                        <button
                          type="button"
                          onClick={() => startEditing(rate.activity_id, rate.hourly_rate_gross)}
                          className="font-[var(--font-mono)] font-semibold text-[var(--color-ink)] hover:text-[var(--color-primary)]"
                        >
                          {ron.format(rate.hours_this_month * parseFloat(rate.hourly_rate_gross!))} RON
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEditing(rate.activity_id, null)}
                          className="rounded-full border border-[var(--color-primary)] px-3 py-1 text-[12px] font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary-soft)]"
                        >
                          Activează
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
