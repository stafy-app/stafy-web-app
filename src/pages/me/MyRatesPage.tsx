import { useState } from 'react'
import { useTopBar } from '@stafy/hooks/useTopBar'
import { useProfile } from '@stafy/hooks/useProfile'
import { useMyHourlyRates, useUpdateMyHourlyRate, useDeleteMyActivity } from '@stafy/hooks/useMyTime'

const ron = new Intl.NumberFormat('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function MyRatesPage() {
  useTopBar({ title: 'Tarife', subtitle: 'Tarifele tale orare pe activități' })

  const { data: ratesData, isLoading } = useMyHourlyRates()
  const { data: profileData } = useProfile()
  const isEmployee = profileData?.role === 'employee'
  const updateRate = useUpdateMyHourlyRate()
  const deleteActivity = useDeleteMyActivity()
  const rates = ratesData?.data ?? []

  const [editingActivityId, setEditingActivityId] = useState<number | null>(null)
  const [draftValue, setDraftValue] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  function startEditing(activityId: number, currentRate: string) {
    setEditingActivityId(activityId)
    setDraftValue(currentRate)
  }

  function save(activityId: number) {
    const value = parseFloat(draftValue)
    if (!Number.isFinite(value) || value <= 0) return
    updateRate.mutate(
      { activityId, hourlyRateGross: draftValue },
      { onSuccess: () => setEditingActivityId(null) },
    )
  }

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-4">
      <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
        <p className="text-[12px] text-[var(--color-ink-muted)]">
          {isEmployee
            ? 'Tarifele sunt stabilite de managerul companiei — aici vezi tarifele tale active.'
            : 'Îți configurezi singur tarifele orare — o schimbare se aplică doar pontajelor viitoare, cele deja înregistrate păstrează tariful din momentul lucrului.'}
        </p>
      </div>
      <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)] sm:p-5">
        {isLoading ? null : rates.length === 0 ? (
          <div className="py-8 text-center">
            <div className="text-[15px] font-semibold text-[var(--color-ink)]">
              Nu ai niciun tarif configurat încă.
            </div>
            <div className="mx-auto mt-1 max-w-[420px] text-[13px] text-[var(--color-ink-muted)]">
              {isEmployee
                ? 'Managerul companiei îți va seta tarifele — revino aici după ce le primești.'
                : 'Configurează-ți tarifele din pagina de setări a activităților companiei.'}
            </div>
          </div>
        ) : (
          <>
            <table className="hidden w-full text-[13px] sm:table">
            <thead>
              <tr className="border-b border-[var(--color-line-soft)] text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--color-ink-muted)]">
                <th className="pb-2 pr-3 font-semibold">Activitate</th>
                <th className="pb-2 pr-3 text-right font-semibold">Tarif (RON/h)</th>
                {!isEmployee && <th className="pb-2 text-right font-semibold">Acțiuni</th>}
              </tr>
            </thead>
            <tbody>
              {rates.map((rate) => {
                const isEditing = editingActivityId === rate.activity_id
                const isConfirming = confirmDeleteId === rate.activity_id
                return (
                  <tr key={rate.activity_id} className="border-b border-[var(--color-line-soft)] last:border-0">
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
                          {ron.format(parseFloat(rate.hourly_rate_gross))} RON
                        </span>
                      )}
                    </td>
                    {!isEmployee && (
                      <td className="py-2.5 text-right">
                        {isEditing ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => save(rate.activity_id)}
                            disabled={updateRate.isPending}
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
                      ) : isConfirming ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-[12px] text-[var(--color-ink-muted)]">Sigur ștergi?</span>
                          <button
                            type="button"
                            onClick={() => {
                              deleteActivity.mutate(rate.activity_id, {
                                onSuccess: () => setConfirmDeleteId(null),
                              })
                            }}
                            disabled={deleteActivity.isPending}
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
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => startEditing(rate.activity_id, rate.hourly_rate_gross)}
                            className="text-[12px] font-semibold text-[var(--color-primary)]"
                          >
                            Editează
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(rate.activity_id)}
                            className="text-[12px] text-[var(--color-ink-muted)] hover:text-[var(--color-error)]"
                          >
                            Șterge
                          </button>
                        </div>
                      )}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
            </table>
            <div className="flex flex-col gap-2 sm:hidden">
              {rates.map((rate) => {
                const isEditing = !isEmployee && editingActivityId === rate.activity_id
                const isConfirming = !isEmployee && confirmDeleteId === rate.activity_id
                return (
                  <div
                    key={rate.activity_id}
                    className="rounded-[var(--radius-md)] bg-[var(--color-surface-2)] px-3 py-3"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="min-w-0 truncate text-[13px] font-medium text-[var(--color-ink)]">
                        {rate.activity_name}
                      </span>
                      {isEditing ? (
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          autoFocus
                          value={draftValue}
                          onChange={(e) => setDraftValue(e.target.value)}
                          className="w-28 rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-surface)] px-2 py-2 text-right font-[var(--font-mono)] text-[16px] outline-none focus:border-[var(--color-primary)]"
                        />
                      ) : (
                        <span className="font-[var(--font-mono)] text-[15px] font-bold text-[var(--color-ink)]">
                          {ron.format(parseFloat(rate.hourly_rate_gross))} RON
                        </span>
                      )}
                    </div>
                    {!isEmployee && (
                      <div className="mt-2 flex gap-2">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => save(rate.activity_id)}
                              disabled={updateRate.isPending}
                              className="btn btn-primary min-h-11 flex-1 disabled:opacity-50"
                            >
                              Salvează
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingActivityId(null)}
                              className="btn btn-ghost min-h-11 flex-1"
                            >
                              Anulează
                            </button>
                          </>
                        ) : isConfirming ? (
                          <>
                            <span className="flex min-h-11 flex-1 items-center text-[12px] text-[var(--color-ink-muted)]">
                              Sigur ștergi?
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                deleteActivity.mutate(rate.activity_id, {
                                  onSuccess: () => setConfirmDeleteId(null),
                                })
                              }}
                              disabled={deleteActivity.isPending}
                              className="btn btn-error btn-sm min-h-11 flex-1 disabled:opacity-50"
                            >
                              Da, șterge
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="btn btn-ghost btn-sm min-h-11 flex-1"
                            >
                              Anulează
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => startEditing(rate.activity_id, rate.hourly_rate_gross)}
                              className="btn btn-outline btn-sm min-h-11 flex-1"
                            >
                              Editează
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(rate.activity_id)}
                              className="btn btn-ghost btn-sm min-h-11 flex-1"
                            >
                              Șterge
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
