import { CATEGORICAL_COLORS } from '@stafy/utils/activityColor'

interface ActivitySegment {
  activity_name: string
  hours: number
}

interface ActivityDonutProps {
  segments: ActivitySegment[]
  totalHours: number
}

// Each donut is an independent per-month snapshot (not a live-filterable single
// instance), so slot is assigned by display rank, not by activity identity — see
// utils/activityColor.ts for the id-keyed variant used by chips elsewhere.
const OTHER_COLOR = 'var(--color-ink-muted)'
const MAX_SLICES = 4

const SIZE = 260
const STROKE_WIDTH = 34
const RADIUS = (SIZE - STROKE_WIDTH) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function ActivityDonut({ segments, totalHours }: ActivityDonutProps) {
  const top = segments.slice(0, MAX_SLICES)
  const rest = segments.slice(MAX_SLICES)
  const otherHours = rest.reduce((sum, s) => sum + s.hours, 0)

  const slices = [
    ...top.map((s, i) => ({ name: s.activity_name, hours: s.hours, color: CATEGORICAL_COLORS[i] })),
    ...(otherHours > 0 ? [{ name: 'Altele', hours: otherHours, color: OTHER_COLOR }] : []),
  ]

  let offset = 0

  return (
    <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-[minmax(280px,320px)_1fr]">
      <div className="relative mx-auto h-[260px] w-[260px]">
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90">
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="var(--color-line-soft)"
            strokeWidth={STROKE_WIDTH}
          />
          {slices.map((slice) => {
            const fraction = totalHours > 0 ? slice.hours / totalHours : 0
            const dash = fraction * CIRCUMFERENCE
            const strokeDashoffset = -offset
            offset += dash
            return (
              <circle
                key={slice.name}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke={slice.color}
                strokeWidth={STROKE_WIDTH}
                strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="butt"
              />
            )
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-[28px] font-bold text-[var(--color-ink)]">{Math.round(totalHours)}</div>
          <div className="text-[12px] text-[var(--color-ink-muted)]">total ore</div>
        </div>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-2.5">
        {slices.map((slice) => {
          const percent = totalHours > 0 ? (slice.hours / totalHours) * 100 : 0
          return (
            <div
              key={slice.name}
              className="flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface-2)] px-3 py-2"
            >
              <span
                className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                style={{ backgroundColor: slice.color }}
              />
              <span className="flex-1 truncate text-[13px] text-[var(--color-ink)]">{slice.name}</span>
              <span className="font-[var(--font-mono)] text-[13px] font-semibold text-[var(--color-ink)]">
                {slice.hours.toFixed(1)}h
              </span>
              <span className="w-9 flex-shrink-0 text-right font-[var(--font-mono)] text-[12px] text-[var(--color-ink-muted)]">
                {percent.toFixed(0)}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
