import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { FlatSurfaceContext } from '@stafy/components/admin/ui/surface'

interface AdminModalProps {
  title: string
  subtitle?: string
  /** Row under the title, e.g. a segmented control. */
  toolbar?: ReactNode
  /** Right-aligned action row pinned to the bottom (a form's buttons). */
  footer?: ReactNode
  onClose: () => void
  /** Wider sheet for editors with a side panel (e.g. a live preview). */
  wide?: boolean
  children: ReactNode
}

/**
 * Modal for the admin console's edit surfaces: a fixed header, a flat white body (no cards, sections divided by
 * hairlines) that scrolls on its own, an optional pinned footer. Closes on the X, the backdrop and Escape.
 */
export function AdminModal({ title, subtitle, toolbar, footer, onClose, wide = false, children }: AdminModalProps) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="modal modal-open modal-middle" role="dialog" aria-modal="true" aria-label={title}>
      <div
        className={`modal-box flex h-[min(680px,88vh)] w-11/12 ${wide ? 'max-w-6xl' : 'max-w-4xl'} flex-col gap-0 overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-surface)] p-0 shadow-[var(--shadow-pop)]`}
      >
        <div className="flex flex-col gap-4 bg-[var(--color-surface)] px-6 pb-4 pt-5 shadow-[0_1px_0_var(--color-hairline)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-[20px] font-semibold tracking-tight text-[var(--color-ink)]">{title}</h3>
              {subtitle && <p className="text-[14px] text-[var(--color-ink-soft)]">{subtitle}</p>}
            </div>
            <button type="button" className="btn btn-ghost btn-sm btn-circle" aria-label="Închide" onClick={onClose}>
              <X className="h-4 w-4" />
            </button>
          </div>
          {toolbar}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <FlatSurfaceContext.Provider value>{children}</FlatSurfaceContext.Provider>
        </div>
        {footer && (
          <div className="flex items-center justify-end gap-2 bg-[var(--color-surface)] px-6 py-3 shadow-[0_-1px_0_var(--color-hairline)]">
            {footer}
          </div>
        )}
      </div>
      <div className="modal-backdrop bg-black/20 backdrop-blur-sm" onClick={onClose} />
    </div>
  )
}
