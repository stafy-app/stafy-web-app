import { useState, type FormEvent } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { AuthCard } from '@stafy/components/auth/AuthCard'
import { AuthError } from '@stafy/components/auth/AuthError'
import { AuthField } from '@stafy/components/auth/AuthField'
import { AUTH_LINK, AUTH_SUBMIT } from '@stafy/components/auth/authStyles'
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
      await completeRegistration({ firstName, lastName, role: 'owner' })
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
    <AuthCard
      title="Mai sunt câțiva pași"
      subtitle="Contul tău a fost creat, dar înregistrarea nu s-a finalizat ultima dată. Completează datele de mai jos ca să continui."
    >
      {error && <AuthError message={error} />}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <div className="grid grid-cols-2 gap-3">
          <AuthField
            label="Prenume"
            type="text"
            required
            autoComplete="given-name"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            placeholder="Andrei"
          />
          <AuthField
            label="Nume"
            type="text"
            required
            autoComplete="family-name"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            placeholder="Ticăra"
          />
        </div>

        <button type="submit" disabled={isSubmitting} className={AUTH_SUBMIT}>
          {isSubmitting ? <span className="loading loading-spinner loading-sm" /> : 'Continuă'}
        </button>
      </form>

      <p className="text-center text-sm">
        <button type="button" onClick={() => logout()} className={AUTH_LINK}>
          Deconectează-te
        </button>
      </p>
    </AuthCard>
  )
}
