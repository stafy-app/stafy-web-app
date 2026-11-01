import { useAuth } from '@stafy/hooks/useAuth'

interface AccessBlockedScreenProps {
  message: string
}

// Shown by `SessionGate` instead of the app when the backend answers 403 `user_blocked` or
// `company_suspended`. The only way out is signing out.
export function AccessBlockedScreen({ message }: AccessBlockedScreenProps) {
  const { logout } = useAuth()

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-page)] p-6">
      <div className="card w-full max-w-sm bg-[var(--color-surface)] text-center shadow-sm">
        <div className="card-body items-center gap-3">
          <h1 className="text-lg font-semibold text-[var(--color-ink)]">Acces restricționat</h1>
          <p className="text-sm text-[var(--color-ink-muted)]">{message}</p>
          <button type="button" className="btn btn-sm btn-outline mt-2" onClick={() => void logout()}>
            Deconectează-te
          </button>
        </div>
      </div>
    </div>
  )
}
