import { useEffect, useState } from 'react'
import { Info, OctagonAlert, TriangleAlert, X, type LucideIcon } from 'lucide-react'
import { useActiveAnnouncements, useDismissAnnouncement } from '@stafy/hooks/useAnnouncements'

const SEVERITY: Record<string, { label: string; Icon: LucideIcon; tone: string; soft: string; dot: string }> = {
  info: { label: 'Informare', Icon: Info, tone: 'text-info', soft: 'bg-info/10', dot: 'bg-info' },
  warning: { label: 'Avertisment', Icon: TriangleAlert, tone: 'text-warning', soft: 'bg-warning/10', dot: 'bg-warning' },
  critical: { label: 'Important', Icon: OctagonAlert, tone: 'text-error', soft: 'bg-error/10', dot: 'bg-error' },
}

/**
 * Platform announcements as a modal over the whole app, one at a time, most severe first. Severity is
 * only an accent (icon tint and a dot), the card stays neutral. "Am înțeles" hides a non-critical one
 * for good (server-side); closing any announcement otherwise (X, backdrop, Escape) hides it only until
 * the page is reloaded, which is also all a `critical` one allows.
 */
export function AnnouncementModal() {
  const { data } = useActiveAnnouncements()
  const dismiss = useDismissAnnouncement()
  const [closedIds, setClosedIds] = useState<number[]>([])

  const queue = (data?.data ?? []).filter((announcement) => !closedIds.includes(announcement.id))
  const current = queue[0]
  const currentId = current?.id

  function closeForNow() {
    if (currentId !== undefined) setClosedIds((ids) => [...ids, currentId])
  }

  useEffect(() => {
    if (currentId === undefined) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setClosedIds((ids) => [...ids, currentId as number])
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [currentId])

  if (!current) return null

  const severity = SEVERITY[current.severity] ?? SEVERITY.info
  const { Icon } = severity

  return (
    <div className="modal modal-open modal-middle" role="dialog" aria-modal="true" aria-labelledby="announcement-title">
      <div className="modal-box w-11/12 max-w-sm rounded-[var(--radius-md)] p-7 text-center">
        <button
          type="button"
          className="btn btn-ghost btn-sm btn-circle absolute right-3 top-3"
          aria-label="Închide"
          onClick={closeForNow}
        >
          <X className="h-4 w-4" />
        </button>

        <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${severity.soft}`}>
          <Icon className={`h-5 w-5 ${severity.tone}`} />
        </div>

        <p className="mb-1 flex items-center justify-center gap-2 text-[12px] text-[var(--color-ink-muted)]">
          <span className={`inline-block h-2 w-2 rounded-full ${severity.dot}`} />
          {severity.label}
          {queue.length > 1 && <span>· 1 din {queue.length}</span>}
        </p>
        <h3 id="announcement-title" className="text-[18px] font-semibold text-[var(--color-ink)]">
          {current.title}
        </h3>
        <p className="mt-2 whitespace-pre-line text-[14px] text-[var(--color-ink-muted)]">{current.body}</p>

        <div className="modal-action justify-center">
          {current.dismissible ? (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              autoFocus
              disabled={dismiss.isPending}
              onClick={() => dismiss.mutate(current.id)}
            >
              Am înțeles
            </button>
          ) : (
            <button type="button" className="btn btn-primary btn-sm" autoFocus onClick={closeForNow}>
              Închide
            </button>
          )}
        </div>
      </div>
      <div className="modal-backdrop" onClick={closeForNow} />
    </div>
  )
}
