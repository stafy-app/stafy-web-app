import { useState, type FormEvent } from 'react'
import { useProfile } from '@stafy/hooks/useProfile'
import { useUpdateAccount } from '@stafy/hooks/useAccountSettings'
import { showToast } from '@stafy/lib/toast'
import type { UserOut } from '@stafy/api/generated/endpoints/index.schemas'

export function AccountSection() {
  const { data: profile } = useProfile()
  if (!profile) return null
  // Keyed by id so a different profile (shouldn't happen mid-session, but keeps the
  // invariant explicit) remounts the form with fresh draft state instead of an effect sync.
  return <AccountForm key={profile.id} profile={profile} />
}

function AccountForm({ profile }: { profile: UserOut }) {
  const { mutateAsync, isPending } = useUpdateAccount()

  const [firstName, setFirstName] = useState(profile.first_name ?? '')
  const [lastName, setLastName] = useState(profile.last_name ?? '')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    try {
      await mutateAsync({ first_name: firstName, last_name: lastName })
      showToast('Modificările au fost salvate.')
    } catch {
      showToast('Nu am putut salva modificările.', { tone: 'danger' })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <h2 className="text-[16px] font-semibold text-[var(--color-ink)]">Cont</h2>
        <p className="text-[13px] text-[var(--color-ink-muted)]">Datele tale personale de contact.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Prenume</legend>
          <input
            type="text"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="input w-full"
          />
        </fieldset>
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Nume</legend>
          <input
            type="text"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="input w-full"
          />
        </fieldset>
      </div>

      <fieldset className="fieldset">
        <legend className="fieldset-legend">Email</legend>
        <input type="email" value={profile.email ?? ''} disabled className="input w-full" />
      </fieldset>

      <fieldset className="fieldset">
        <legend className="fieldset-legend">Funcție</legend>
        <input type="text" value={profile.job_title ?? ''} disabled className="input w-full" />
      </fieldset>

      <div className="flex justify-end">
        <button type="submit" disabled={isPending} className="btn btn-primary">
          {isPending ? <span className="loading loading-spinner loading-sm" /> : 'Salvează modificările'}
        </button>
      </div>
    </form>
  )
}
