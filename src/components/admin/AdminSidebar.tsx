import { useEffect, useRef } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { LogOut } from 'lucide-react'
import { ICONS, type IconName } from '@stafy/lib/icons'
import { useAuth } from '@stafy/hooks/useAuth'
import { useProfile } from '@stafy/hooks/useProfile'
import { ThemeToggleButton } from '@stafy/components/layout/ThemeToggle'

interface AdminNavItem {
  to: string
  label: string
  icon: IconName
}

interface AdminNavGroup {
  title?: string
  items: AdminNavItem[]
}

const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  { items: [{ to: '/admin', label: 'Privire generală', icon: 'dashboard' }] },
  {
    title: 'Operare',
    items: [
      { to: '/admin/companies', label: 'Companii', icon: 'building' },
      { to: '/admin/announcements', label: 'Anunțuri', icon: 'megaphone' },
    ],
  },
  {
    title: 'Platformă',
    items: [
      { to: '/admin/infra', label: 'Infrastructură', icon: 'server' },
      { to: '/admin/audit', label: 'Audit', icon: 'history' },
    ],
  },
]

const APP_ITEM: AdminNavItem = { to: '/me', label: 'Aplicația', icon: 'home' }
const ACCOUNT_ITEM: AdminNavItem ={ to: '/admin/account', label: 'Cont', icon: 'user' }

function isActivePath(itemTo: string, pathname: string) {
  if (itemTo === '/admin') return pathname === itemTo
  return pathname === itemTo || pathname.startsWith(`${itemTo}/`)
}

function NavLink({ item, pathname }: { item: AdminNavItem; pathname: string }) {
  const active = isActivePath(item.to, pathname)
  const Icon = ICONS[item.icon]
  return (
    <Link
      to={item.to}
      data-active={active || undefined}
      className={`flex flex-shrink-0 items-center gap-2.5 rounded-[var(--radius-lg)] px-3 py-2 text-[14px] font-medium no-underline transition-colors duration-200 ${
        active
          ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary-text)]'
          : 'text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)]'
      }`}
    >
      <Icon className={`h-[18px] w-[18px] ${active ? 'text-[var(--color-primary)]' : 'text-current'}`} />
      {item.label}
    </Link>
  )
}

// Translucent rail on md+, a horizontal strip below md. Items are grouped by what the admin does with
// them (Operare) versus how the platform is doing (Platformă); the account sits at the bottom.
export function AdminSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const { logout } = useAuth()
  const { data: profile } = useProfile()
  const navRef = useRef<HTMLElement>(null)

  // Below md the nav is a horizontal strip: keep the active item in view (e.g. Audit, past the right edge).
  useEffect(() => {
    const nav = navRef.current
    if (!nav || nav.scrollWidth <= nav.clientWidth) return
    nav.querySelector('[data-active]')?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }, [pathname])

  return (
    <aside className="flex flex-shrink-0 flex-col border-b border-[var(--color-hairline)] bg-[var(--color-glass)] backdrop-blur-xl md:sticky md:top-0 md:h-screen md:w-[236px] md:border-b-0 md:border-r">
      <div className="flex items-center justify-between gap-2 px-5 py-4 md:pb-6 md:pt-6">
        <div className="flex items-baseline gap-2">
          <span className="text-[18px] font-semibold tracking-tight text-[var(--color-ink)]">Stafy</span>
          <span className="text-[13px] font-medium text-[var(--color-primary)]">Admin</span>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggleButton />
          <button
            type="button"
            onClick={() => logout()}
            aria-label="Deconectare"
            title="Deconectare"
            className="cursor-pointer p-2 text-[var(--color-ink-soft)] transition-colors hover:text-[var(--color-error)] md:hidden"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      <nav ref={navRef} className="flex gap-1 overflow-x-auto px-3 pb-2 md:flex-1 md:flex-col md:gap-5 md:overflow-visible md:pb-0">
        {ADMIN_NAV_GROUPS.map((group, index) => (
          // shrink-0: in the phone strip a group must keep its full width, or its links spill over the next group.
          <div key={group.title ?? index} className="flex shrink-0 gap-1 md:flex-col">
            {group.title && (
              <div className="hidden px-3 pb-1 text-[12px] font-medium text-[var(--color-ink-soft)] md:block">
                {group.title}
              </div>
            )}
            {group.items.map((item) => (
              <NavLink key={item.to} item={item} pathname={pathname} />
            ))}
          </div>
        ))}
        <div className="flex shrink-0 gap-1 md:mt-auto md:flex-col">
          <NavLink item={APP_ITEM} pathname={pathname} />
          <NavLink item={ACCOUNT_ITEM} pathname={pathname} />
        </div>
      </nav>

      <div className="hidden flex-col gap-1 border-t border-[var(--color-hairline)] px-5 py-4 md:flex">
        <div className="truncate text-[13px] text-[var(--color-ink-soft)]" title={profile?.email ?? undefined}>
          {profile?.email}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-[var(--color-ink-soft)] tabular-nums">v{__APP_VERSION__}</span>
          <button
            type="button"
            onClick={() => logout()}
            className="flex cursor-pointer items-center gap-1.5 text-[13px] text-[var(--color-ink-soft)] transition-colors hover:text-[var(--color-error)]"
          >
            <LogOut className="h-3.5 w-3.5" />
            Deconectare
          </button>
        </div>
      </div>
    </aside>
  )
}
