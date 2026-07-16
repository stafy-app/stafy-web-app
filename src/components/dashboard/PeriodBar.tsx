import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

interface PeriodBarProps {
  year: number
  month: number
  isCurrentMonth: boolean
  onPrev: () => void
  onNext: () => void
  onJumpToCurrent: () => void
}

const MONTH_YEAR_FORMAT = new Intl.DateTimeFormat('ro-RO', { month: 'long', year: 'numeric' })

export function PeriodBar({ year, month, isCurrentMonth, onPrev, onNext, onJumpToCurrent }: PeriodBarProps) {
  const label = MONTH_YEAR_FORMAT.format(new Date(year, month - 1, 1))
  const capitalizedLabel = label.charAt(0).toUpperCase() + label.slice(1)

  return (
    <div className="flex items-center gap-4 rounded-[var(--radius-lg)] bg-[var(--color-surface)] px-5 py-4 shadow-[var(--shadow-sm)]">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-soft)]">
        <Calendar className="h-5 w-5 text-[var(--color-primary)]" />
      </div>
      <div className="flex-1">
        <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-ink-muted)]">
          Perioadă
        </div>
        <div className="text-[20px] font-bold text-[var(--color-ink)]">{capitalizedLabel}</div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Luna anterioară"
          onClick={onPrev}
          className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-line)] text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-surface-2)]"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Luna următoare"
          onClick={onNext}
          className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-line)] text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-surface-2)]"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        {isCurrentMonth ? (
          <span className="rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-[12px] font-semibold text-[var(--color-primary-active)]">
            Luna curentă
          </span>
        ) : (
          <button
            type="button"
            onClick={onJumpToCurrent}
            className="rounded-full border border-[var(--color-primary)] px-3 py-1 text-[12px] font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary-soft)]"
          >
            Sări la luna curentă
          </button>
        )}
      </div>
    </div>
  )
}
