import { useState, type FormEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { AuthCard } from '@stafy/components/auth/AuthCard'
import { AuthError } from '@stafy/components/auth/AuthError'
import { AuthField } from '@stafy/components/auth/AuthField'
import { AUTH_LINK, AUTH_SUBMIT } from '@stafy/components/auth/authStyles'
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
      await register({ firstName, lastName, email, password, role: 'owner' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'A apărut o eroare neașteptată')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthCard title="Creează un cont" subtitle="45 de zile gratuit, cu toate funcțiile. Fără card.">
      {error && <AuthError message={error} />}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid gap-5 sm:grid-cols-2 sm:gap-3">
          <AuthField
            label="Prenume"
            type="text"
            required
            autoComplete="given-name"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            placeholder="Prenumele tău"
            delay={60}
          />
          <AuthField
            label="Nume"
            type="text"
            required
            autoComplete="family-name"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            placeholder="Numele tău"
            delay={90}
          />
        </div>
        <AuthField
          label="Email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="nume@companie.ro"
          delay={130}
        />
        <AuthField
          label="Parolă"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Minim 6 caractere"
          delay={170}
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className={`${AUTH_SUBMIT} animate-fade-slide-in`}
          style={{ animationDelay: '210ms' }}
        >
          {isSubmitting ? <span className="loading loading-spinner loading-sm" /> : 'Creează un cont'}
        </button>
      </form>

      <p className="text-center text-sm text-[var(--color-ink-muted)]">
        Ai deja cont?{' '}
        <Link to="/login" className={AUTH_LINK}>
          Autentificare
        </Link>
      </p>
    </AuthCard>
  )
}
