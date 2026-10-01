import { Link, useRouterState } from '@tanstack/react-router'
import { Clock, History, Home, Tags, User, Users, Mail, Download, Settings } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useProfile } from '@stafy/hooks/useProfile'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

const COMPANY_NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Acasă', icon: Home },
  { to: '/team', label: 'Echipă', icon: Users },
  { to: '/invitations', label: 'Invitații', icon: Mail },
  { to: '/reports', label: 'Rapoarte', icon: Download },
  { to: '/settings', label: 'Setări', icon: Settings },
]

const PERSONAL_NAV_ITEMS: NavItem[] = [
  { to: '/me', label: 'Acasă', icon: Home },
  { to: '/me/attendance', label: 'Pontaj', icon: Clock },
  { to: '/me/history', label: 'Istoric', icon: History },
  { to: '/me/rates', label: 'Tarife', icon: Tags },
  { to: '/me/profile', label: 'Profil', icon: User },
]

function isActivePath(itemTo: string, pathname: string) {
  if (itemTo === '/' || itemTo === '/me') return pathname === itemTo
  return pathname === itemTo || pathname.startsWith(`${itemTo}/`)
}

// Bottom navigation bar for phones (<md): same items as the sidebar's current
// workspace, thumb-reachable, safe-area aware. The desktop Sidebar stays
// untouched above the breakpoint (hidden there via md:hidden on both sides).
export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const { data: profile } = useProfile()
  const isEmployee = profile?.role === 'employee'
  const navItems = isEmployee
    ? PERSONAL_NAV_ITEMS
    : pathname === '/me' || pathname.startsWith('/me/')
      ? PERSONAL_NAV_ITEMS
      : COMPANY_NAV_ITEMS

  return (
    <nav
      aria-label="Navigare principală"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--color-line)] bg-[var(--color-surface)] md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="grid" style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }}>
        {navItems.map((item) => {
          const active = isActivePath(item.to, pathname)
          const Icon = item.icon
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-[60px] flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium no-underline transition-colors ${
                active ? 'text-[var(--color-primary-active)]' : 'text-[var(--color-ink-muted)]'
              }`}
            >
              <Icon className={`h-6 w-6 ${active ? 'text-[var(--color-primary)]' : 'text-current'}`} />
              <span className={active ? 'font-semibold' : ''}>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
