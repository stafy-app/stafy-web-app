import { useEffect, useState } from 'react'
import { AnnouncementCard } from '@stafy/components/shared/AnnouncementCard'
import { useActiveAnnouncements, useDismissAnnouncement } from '@stafy/hooks/useAnnouncements'

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

  return (
    <div className="modal modal-open modal-middle" role="dialog" aria-modal="true" aria-labelledby="announcement-title">
      <div className="modal-box w-11/12 max-w-xl bg-transparent p-0 shadow-none">
        <AnnouncementCard
          kind={current.kind}
          severity={current.severity}
          title={current.title}
          body={current.body}
          ctaLabel={current.cta_label}
          ctaUrl={current.cta_url}
          dismissible={current.dismissible}
          queueTotal={queue.length}
          dismissPending={dismiss.isPending}
          onClose={closeForNow}
          onDismiss={() => dismiss.mutate(current.id)}
        />
      </div>
      <div className="modal-backdrop" onClick={closeForNow} />
    </div>
  )
}
