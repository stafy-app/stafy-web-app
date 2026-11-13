import type { ReactNode } from 'react'

interface AdminPageHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
}

/** Title block every admin page starts with: large title, one calm line under it, the page's main action on the right. */
export function AdminPageHeader({ title, subtitle, action }: AdminPageHeaderProps) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-[var(--color-ink)]">{title}</h1>
        {subtitle && (
          <p className="mt-1 max-w-2xl text-[14px] leading-relaxed text-[var(--color-ink-soft)]">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </header>
  )
}
