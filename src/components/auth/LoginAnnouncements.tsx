import { useState } from 'react'
import { X } from 'lucide-react'
import { AnnouncementMarkdown } from '@stafy/components/shared/AnnouncementMarkdown'
import { usePublicAnnouncements } from '@stafy/hooks/useAnnouncements'

const TONE: Record<string, string> = {
  info: 'alert-info',
  warning: 'alert-warning',
  critical: 'alert-error',
}

/**
 * Announcements flagged for the login page, shown above the form to signed-out visitors (a planned
 * outage, for instance). Closing one hides it only until the page is reloaded; a failed fetch shows nothing.
 */
export function LoginAnnouncements() {
  const { data } = usePublicAnnouncements()
  const [closedIds, setClosedIds] = useState<number[]>([])

  const visible = (data?.data ?? []).filter((announcement) => !closedIds.includes(announcement.id))
  if (visible.length === 0) return null

  return (
    <div className="mb-4 flex flex-col gap-2">
      {visible.map((announcement) => (
        <div
          key={announcement.id}
          role="alert"
          className={`alert alert-soft items-start text-left text-[13px] ${TONE[announcement.severity] ?? 'alert-info'}`}
        >
          <div className="flex-1">
            <p className="font-semibold">{announcement.title}</p>
            <AnnouncementMarkdown>{announcement.body}</AnnouncementMarkdown>
            {announcement.cta_label && announcement.cta_url && (
              <a
                className="link mt-1 inline-block font-medium"
                href={announcement.cta_url}
                {...(announcement.cta_url.startsWith('/') ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
              >
                {announcement.cta_label}
              </a>
            )}
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-xs btn-circle"
            aria-label="Închide"
            onClick={() => setClosedIds((ids) => [...ids, announcement.id])}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
