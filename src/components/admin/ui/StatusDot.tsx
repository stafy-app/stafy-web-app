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
export function StatusDot({
  tone,
  children,
  truncate = false,
}: {
  tone: StatusTone
  children: ReactNode
  /** Wrap long text over at most two lines (cut with an ellipsis after that, full text as the tooltip) instead of growing the cell. */
  truncate?: boolean
}) {
  return (
    <span
      className={`inline-flex gap-2 text-[13px] text-[var(--color-ink)] ${truncate ? 'max-w-full items-start' : 'items-center whitespace-nowrap'}`}
    >
      <span className={`h-2 w-2 shrink-0 rounded-full ${truncate ? 'mt-[5px]' : ''} ${DOT[tone]}`} aria-hidden />
      {truncate ? (
        <span className="line-clamp-2 min-w-0 break-words leading-snug" title={typeof children === 'string' ? children : undefined}>
          {children}
        </span>
      ) : (
        children
      )}
    </span>
  )
}
