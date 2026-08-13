import { useEffect, useRef, useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

interface PeriodBarProps {
  year: number
  month: number
  isCurrentMonth: boolean
  onPrev: () => void
  onNext: () => void
  onJumpToCurrent: () => void
  onJumpToMonth?: (year: number, month: number) => void
}

const MONTH_YEAR_FORMAT = new Intl.DateTimeFormat('ro-RO', { month: 'long', year: 'numeric' })
const MONTH_NAMES = Array.from({ length: 12 }, (_, i) =>
  new Intl.DateTimeFormat('ro-RO', { month: 'long' }).format(new Date(2000, i, 1)),
)

function MonthJumpPicker({
  year,
  month,
  onJumpToMonth,
}: {
  year: number
  month: number
  onJumpToMonth: (year: number, month: number) => void
}) {
  // Explicit open/close state, not DaisyUI's CSS `:focus-within` dropdown — clicking a
  // native <select> to open its own option list steals focus in a way that breaks
  // `:focus-within` and closes the popover before a month/year can be picked.
  const [isOpen, setIsOpen] = useState(false)
  const [draftYear, setDraftYear] = useState(year)
  const [draftMonth, setDraftMonth] = useState(month)
  const containerRef = useRef<HTMLDivElement>(null)
  const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 4 + i)

  useEffect(() => {
    if (!isOpen) return
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setDraftYear(year)
          setDraftMonth(month)
          setIsOpen((v) => !v)
        }}
        className="text-[12px] font-medium text-[var(--color-ink-soft)] underline decoration-dotted underline-offset-2 hover:text-[var(--color-ink)]"
      >
        Selectează altă lună
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full z-30 mt-2 flex w-56 flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-md)]">
          <select
            value={draftMonth}
            onChange={(e) => setDraftMonth(Number(e.target.value))}
            className="select select-bordered select-sm"
          >
            {MONTH_NAMES.map((name, i) => (
              <option key={i} value={i + 1}>
                {name.charAt(0).toUpperCase() + name.slice(1)}
              </option>
            ))}
          </select>
          <select
            value={draftYear}
            onChange={(e) => setDraftYear(Number(e.target.value))}
            className="select select-bordered select-sm"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              onJumpToMonth(draftYear, draftMonth)
              setIsOpen(false)
            }}
            className="btn btn-primary btn-sm"
          >
            Mergi la lună
          </button>
        </div>
      )}
    </div>
  )
}

export function PeriodBar({
  year,
  month,
  isCurrentMonth,
  onPrev,
  onNext,
  onJumpToCurrent,
  onJumpToMonth,
}: PeriodBarProps) {
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
        {onJumpToMonth && (
          <div className="mt-1">
            <MonthJumpPicker year={year} month={month} onJumpToMonth={onJumpToMonth} />
          </div>
        )}
      </div>
      {/* Prev/next + "current month" only make sense when there's no direct month/year
          picker (Dashboard, Employee Profile). Reports passes onJumpToMonth and relies on
          that picker alone — the arrows/pill would be redundant navigation there. */}
      {!onJumpToMonth && (
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
      )}
    </div>
  )
}
