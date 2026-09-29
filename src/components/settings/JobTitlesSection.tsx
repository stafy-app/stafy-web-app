import { useState, type FormEvent } from 'react'
import {
  useCompanyJobTitles,
  useCreateCompanyJobTitle,
  useUpdateCompanyJobTitle,
  useDeleteCompanyJobTitle,
} from '@stafy/hooks/useCompanyJobTitles'
import { ICONS } from '@stafy/lib/icons'
import { showToast } from '@stafy/lib/toast'
import { getCodedErrorMessage } from '@stafy/services/apiErrors'

const PencilIcon = ICONS.pencil
const CheckIcon = ICONS.check
const CloseIcon = ICONS.close
const TrashIcon = ICONS.trash

function isConflict(error: unknown): boolean {
  return (error as { response?: { status?: number } })?.response?.status === 409
}

export function JobTitlesSection() {
  const { data, isLoading } = useCompanyJobTitles()
  const createJobTitle = useCreateCompanyJobTitle()
  const updateJobTitle = useUpdateCompanyJobTitle()
  const deleteJobTitle = useDeleteCompanyJobTitle()

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')
  const [newJobTitleName, setNewJobTitleName] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  const jobTitles = data?.data ?? []

  function startEditing(jobTitleId: number, currentLabel: string) {
    setEditingId(jobTitleId)
    setEditValue(currentLabel)
  }

  async function saveRename(jobTitleId: number) {
    const label = editValue.trim()
    if (!label) return
    try {
      await updateJobTitle.mutateAsync({ jobTitleId, data: { label } })
      setEditingId(null)
      showToast('Funcție actualizată.')
    } catch (error) {
      showToast(
        isConflict(error) ? 'Există deja o funcție cu acest nume.' : getCodedErrorMessage(error, 'Nu am putut salva funcția.'),
        { tone: 'danger' },
      )
    }
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    const label = newJobTitleName.trim()
    if (!label) return
    try {
      await createJobTitle.mutateAsync({ label })
      setNewJobTitleName('')
      showToast('Funcție adăugată.')
    } catch (error) {
      showToast(
        isConflict(error) ? 'Există deja o funcție cu acest nume.' : getCodedErrorMessage(error, 'Nu am putut adăuga funcția.'),
        { tone: 'danger' },
      )
    }
  }

  async function handleDelete(jobTitleId: number) {
    try {
      await deleteJobTitle.mutateAsync(jobTitleId)
      setConfirmDeleteId(null)
      showToast('Funcție ștearsă.')
    } catch (error) {
      showToast(getCodedErrorMessage(error, 'Nu am putut șterge funcția.'), { tone: 'danger' })
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-[16px] font-semibold text-[var(--color-ink)]">Funcții</h2>
        <p className="text-[13px] text-[var(--color-ink-muted)]">
          Funcțiile disponibile pentru compania ta — folosite la trimiterea invitațiilor de angajare.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {isLoading ? null : jobTitles.length === 0 ? (
          <p className="text-[13px] text-[var(--color-ink-muted)]">Nicio funcție configurată încă.</p>
        ) : (
          jobTitles.map((jobTitle) =>
            editingId === jobTitle.id ? (
              <div
                key={jobTitle.id}
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
                  onClick={() => saveRename(jobTitle.id)}
                  disabled={updateJobTitle.isPending}
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
            ) : confirmDeleteId === jobTitle.id ? (
              <div
                key={jobTitle.id}
                className="flex items-center gap-2 rounded-full border border-[var(--color-error)] bg-[var(--color-surface)] py-1 pl-3 pr-1.5 text-[13px]"
              >
                <span className="text-[var(--color-ink-muted)]">Ștergi „{jobTitle.label}”?</span>
                <button
                  type="button"
                  onClick={() => handleDelete(jobTitle.id)}
                  disabled={deleteJobTitle.isPending}
                  className="text-[12px] font-semibold text-[var(--color-error)] disabled:opacity-50"
                >
                  Da
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
              <div
                key={jobTitle.id}
                className="flex items-center gap-2 rounded-full bg-[var(--color-surface-2)] py-1 pl-3 pr-2 text-[13px] text-[var(--color-ink)]"
              >
                {jobTitle.label}
                <button
                  type="button"
                  aria-label={`Editează ${jobTitle.label}`}
                  onClick={() => startEditing(jobTitle.id, jobTitle.label)}
                  className="flex h-5 w-5 items-center justify-center rounded-full text-[var(--color-ink-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-primary)]"
                >
                  <PencilIcon className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  aria-label={`Șterge ${jobTitle.label}`}
                  onClick={() => setConfirmDeleteId(jobTitle.id)}
                  className="flex h-5 w-5 items-center justify-center rounded-full text-[var(--color-ink-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-error)]"
                >
                  <TrashIcon className="h-3 w-3" />
                </button>
              </div>
            ),
          )
        )}
      </div>

      <form onSubmit={handleCreate} className="flex items-end gap-2">
        <fieldset className="fieldset flex-1">
          <legend className="fieldset-legend">Funcție nouă</legend>
          <input
            type="text"
            value={newJobTitleName}
            onChange={(e) => setNewJobTitleName(e.target.value)}
            placeholder="Ex: Coordonator"
            className="input w-full"
          />
        </fieldset>
        <button type="submit" disabled={createJobTitle.isPending || !newJobTitleName.trim()} className="btn btn-primary">
          Adaugă
        </button>
      </form>
    </div>
  )
}
