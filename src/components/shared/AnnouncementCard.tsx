import { Info, OctagonAlert, Sparkles, TriangleAlert, X, type LucideIcon } from 'lucide-react'
import { AnnouncementMarkdown } from '@stafy/components/shared/AnnouncementMarkdown'

const SEVERITY: Record<string, { label: string; Icon: LucideIcon; tone: string; soft: string; dot: string }> = {
  info: { label: 'Informare', Icon: Info, tone: 'text-info', soft: 'bg-info/10', dot: 'bg-info' },
  warning: { label: 'Avertisment', Icon: TriangleAlert, tone: 'text-warning', soft: 'bg-warning/10', dot: 'bg-warning' },
  critical: { label: 'Important', Icon: OctagonAlert, tone: 'text-error', soft: 'bg-error/10', dot: 'bg-error' },
}

// A what's-new announcement is a product update, not an alert: it gets its own accent, whatever its severity.
const WHATS_NEW = { label: 'Noutăți', Icon: Sparkles, tone: 'text-primary', soft: 'bg-primary/10', dot: 'bg-primary' }

interface AnnouncementCardProps {
  kind: string
  severity: string
  title: string
  body: string
  ctaLabel?: string | null
  ctaUrl?: string | null
  /** Non-critical announcements get "Am înțeles", critical ones only "Închide". */
  dismissible: boolean
  /** "1 din N" hint when more announcements are queued. */
  queueTotal?: number
  /** Inert rendering for the admin editor: no handlers, links and buttons do nothing. */
  preview?: boolean
  dismissPending?: boolean
  onClose?: () => void
  onDismiss?: () => void
}

/**
 * The announcement card shown to users (`AnnouncementModal`) and, inert, as the live preview in the admin
 * editor. Severity is only an accent (icon tint and a dot), the card stays neutral.
 */
export function AnnouncementCard({
  kind,
  severity,
  title,
  body,
  ctaLabel,
  ctaUrl,
  dismissible,
  queueTotal = 1,
  preview = false,
  dismissPending = false,
  onClose,
  onDismiss,
}: AnnouncementCardProps) {
  const accent = kind === 'whats_new' ? WHATS_NEW : (SEVERITY[severity] ?? SEVERITY.info)
  const { Icon } = accent
  const hasCta = !!ctaLabel && !!ctaUrl
  const secondaryClass = `btn btn-sm ${ctaUrl ? 'btn-ghost' : 'btn-primary'}`

  return (
    <div
      className={`flex w-full flex-col overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-surface)] shadow-[var(--shadow-pop)] ${
        preview ? '' : 'max-h-[85vh]'
      }`}
    >
      <div className={`relative flex items-start gap-4 px-6 pb-5 pt-6 sm:px-8 sm:pt-7 ${accent.soft}`}>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]">
          <Icon className={`h-6 w-6 ${accent.tone}`} />
        </div>
        <div className="min-w-0 flex-1 pr-8">
          <p className="mb-1 flex items-center gap-2 text-[12px] font-medium uppercase tracking-wide text-[var(--color-ink-soft)]">
            <span className={`inline-block h-2 w-2 rounded-full ${accent.dot}`} />
            {accent.label}
            {queueTotal > 1 && (
              <span className="normal-case tracking-normal text-[var(--color-ink-muted)]">· 1 din {queueTotal}</span>
            )}
          </p>
          <h3
            id={preview ? undefined : 'announcement-title'}
            className="break-words text-[20px] font-semibold leading-snug text-[var(--color-ink)]"
          >
            {title || <span className="text-[var(--color-ink-muted)]">Titlul anunțului</span>}
          </h3>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm btn-circle absolute right-4 top-4"
          aria-label="Închide"
          tabIndex={preview ? -1 : undefined}
          onClick={preview ? undefined : onClose}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 [scrollbar-color:var(--color-line)_transparent] [scrollbar-width:thin] sm:px-8">
        {body.trim() ? (
          <AnnouncementMarkdown className="text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
            {body}
          </AnnouncementMarkdown>
        ) : (
          <p className="text-[15px] text-[var(--color-ink-muted)]">Descrierea apare aici.</p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 px-6 pb-6 pt-3 sm:px-8">
        {hasCta &&
          (preview ? (
            <span className="btn btn-primary btn-sm pointer-events-none">{ctaLabel}</span>
          ) : (
            <a
              className="btn btn-primary btn-sm"
              href={ctaUrl}
              {...(ctaUrl.startsWith('/') ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
            >
              {ctaLabel}
            </a>
          ))}
        {preview ? (
          <span className={`${secondaryClass} pointer-events-none`}>{dismissible ? 'Am înțeles' : 'Închide'}</span>
        ) : dismissible ? (
          <button type="button" className={secondaryClass} autoFocus disabled={dismissPending} onClick={onDismiss}>
            Am înțeles
          </button>
        ) : (
          <button type="button" className={secondaryClass} autoFocus onClick={onClose}>
            Închide
          </button>
        )}
      </div>
    </div>
  )
}
