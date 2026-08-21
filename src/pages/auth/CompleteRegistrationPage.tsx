import { useState, type FormEvent } from 'react'
import { useNavigate } from '@tanstack/react-router'
import logoMark from '@stafy/assets/stafy_logo.svg'
import { useAuth } from '@stafy/hooks/useAuth'

export default function CompleteRegistrationPage() {
  const { completeRegistration, logout } = useAuth()
  const navigate = useNavigate()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await completeRegistration({ firstName, lastName })
      // CompleteRegistrationLayout's gate only checks "signed in", not
      // "onboarded" — it can't, no profile exists until this call succeeds.
      // Navigate explicitly; AppLayout's own gate takes it from here
      // (redirects to /onboarding, same as a fresh register()).
      navigate({ to: '/' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'A apărut o eroare neașteptată')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="card w-full max-w-sm bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="mb-1 flex items-center gap-2">
          <img src={logoMark} alt="Stafy" className="h-8 w-8 rounded-[7px]" />
          <span className="text-[20px] font-bold text-[var(--color-ink)]">Stafy</span>
        </div>
        <h1 className="text-xl font-semibold text-[var(--color-ink)]">Mai sunt câțiva pași</h1>
        <p className="mb-2 text-sm text-[var(--color-ink-muted)]">
          Contul tău a fost creat, dar înregistrarea nu s-a finalizat ultima dată. Completează datele
          de mai jos ca să continui.
        </p>

        {error && (
          <div role="alert" className="alert alert-error mb-2 text-sm">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Prenume</legend>
              <input
                type="text"
                required
                autoComplete="given-name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                className="input w-full"
                placeholder="Andrei"
              />
            </fieldset>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Nume</legend>
              <input
                type="text"
                required
                autoComplete="family-name"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                className="input w-full"
                placeholder="Ticăra"
              />
            </fieldset>
          </div>
          <button type="submit" disabled={isSubmitting} className="btn btn-primary mt-2">
            {isSubmitting ? <span className="loading loading-spinner loading-sm" /> : 'Continuă'}
          </button>
        </form>

        <p className="mt-3 text-center text-sm text-[var(--color-ink-muted)]">
          <button
            type="button"
            onClick={() => logout()}
            className="font-medium text-[var(--color-primary)] hover:underline"
          >
            Deconectează-te
          </button>
        </p>
      </div>
    </div>
  )
}
