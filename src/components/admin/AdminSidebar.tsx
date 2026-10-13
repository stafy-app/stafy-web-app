import { Link, useRouterState } from '@tanstack/react-router'
import { LogOut } from 'lucide-react'
import { ICONS, type IconName } from '@stafy/lib/icons'
import { useAuth } from '@stafy/hooks/useAuth'
import { useProfile } from '@stafy/hooks/useProfile'

interface AdminNavItem {
  to: string
  label: string
  icon: IconName
}

const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { to: '/admin', label: 'Privire generală', icon: 'dashboard' },
  { to: '/admin/companies', label: 'Companii', icon: 'building' },
  { to: '/admin/infra', label: 'Infra', icon: 'server' },
  { to: '/admin/audit', label: 'Audit', icon: 'history' },
  { to: '/admin/account', label: 'Cont', icon: 'user' },
]

function isActivePath(itemTo: string, pathname: string) {
  if (itemTo === '/admin') return pathname === itemTo
  return pathname === itemTo || pathname.startsWith(`${itemTo}/`)
}

// Dense, fixed-width rail on md+; a horizontal scroll strip below md. No
// collapse, no workspace switcher — the admin console is a desktop-first
// operator tool, not the manager-facing shell.
export function AdminSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const { logout } = useAuth()
  const { data: profile } = useProfile()

  return (
    <aside className="flex flex-shrink-0 flex-col border-b border-[var(--color-line)] bg-[var(--color-surface)] md:sticky md:top-0 md:h-screen md:w-[200px] md:border-b-0 md:border-r">
      <div className="flex items-center justify-between gap-2 px-4 py-3 md:py-5">
        <span className="font-mono text-[13px] font-bold tracking-wide text-[var(--color-ink)]">STAFY // ADMIN</span>
        <button
          type="button"
          onClick={() => logout()}
          aria-label="Deconectare"
          title="Deconectare"
          className="cursor-pointer text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-error)] md:hidden"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex gap-0.5 overflow-x-auto px-2 pb-2 md:flex-col md:overflow-visible md:pb-0">
        {ADMIN_NAV_ITEMS.map((item) => {
          const active = isActivePath(item.to, pathname)
          const Icon = ICONS[item.icon]
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-shrink-0 items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 font-mono text-[13px] no-underline transition-colors ${
                active
                  ? 'bg-[var(--color-primary-soft)] font-semibold text-[var(--color-primary-active)]'
                  : 'text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-2)]'
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? 'text-[var(--color-primary)]' : 'text-current'}`} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto hidden flex-col gap-2 border-t border-[var(--color-line)] px-4 py-4 md:flex">
        <div className="truncate font-mono text-[12px] text-[var(--color-ink-soft)]" title={profile?.email ?? undefined}>
          {profile?.email}
        </div>
        <div className="font-mono text-[11px] text-[var(--color-ink-muted)]">v{__APP_VERSION__}</div>
        <button
          type="button"
          onClick={() => logout()}
          className="flex cursor-pointer items-center gap-2 py-1 font-mono text-[12px] text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-error)]"
        >
          <LogOut className="h-3.5 w-3.5" />
          Deconectare
        </button>
      </div>
    </aside>
  )
}
