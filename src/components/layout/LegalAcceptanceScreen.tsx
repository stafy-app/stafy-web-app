import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getUsers } from '@stafy/api/generated/endpoints/users/users'
import { AuthCard } from '@stafy/components/auth/AuthCard'
import { AuthError } from '@stafy/components/auth/AuthError'
import { AuthShell } from '@stafy/components/auth/AuthShell'
import { LegalConsentCheckbox } from '@stafy/components/auth/LegalConsentCheckbox'
import { AUTH_LINK, AUTH_SUBMIT } from '@stafy/components/auth/authStyles'
import { useAuth } from '@stafy/hooks/useAuth'

// Shown by `SessionGate` instead of the app while `profile.needs_legal_acceptance` is true: an
// account created before acceptance existed, or one that accepted an older Terms/Privacy version
// (stafy-backend stafy/core/legal.py). Accepting refetches the profile, which lets the app through.
export function LegalAcceptanceScreen() {
  const { logout } = useAuth()
  const queryClient = useQueryClient()
  const [accepted, setAccepted] = useState(false)
  const accept = useMutation({
    mutationFn: () => getUsers().acceptLegalTerms({ accept_terms: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile'] }),
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    accept.mutate()
  }

  return (
    <AuthShell>
      <AuthCard
        title="Termeni și confidențialitate"
        subtitle="Ca să folosești în continuare Stafy, te rugăm să accepți Termenii și condițiile și să citești Politica de confidențialitate."
      >
        {accept.isError && <AuthError message="Nu am putut salva acceptarea. Mai încearcă o dată." />}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <LegalConsentCheckbox checked={accepted} onChange={setAccepted} />
          <button type="submit" disabled={accept.isPending} className={AUTH_SUBMIT}>
            {accept.isPending ? <span className="loading loading-spinner loading-sm" /> : 'Continuă'}
          </button>
        </form>

        <p className="text-center text-sm">
          <button type="button" onClick={() => void logout()} className={AUTH_LINK}>
            Deconectează-te
          </button>
        </p>
      </AuthCard>
    </AuthShell>
  )
}
