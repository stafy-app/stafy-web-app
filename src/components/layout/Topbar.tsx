import { Link } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import { useTopBarState } from '../../hooks/useTopBar'

export function Topbar() {
  const { title, subtitle, breadcrumb, action } = useTopBarState()

  return (
    <header className="sticky top-0 z-10 flex min-h-[72px] flex-shrink-0 items-center gap-4 border-b border-[var(--color-line)] bg-white/85 px-8 py-3.5 [backdrop-filter:saturate(180%)_blur(12px)]">
      <div className="min-w-0 flex-1">
        {breadcrumb && breadcrumb.length > 0 && (
          <div className="mb-0.5 flex items-center gap-1.5 text-[12px] text-[var(--color-ink-muted)]">
            {breadcrumb.map((item, i) => {
              const isLast = i === breadcrumb.length - 1
              return (
                <span key={item.label} className="flex items-center gap-1.5">
                  {i > 0 && <ChevronRight className="h-3 w-3" />}
                  {isLast || !item.to ? (
                    <span>{item.label}</span>
                  ) : (
                    <Link
                      to={item.to}
                      className="text-[var(--color-ink-muted)] no-underline transition-colors hover:text-[var(--color-ink-soft)]"
                    >
                      {item.label}
                    </Link>
                  )}
                </span>
              )
            })}
          </div>
        )}
        <h1 className="truncate text-[22px] font-bold tracking-[-0.015em] text-[var(--color-ink)]">{title}</h1>
        {subtitle && <p className="mt-0.5 truncate text-[13px] text-[var(--color-ink-muted)]">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </header>
  )
}
