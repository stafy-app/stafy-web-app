import { useState } from 'react'
import { useTopBar } from '@stafy/hooks/useTopBar'
import { useMyHourlyRates, useUpdateMyHourlyRate, useCreateMyActivity, useDeleteMyActivity } from '@stafy/hooks/useMyTime'
import { useActivities } from '@stafy/hooks/useActivities'

const ron = new Intl.NumberFormat('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function MyRatesPage() {
  useTopBar({ title: 'Tarife', subtitle: 'Tarifele tale orare pe activități' })

  const { data: ratesData, isLoading } = useMyHourlyRates()
  const { data: activitiesData } = useActivities()
  const updateRate = useUpdateMyHourlyRate()
  const createActivity = useCreateMyActivity()
  const deleteActivity = useDeleteMyActivity()

  const rates = ratesData?.data ?? []
  const configuredIds = new Set(rates.map((r) => r.activity_id))
  const unconfigured = (activitiesData?.data ?? []).filter((a) => !configuredIds.has(a.id))

  const [editingActivityId, setEditingActivityId] = useState<number | null>(null)
  const [draftValue, setDraftValue] = useState('')
  const [addingExistingId, setAddingExistingId] = useState<number | null>(null)
  const [addingExistingRate, setAddingExistingRate] = useState('')
  const [showNewForm, setShowNewForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newRate, setNewRate] = useState('')
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

  function saveExisting(activityId: number) {
    const value = parseFloat(addingExistingRate)
    if (!Number.isFinite(value) || value <= 0) return
    updateRate.mutate(
      { activityId, hourlyRateGross: addingExistingRate },
      {
        onSuccess: () => {
          setAddingExistingId(null)
          setAddingExistingRate('')
        },
      },
    )
  }

  function saveNew() {
    const name = newName.trim()
    const value = parseFloat(newRate)
    if (name.length < 2 || !Number.isFinite(value) || value <= 0) return
    createActivity.mutate(
      { activity_name: name, hourly_rate_gross: newRate },
      {
        onSuccess: () => {
          setShowNewForm(false)
          setNewName('')
          setNewRate('')
        },
      },
    )
  }

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-4">
      <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
        <p className="text-[12px] text-[var(--color-ink-muted)]">
          Îți configurezi singur tarifele orare — o schimbare se aplică doar pontajelor viitoare,
          cele deja înregistrate păstrează tariful din momentul lucrului.
        </p>
      </div>

      <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
        {isLoading ? null : rates.length === 0 ? (
          <div className="py-8 text-center text-[13px] text-[var(--color-ink-muted)]">
            Nu ai niciun tarif configurat încă.
          </div>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[var(--color-line-soft)] text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--color-ink-muted)]">
                <th className="pb-2 pr-3 font-semibold">Activitate</th>
                <th className="pb-2 pr-3 text-right font-semibold">Tarif (RON/h)</th>
                <th className="pb-2 text-right font-semibold">Acțiuni</th>
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
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {unconfigured.length > 0 && (
        <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
          <div className="mb-3 text-[14px] font-semibold text-[var(--color-ink)]">
            Activități ale companiei fără tarif
          </div>
          <div className="flex flex-col gap-2">
            {unconfigured.map((activity) => (
              <div
                key={activity.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface-2)] px-3 py-2"
              >
                <span className="text-[13px] text-[var(--color-ink)]">{activity.activity_name}</span>
                {addingExistingId === activity.id ? (
                  <span className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      autoFocus
                      placeholder="RON/h"
                      value={addingExistingRate}
                      onChange={(e) => setAddingExistingRate(e.target.value)}
                      className="w-24 rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-surface)] px-2 py-1 text-right font-[var(--font-mono)] text-[13px] outline-none focus:border-[var(--color-primary)]"
                    />
                    <button
                      type="button"
                      onClick={() => saveExisting(activity.id)}
                      disabled={updateRate.isPending}
                      className="text-[12px] font-semibold text-[var(--color-primary)] disabled:opacity-50"
                    >
                      Salvează
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAddingExistingId(null)
                        setAddingExistingRate('')
                      }}
                      className="text-[12px] text-[var(--color-ink-muted)]"
                    >
                      Anulează
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAddingExistingId(activity.id)}
                    className="rounded-full border border-[var(--color-primary)] px-3 py-1 text-[12px] font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary-soft)]"
                  >
                    Setează tarif
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
        {showNewForm ? (
          <div className="flex flex-col gap-3">
            <div className="text-[14px] font-semibold text-[var(--color-ink)]">Activitate nouă</div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.05em] text-[var(--color-ink-muted)]">
                  Nume activitate
                </span>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="ex. Suport clienți"
                  maxLength={30}
                  className="input input-bordered w-full"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.05em] text-[var(--color-ink-muted)]">
                  Tarif (RON/h)
                </span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={newRate}
                  onChange={(e) => setNewRate(e.target.value)}
                  placeholder="ex. 45"
                  className="input input-bordered w-full"
                />
              </label>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={saveNew}
                disabled={createActivity.isPending}
                className="btn btn-primary btn-sm disabled:opacity-50"
              >
                Adaugă activitate
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowNewForm(false)
                  setNewName('')
                  setNewRate('')
                }}
                className="btn btn-ghost btn-sm"
              >
                Anulează
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowNewForm(true)}
            className="btn btn-outline btn-sm"
          >
            + Activitate nouă
          </button>
        )}
      </div>
    </div>
  )
}
