import { useState } from 'react'
import { X } from 'lucide-react'
import { AnnouncementMarkdown } from '@stafy/components/shared/AnnouncementMarkdown'
import { usePublicAnnouncements } from '@stafy/hooks/useAnnouncements'

const TONE: Record<string, string> = {
  info: 'alert-info',
  warning: 'alert-warning',
  critical: 'alert-error',
}

interface LoginAnnouncementAlertProps {
  severity: string
  title: string
  body: string
  ctaLabel?: string | null
  ctaUrl?: string | null
  /** Inert rendering for the admin editor's preview: the close button and link do nothing. */
  preview?: boolean
  onClose?: () => void
}

/** One announcement as the alert above the login form (also the admin editor's "Pe login" preview). */
export function LoginAnnouncementAlert({
  severity,
  title,
  body,
  ctaLabel,
  ctaUrl,
  preview = false,
  onClose,
}: LoginAnnouncementAlertProps) {
  return (
    <div role="alert" className={`alert alert-soft relative items-start text-left text-[13px] ${TONE[severity] ?? 'alert-info'}`}>
      <div className="min-w-0 pr-7">
        <p className="break-words font-semibold">{title}</p>
        <AnnouncementMarkdown>{body}</AnnouncementMarkdown>
        {ctaLabel && ctaUrl && (
          <a
            className="link mt-1 inline-block font-medium"
            href={preview ? undefined : ctaUrl}
            {...(preview || ctaUrl.startsWith('/') ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
          >
            {ctaLabel}
          </a>
        )}
      </div>
      <button
        type="button"
        className="btn btn-ghost btn-xs btn-circle absolute right-2 top-2"
        aria-label="Închide"
        tabIndex={preview ? -1 : undefined}
        onClick={preview ? undefined : onClose}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
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
        <LoginAnnouncementAlert
          key={announcement.id}
          severity={announcement.severity}
          title={announcement.title}
          body={announcement.body}
          ctaLabel={announcement.cta_label}
          ctaUrl={announcement.cta_url}
          onClose={() => setClosedIds((ids) => [...ids, announcement.id])}
        />
      ))}
    </div>
  )
}
