import type { ProviderStatusHealth } from '@stafy/api/generated/endpoints/index.schemas'

type Health = ProviderStatusHealth

const STYLES: Record<Health, { label: string; dot: string; pill: string }> = {
  ok: {
    label: 'OK',
    dot: 'bg-[var(--color-success)]',
    pill: 'bg-[var(--color-success-soft)] text-[var(--color-success)]',
  },
  degraded: {
    label: 'Degradat',
    dot: 'bg-[var(--color-warning)]',
    pill: 'bg-[var(--color-warning-soft)] text-[var(--color-warning-content)]',
  },
  down: {
    label: 'Căzut',
    dot: 'bg-[var(--color-error)]',
    pill: 'bg-[var(--color-error-soft)] text-[var(--color-error)]',
  },
  unknown: {
    label: 'Necunoscut',
    dot: 'bg-[var(--color-info)]',
    pill: 'bg-[var(--color-info-soft)] text-[var(--color-info)]',
  },
  unconfigured: {
    label: 'Neconfigurat',
    dot: 'bg-[var(--color-ink-muted)]',
    pill: 'bg-[var(--color-surface-2)] text-[var(--color-ink-muted)]',
  },
}

export function HealthDot({ health }: { health: Health | null | undefined }) {
  if (!health) return <span className="h-2 w-2 flex-shrink-0 rounded-full bg-[var(--color-line)]" />
  return <span className={`h-2 w-2 flex-shrink-0 rounded-full ${STYLES[health].dot}`} title={STYLES[health].label} />
}

export function HealthBadge({ health }: { health: Health }) {
  const style = STYLES[health]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold ${style.pill}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  )
}
