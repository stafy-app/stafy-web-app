import { useProfile } from '@stafy/hooks/useProfile'
import { useSendPasswordResetEmail } from '@stafy/hooks/useSendPasswordResetEmail'
import { showToast } from '@stafy/lib/toast'

export function SecuritySection() {
  const { data: profile } = useProfile()
  const { mutateAsync, isPending } = useSendPasswordResetEmail()

  const canResetPassword = profile?.auth_provider === 'email_password'

  async function handleSendResetEmail() {
    if (!profile?.email) return
    try {
      await mutateAsync(profile.email)
      showToast('Ți-am trimis un email pentru resetarea parolei.')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Nu am putut trimite emailul.', { tone: 'danger' })
    }
  }

  function handleDeleteAccount() {
    showToast('Funcționalitate indisponibilă momentan.', { tone: 'warning' })
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-[16px] font-semibold text-[var(--color-ink)]">Securitate</h2>
        <p className="text-[13px] text-[var(--color-ink-muted)]">Parola contului și opțiuni ireversibile.</p>
      </div>

      {canResetPassword ? (
        <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface-2)] p-5">
          <p className="text-[13px] text-[var(--color-ink-soft)]">
            Îți trimitem un email cu un link pentru a-ți seta o parolă nouă.
          </p>
          <button
            type="button"
            onClick={handleSendResetEmail}
            disabled={isPending}
            className="btn btn-primary mt-3"
          >
            {isPending ? <span className="loading loading-spinner loading-sm" /> : 'Trimite email de resetare a parolei'}
          </button>
        </div>
      ) : (
        <p className="text-[13px] text-[var(--color-ink-muted)]">
          Contul tău este conectat printr-un furnizor extern — parola se gestionează de acolo, nu din Stafy.
        </p>
      )}

      <div className="rounded-[var(--radius-lg)] border border-[var(--color-error)] bg-[var(--color-error-soft)]/40 p-5">
        <h3 className="text-[14px] font-semibold text-[var(--color-error)]">Zonă periculoasă</h3>
        <p className="mt-1 text-[13px] text-[var(--color-ink-soft)]">
          Ștergerea contului este permanentă și nu poate fi anulată.
        </p>
        <button
          type="button"
          onClick={handleDeleteAccount}
          className="btn btn-outline btn-error mt-3"
        >
          Șterge contul
        </button>
      </div>
    </div>
  )
}
