import { useState, type FormEvent } from 'react'
import { useProfile } from '@stafy/hooks/useProfile'
import { useUpdateAccount } from '@stafy/hooks/useAccountSettings'
import { useSendPasswordResetEmail } from '@stafy/hooks/useSendPasswordResetEmail'
import { ADMIN_CONTROL, AdminField } from '@stafy/components/admin/ui/AdminField'
import { AdminPageHeader } from '@stafy/components/admin/ui/AdminPageHeader'
import { AdminSheet, AdminSheetSection } from '@stafy/components/admin/ui/AdminSheet'
import { ThemeSwitch } from '@stafy/components/layout/ThemeToggle'
import { showToast } from '@stafy/lib/toast'
import type { UserOut } from '@stafy/api/generated/endpoints/index.schemas'

function ProfileForm({ profile }: { profile: UserOut }) {
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
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <AdminField label="Prenume">
          <input
            type="text"
            required
            className={`input w-full ${ADMIN_CONTROL}`}
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
          />
        </AdminField>
        <AdminField label="Nume">
          <input
            type="text"
            required
            className={`input w-full ${ADMIN_CONTROL}`}
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
          />
        </AdminField>
      </div>
      <AdminField label="Email" hint="Emailul nu se poate schimba de aici.">
        <input type="email" disabled className={`input w-full ${ADMIN_CONTROL}`} value={profile.email ?? ''} />
      </AdminField>
      <div>
        <button type="submit" className="btn btn-primary btn-sm" disabled={isPending}>
          Salvează modificările
        </button>
      </div>
    </form>
  )
}

function PasswordReset({ profile }: { profile: UserOut }) {
  const { mutateAsync, isPending } = useSendPasswordResetEmail()

  if (profile.auth_provider !== 'email_password') {
    return (
      <p className="text-[14px] text-[var(--color-ink-soft)]">
        Te conectezi cu un cont extern, așa că parola o schimbi de acolo, nu din Stafy.
      </p>
    )
  }

  async function handleSend() {
    if (!profile.email) return
    try {
      await mutateAsync(profile.email)
      showToast('Ți-am trimis un email pentru resetarea parolei.')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Nu am putut trimite emailul.', { tone: 'danger' })
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="max-w-md text-[14px] text-[var(--color-ink-soft)]">
        Îți trimitem pe email un link cu care îți setezi o parolă nouă.
      </p>
      <button type="button" className="btn btn-outline btn-sm" onClick={handleSend} disabled={isPending}>
        {isPending ? <span className="loading loading-spinner loading-sm" /> : 'Trimite linkul de resetare'}
      </button>
    </div>
  )
}

/** The admin's own account in the console's form style. Same hooks as the Settings account and security sections. */
export function AdminAccountSection() {
  const { data: profile } = useProfile()

  return (
    <>
      <AdminPageHeader title="Cont" subtitle="Datele tale de contact și parola contului de admin." />
      {profile && (
        <AdminSheet>
          <AdminSheetSection title="Date personale">
            <ProfileForm key={profile.id} profile={profile} />
          </AdminSheetSection>
          <AdminSheetSection title="Aspect">
            <ThemeSwitch />
          </AdminSheetSection>
          <AdminSheetSection title="Parolă">
            <PasswordReset profile={profile} />
          </AdminSheetSection>
        </AdminSheet>
      )}
    </>
  )
}
