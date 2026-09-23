import { useTopBar } from '@stafy/hooks/useTopBar'
import { useAuth } from '@stafy/hooks/useAuth'
import { AccountSection } from '@stafy/components/settings/AccountSection'
import { SecuritySection } from '@stafy/components/settings/SecuritySection'

export default function MyProfilePage() {
  useTopBar({ title: 'Profilul meu', subtitle: 'Datele contului și securitate' })
  const { logout } = useAuth()

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-4 sm:gap-5">
      <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)] sm:p-6">
        <AccountSection />
      </div>
      <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)] sm:p-6">
        <SecuritySection />
      </div>
      <button
        type="button"
        onClick={() => logout()}
        className="btn btn-ghost min-h-12 w-full text-[var(--color-error)] sm:w-auto sm:self-start"
      >
        Deconectează-te
      </button>
    </div>
  )
}
