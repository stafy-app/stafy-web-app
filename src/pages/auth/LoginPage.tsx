import { useState, type FormEvent } from 'react'
import { Link } from '@tanstack/react-router'
import logoMark from '../../assets/stafy_logo.svg'
import { useAuth } from '../../hooks/useAuth'
import { consumeBlockedMessage } from '../../utils/authBlockedMessage'

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(() => consumeBlockedMessage())
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await login(email, password)
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
        <h1 className="text-xl font-semibold text-[var(--color-ink)]">Autentificare</h1>
        <p className="mb-2 text-sm text-[var(--color-ink-muted)]">Intră în contul tău de manager</p>

        {error && (
          <div role="alert" className="alert alert-error mb-2 text-sm">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="input w-full"
              placeholder="••••••••"
            />
          </fieldset>
          <button type="submit" disabled={isSubmitting} className="btn btn-primary mt-2">
            {isSubmitting ? <span className="loading loading-spinner loading-sm" /> : 'Autentificare'}
          </button>
        </form>

        <p className="mt-3 text-center text-sm text-[var(--color-ink-muted)]">
          Nu ai cont?{' '}
          <Link to="/register" className="font-medium text-[var(--color-primary)] no-underline hover:underline">
            Creează cont
          </Link>
        </p>
      </div>
    </div>
  )
}
