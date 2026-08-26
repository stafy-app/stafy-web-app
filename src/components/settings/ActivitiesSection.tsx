import { useState, type FormEvent } from 'react'
import { useActivities, useCreateActivity, useUpdateActivity } from '@stafy/hooks/useActivities'
import { getActivityColor } from '@stafy/utils/activityColor'
import { ICONS } from '@stafy/lib/icons'
import { showToast } from '@stafy/lib/toast'

const PencilIcon = ICONS.pencil
const CheckIcon = ICONS.check
const CloseIcon = ICONS.close

function isConflict(error: unknown): boolean {
  return (error as { response?: { status?: number } })?.response?.status === 409
}

export function ActivitiesSection() {
  const { data, isLoading } = useActivities()
  const createActivity = useCreateActivity()
  const updateActivity = useUpdateActivity()

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')
  const [newActivityName, setNewActivityName] = useState('')

  const activities = data?.data ?? []

  function startEditing(activityId: number, currentName: string) {
    setEditingId(activityId)
    setEditValue(currentName)
  }

  async function saveRename(activityId: number) {
    const name = editValue.trim()
    if (!name) return
    try {
      await updateActivity.mutateAsync({ activityId, data: { activity_name: name } })
      setEditingId(null)
      showToast('Activitate actualizată.')
    } catch (error) {
      showToast(
        isConflict(error) ? 'Există deja o activitate cu acest nume.' : 'Nu am putut salva activitatea.',
        { tone: 'danger' },
      )
    }
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    const name = newActivityName.trim()
    if (!name) return
    try {
      await createActivity.mutateAsync({ activity_name: name })
      setNewActivityName('')
      showToast('Activitate adăugată.')
    } catch (error) {
      showToast(
        isConflict(error) ? 'Există deja o activitate cu acest nume.' : 'Nu am putut adăuga activitatea.',
        { tone: 'danger' },
      )
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-[16px] font-semibold text-[var(--color-ink)]">Activități</h2>
        <p className="text-[13px] text-[var(--color-ink-muted)]">
          Activitățile disponibile pentru compania ta. Angajații își pot activa un tarif pentru oricare dintre ele.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {isLoading ? null : activities.length === 0 ? (
          <p className="text-[13px] text-[var(--color-ink-muted)]">Nicio activitate configurată încă.</p>
        ) : (
          activities.map((activity) =>
            editingId === activity.id ? (
              <div
                key={activity.id}
                className="flex items-center gap-1.5 rounded-full border border-[var(--color-primary)] bg-[var(--color-surface)] py-1 pl-3 pr-1.5"
              >
                <input
                  type="text"
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-28 bg-transparent text-[13px] outline-none"
                />
                <button
                  type="button"
                  onClick={() => saveRename(activity.id)}
                  disabled={updateActivity.isPending}
                  className="flex h-5 w-5 items-center justify-center rounded-full text-[var(--color-success)] hover:bg-[var(--color-success-soft)]"
                >
                  <CheckIcon className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="flex h-5 w-5 items-center justify-center rounded-full text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-2)]"
                >
                  <CloseIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div
                key={activity.id}
                className="flex items-center gap-2 rounded-full bg-[var(--color-surface-2)] py-1 pl-3 pr-2 text-[13px] text-[var(--color-ink)]"
              >
                <span
                  className="h-2 w-2 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: getActivityColor(activity.id) }}
                />
                {activity.activity_name}
                <button
                  type="button"
                  aria-label={`Editează ${activity.activity_name}`}
                  onClick={() => startEditing(activity.id, activity.activity_name)}
                  className="flex h-5 w-5 items-center justify-center rounded-full text-[var(--color-ink-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-primary)]"
                >
                  <PencilIcon className="h-3 w-3" />
                </button>
              </div>
            ),
          )
        )}
      </div>

      <form onSubmit={handleCreate} className="flex items-end gap-2">
        <fieldset className="fieldset flex-1">
          <legend className="fieldset-legend">Activitate nouă</legend>
          <input
            type="text"
            value={newActivityName}
            onChange={(e) => setNewActivityName(e.target.value)}
            placeholder="Ex: Curățenie"
            className="input w-full"
          />
        </fieldset>
        <button type="submit" disabled={createActivity.isPending || !newActivityName.trim()} className="btn btn-primary">
          Adaugă
        </button>
      </form>
    </div>
  )
}
