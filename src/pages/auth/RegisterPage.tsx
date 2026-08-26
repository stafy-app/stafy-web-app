import { useState, type FormEvent } from 'react'
import { Link } from '@tanstack/react-router'
import logoMark from '@stafy/assets/stafy_logo.svg'
import { useAuth } from '@stafy/hooks/useAuth'

export default function RegisterPage() {
  const { register } = useAuth()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await register({ firstName, lastName, email, password })
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
        <h1 className="text-xl font-semibold text-[var(--color-ink)]">Creează cont</h1>
        <p className="mb-2 text-sm text-[var(--color-ink-muted)]">Cont de manager pentru compania ta</p>

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
                placeholder="Ion"
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
                placeholder="Popescu"
              />
            </fieldset>
          </div>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Email</legend>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="input w-full"
              placeholder="nume@companie.ro"
            />
          </fieldset>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Parolă</legend>
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="input w-full"
              placeholder="Minim 6 caractere"
            />
          </fieldset>
          <button type="submit" disabled={isSubmitting} className="btn btn-primary mt-2">
            {isSubmitting ? <span className="loading loading-spinner loading-sm" /> : 'Creează cont'}
          </button>
        </form>

        <p className="mt-3 text-center text-sm text-[var(--color-ink-muted)]">
          Ai deja cont?{' '}
          <Link to="/login" className="font-medium text-[var(--color-primary)] no-underline hover:underline">
            Autentificare
          </Link>
        </p>
      </div>
    </div>
  )
}
