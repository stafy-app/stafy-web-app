import { useTopBar } from '@stafy/hooks/useTopBar'
import { useAuth } from '@stafy/hooks/useAuth'
import { useProfile } from '@stafy/hooks/useProfile'
import { AccountSection } from '@stafy/components/settings/AccountSection'
import { SecuritySection } from '@stafy/components/settings/SecuritySection'

export default function MyProfilePage() {
  useTopBar({ title: 'Profilul meu', subtitle: 'Datele contului și securitate' })
  const { logout } = useAuth()
  const { data: profile } = useProfile()

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-4 sm:gap-5">
      <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)] sm:p-6">
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-[16px] font-semibold text-[var(--color-ink)]">Companie</h2>
            <p className="text-[13px] text-[var(--color-ink-muted)]">
              {profile?.is_own_company === false
                ? 'Ești membru într-o companie administrată de alt manager.'
                : 'Aceasta este compania asociată contului tău.'}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-2)] px-4 py-3">
              <div className="text-[12px] text-[var(--color-ink-muted)]">Nume companie</div>
              <div className="mt-1 font-medium text-[var(--color-ink)]">{profile?.company_name ?? 'Nespecificată'}</div>
            </div>
            <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-2)] px-4 py-3">
              <div className="text-[12px] text-[var(--color-ink-muted)]">Tip asociere</div>
              <div className="mt-1 font-medium text-[var(--color-ink)]">
                {profile?.is_own_company === false ? 'Membru al companiei' : 'Companie proprie'}
              </div>
            </div>
          </div>
        </section>
      </div>
      <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)] sm:p-6">
        <AccountSection />
      </div>
      <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)] sm:p-6">
        <SecuritySection />
      </div>
      <button
        type="button"
        onClick={() => logout()}
        className="btn btn-ghost min-h-12 w-full text-[var(--color-error)] md:hidden sm:w-auto sm:self-start"
      >
        Deconectează-te
      </button>
    </div>
  )
}
