import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { Home, Users, Mail, Download, Settings, ChevronLeft, LogOut } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import logoMark from '@stafy/assets/stafy_logo.svg'
import { useAuth } from '@stafy/hooks/useAuth'
import { useProfile } from '@stafy/hooks/useProfile'
import { useTeam } from '@stafy/hooks/useTeam'
import { getInitials } from '@stafy/utils/initials'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  badge?: 'team' | 'invitations'
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Acasă', icon: Home },
  { to: '/team', label: 'Echipă', icon: Users, badge: 'team' },
  { to: '/invitations', label: 'Invitații', icon: Mail, badge: 'invitations' },
  { to: '/reports', label: 'Rapoarte', icon: Download },
  { to: '/settings', label: 'Setări', icon: Settings },
]

const STORAGE_KEY = 'stafy.sidebar.collapsed'

function isActivePath(itemTo: string, pathname: string) {
  return itemTo === '/' ? pathname === '/' : pathname.startsWith(itemTo)
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(STORAGE_KEY) === '1')
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  const { logout } = useAuth()
  const { data: profile } = useProfile()
  const { data: team } = useTeam()
  const teamCount = team?.data.filter((u) => u.role === 'employee').length

  const pillRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef(new Map<string, HTMLAnchorElement>())

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0')
  }, [collapsed])

  useLayoutEffect(() => {
    const activeItem = NAV_ITEMS.find((item) => isActivePath(item.to, pathname))
    const pill = pillRef.current
    const el = activeItem ? itemRefs.current.get(activeItem.to) : undefined
    if (!pill) return
    if (!el) {
      pill.style.opacity = '0'
      return
    }
    pill.style.top = `${el.offsetTop}px`
    pill.style.height = `${el.offsetHeight}px`
    pill.style.opacity = '1'
  }, [pathname, collapsed])

  const initials = getInitials(profile?.first_name, profile?.last_name)
  const fullName = profile ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') : 'Se încarcă...'

  return (
    <aside
      className={`sticky top-0 z-20 flex h-screen flex-shrink-0 flex-col border-r border-[var(--color-line)] bg-[var(--color-surface)] py-5 transition-[width,padding] duration-[220ms] ease-[var(--ease-out)] ${
        collapsed ? 'w-[72px] px-[10px]' : 'w-[240px] px-[14px]'
      }`}
    >
      <div
        className={`mb-8 flex min-h-[28px] items-center transition-[gap] duration-[220ms] ease-[var(--ease-out)] ${
          collapsed ? 'justify-center gap-0' : 'justify-between gap-2'
        }`}
      >
        <div
          className={`flex items-center overflow-hidden transition-[gap] duration-[220ms] ease-[var(--ease-out)] ${
            collapsed ? 'gap-0' : 'gap-2'
          }`}
        >
          <img src={logoMark} alt="Stafy" className="h-7 w-7 flex-shrink-0 rounded-[7px]" />
          <span
            className={`overflow-hidden whitespace-nowrap text-[18px] font-bold text-[var(--color-ink)] transition-[max-width,opacity] duration-[220ms] ease-[var(--ease-out)] ${
              collapsed ? 'max-w-0 opacity-0' : 'max-w-[120px] opacity-100'
            }`}
          >
            Stafy
          </span>
        </div>
        <button
          type="button"
          aria-label="Restrânge meniul"
          title="Restrânge meniul"
          onClick={() => setCollapsed(true)}
          className={`flex flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border text-[var(--color-ink-soft)] transition-[opacity,background-color,width,height,border-width] duration-[220ms] ease-[var(--ease-out)] hover:bg-[var(--color-surface-2)] ${
            collapsed
              ? 'pointer-events-none h-0 w-0 border-0 opacity-0'
              : 'h-6 w-6 border-[var(--color-line)] opacity-100'
          }`}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
      </div>

      <button
        type="button"
        aria-label="Extinde meniul"
        title="Extinde meniul"
        onClick={() => setCollapsed(false)}
        className={`absolute -right-3 top-5 z-10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink-soft)] shadow-[var(--shadow-sm)] transition-[opacity,background-color] duration-[180ms] hover:bg-[var(--color-surface-2)] ${
          collapsed ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <ChevronLeft className="h-3.5 w-3.5 rotate-180" />
      </button>

      <nav className="relative flex flex-col gap-0.5">
        <div
          ref={pillRef}
          className="absolute left-0 right-0 z-0 rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] opacity-0 transition-[top,height] duration-[220ms] ease-[var(--ease-out)]"
        />
        {NAV_ITEMS.map((item) => {
          const active = isActivePath(item.to, pathname)
          const Icon = item.icon
          const count = item.badge === 'team' ? teamCount : undefined
          return (
            <Link
              key={item.to}
              to={item.to}
              ref={(el) => {
                if (el) itemRefs.current.set(item.to, el)
                else itemRefs.current.delete(item.to)
              }}
              aria-label={item.label}
              title={collapsed && count ? `${item.label} (${count})` : item.label}
              className={`relative z-10 flex items-center rounded-[var(--radius-md)] text-[14px] font-medium no-underline transition-[color,background-color,padding,gap] duration-[220ms] ease-[var(--ease-out)] ${
                collapsed ? 'justify-center gap-0 px-0 py-[11px]' : 'gap-2.5 px-3 py-2.5'
              } ${
                active
                  ? 'font-semibold text-[var(--color-primary-active)]'
                  : 'text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-2)]'
              }`}
            >
              <span className="relative flex flex-shrink-0">
                <Icon className={`h-[18px] w-[18px] ${active ? 'text-[var(--color-primary)]' : 'text-current'}`} />
                {collapsed && !!count && (
                  <span className="absolute -right-1.5 -top-1 h-4 w-4 rounded-full border-2 border-[var(--color-surface)] bg-[var(--color-primary)]" />
                )}
              </span>
              <span
                className={`overflow-hidden text-ellipsis whitespace-nowrap transition-[max-width,opacity] duration-[220ms] ease-[var(--ease-out)] ${
                  collapsed ? 'max-w-0 opacity-0' : 'max-w-[140px] opacity-100'
                }`}
              >
                {item.label}
              </span>
              {!!count && (
                <span
                  className={`ml-auto overflow-hidden rounded-full font-[var(--font-mono)] text-[11px] transition-[max-width,opacity,padding] duration-[220ms] ease-[var(--ease-out)] ${
                    collapsed ? 'max-w-0 px-0 py-[2px] opacity-0' : 'max-w-[32px] px-[7px] py-[2px] opacity-100'
                  } ${
                    active
                      ? 'bg-[var(--color-primary-soft-strong)] text-[var(--color-primary-active)]'
                      : 'bg-[var(--color-surface-2)] text-[var(--color-ink-muted)]'
                  }`}
                >
                  {count}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-2.5 border-t border-[var(--color-line)] pt-4">
        <div
          className={`flex items-center overflow-hidden transition-[gap] duration-[220ms] ease-[var(--ease-out)] ${
            collapsed ? 'justify-center gap-0' : 'gap-2.5'
          }`}
        >
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[12px] font-bold text-[var(--color-primary-active)]">
            {initials}
          </div>
          <div
            className={`overflow-hidden transition-[max-width,opacity] duration-[220ms] ease-[var(--ease-out)] ${
              collapsed ? 'max-w-0 opacity-0' : 'max-w-[160px] opacity-100'
            }`}
          >
            <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-semibold text-[var(--color-ink)]">
              {fullName}
            </div>
            <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[12px] text-[var(--color-ink-muted)]">
              Manager
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => logout()}
          aria-label="Deconectare"
          title="Deconectare"
          className={`flex cursor-pointer items-center rounded-[var(--radius-md)] text-[12px] font-medium text-[var(--color-ink-muted)] transition-[color,gap,padding] duration-[180ms] hover:text-[var(--color-error)] ${
            collapsed ? 'justify-center gap-0 px-0 py-1.5' : 'gap-2 px-1 py-1.5'
          }`}
        >
          <LogOut className="h-3.5 w-3.5 flex-shrink-0" />
          <span
            className={`overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-[220ms] ease-[var(--ease-out)] ${
              collapsed ? 'max-w-0 opacity-0' : 'max-w-[100px] opacity-100'
            }`}
          >
            Deconectare
          </span>
        </button>
      </div>
    </aside>
  )
}
