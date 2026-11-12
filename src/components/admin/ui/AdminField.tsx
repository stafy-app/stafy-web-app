import type { ReactNode } from 'react'

/** Control class shared by every admin input, select and textarea: a soft filled field. */
export const ADMIN_CONTROL = 'rounded-[var(--radius-lg)] bg-[var(--color-surface-2)]'

interface AdminFieldProps {
  label: string
  hint?: ReactNode
  error?: string | false | null
  className?: string
  children: ReactNode
}

/** Label above a control, with an optional hint under it and an error in place of the hint. */
export function AdminField({ label, hint, error, className = '', children }: AdminFieldProps) {
  return (
    <label className={`flex flex-col gap-1.5 text-[13px] font-medium text-[var(--color-ink-soft)] ${className}`}>
      {label}
      {children}
      {error ? (
        <span className="text-[13px] font-normal text-[var(--color-error)]">{error}</span>
      ) : (
        hint && <span className="text-[13px] font-normal text-[var(--color-ink-soft)]">{hint}</span>
      )}
    </label>
  )
}

interface DetailItem {
  label: string
  value: ReactNode
}

/**
 * Read-only facts as a two-column list: fixed-width labels, aligned values. The standard way to show data in a modal.
 * Below `sm` the label sits above its value.
 */
export function AdminDetailList({ items }: { items: DetailItem[] }) {
  return (
    <dl className="divide-y divide-[var(--color-line)] text-[14px]">
      {items.map((item) => (
        <div
          key={item.label}
          className="grid grid-cols-1 gap-0.5 py-2.5 first:pt-0 last:pb-0 sm:grid-cols-[160px_1fr] sm:gap-4"
        >
          <dt className="text-[13px] text-[var(--color-ink-soft)]">{item.label}</dt>
          <dd className="min-w-0 text-[var(--color-ink)]">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
