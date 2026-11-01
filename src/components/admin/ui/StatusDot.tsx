import type { ReactNode } from 'react'

export type StatusTone = 'success' | 'warning' | 'error' | 'info' | 'neutral'

const DOT: Record<StatusTone, string> = {
  success: 'bg-[var(--color-success)]',
  warning: 'bg-[var(--color-warning)]',
  error: 'bg-[var(--color-error)]',
  info: 'bg-[var(--color-info)]',
  neutral: 'bg-[var(--color-ink-muted)]',
}

/** Status as a colored dot plus plain text: quieter than a badge, readable at a glance. */
export function StatusDot({ tone, children }: { tone: StatusTone; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-[13px] text-[var(--color-ink)]">
      <span className={`h-2 w-2 shrink-0 rounded-full ${DOT[tone]}`} aria-hidden />
      {children}
    </span>
  )
}
