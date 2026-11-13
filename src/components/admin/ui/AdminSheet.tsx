import { useContext, type ReactNode } from 'react'
import { FlatSurfaceContext } from './surface'

/**
 * The one white surface of a page (flat, no card, inside a modal). Content inside is split into `AdminSheetSection`s separated by
 * hairlines, never into nested boxes: one surface level, no cards in cards.
 */
export function AdminSheet({ children }: { children: ReactNode }) {
  const flat = useContext(FlatSurfaceContext)
  return (
    <div
      className={`divide-y divide-[var(--color-line)] ${
        flat ? '' : 'overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]'
      }`}
    >
      {children}
    </div>
  )
}

interface AdminSheetSectionProps {
  title?: string
  caption?: string
  action?: ReactNode
  /** Content runs edge to edge (a table); the title keeps its padding. */
  flush?: boolean
  children: ReactNode
}

export function AdminSheetSection({ title, caption, action, flush = false, children }: AdminSheetSectionProps) {
  return (
    <section className="min-w-0">
      {(title || action) && (
        <div className="flex min-h-9 flex-wrap items-center justify-between gap-3 px-4 pt-4 sm:px-5">
          <div className="min-w-0">
            {title && <h2 className="text-[15px] font-semibold tracking-tight text-[var(--color-ink)]">{title}</h2>}
            {caption && <p className="text-[13px] text-[var(--color-ink-soft)]">{caption}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={flush ? (title || action ? 'pt-3' : '') : `px-4 pb-5 sm:px-5 ${title || action ? 'pt-3' : 'pt-5'}`}>
        {children}
      </div>
    </section>
  )
}
