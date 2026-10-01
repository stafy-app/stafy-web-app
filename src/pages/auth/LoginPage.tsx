import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { AuthCard } from '@stafy/components/auth/AuthCard'
import { AuthError } from '@stafy/components/auth/AuthError'
import { AuthField } from '@stafy/components/auth/AuthField'
import { AUTH_LINK, AUTH_SUBMIT } from '@stafy/components/auth/authStyles'
import { useAuth } from '@stafy/hooks/useAuth'
import { OrphanRegistrationError } from '@stafy/utils/authError'
import { consumeBlockedMessage } from '@stafy/utils/authBlockedMessage'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
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
      if (err instanceof OrphanRegistrationError) {
        navigate({ to: '/complete-registration' })
        return
      }
      setError(err instanceof Error ? err.message : 'A apărut o eroare neașteptată')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthCard title="Bine ai revenit" subtitle="Intră în contul tău Stafy.">
      {error && <AuthError message={error} />}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <AuthField
          label="Email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="nume@companie.ro"
          delay={60}
        />
        <AuthField
          label="Parolă"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
          delay={110}
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className={`${AUTH_SUBMIT} animate-fade-slide-in`}
          style={{ animationDelay: '160ms' }}
        >
          {isSubmitting ? <span className="loading loading-spinner loading-sm" /> : 'Autentificare'}
        </button>
      </form>

      <p className="text-center text-sm text-[var(--color-ink-muted)]">
        Nu ai cont?{' '}
        <Link to="/register" className={AUTH_LINK}>
          Creează un cont
        </Link>
      </p>
    </AuthCard>
  )
}
