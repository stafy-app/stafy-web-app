import type { CSSProperties } from 'react'
import { useCountUp } from '@stafy/hooks/useCountUp'

export interface AdminStatItem {
  label: string
  value: number
  hint?: string
  /** Colors the figure when it needs a look (a non-zero count of problems). */
  tone?: 'warning' | 'error'
}

function StatCell({ item }: { item: AdminStatItem }) {
  const animated = useCountUp(item.value, 600)
  const tone =
    item.tone && item.value > 0
      ? item.tone === 'error'
        ? 'text-[var(--color-error)]'
        : 'text-[var(--color-warning-text)]'
      : 'text-[var(--color-ink)]'

  return (
    <div className="flex flex-col gap-1 bg-[var(--color-surface)] px-4 py-4 md:px-5">
      <div className="text-[13px] font-medium text-[var(--color-ink-soft)]">{item.label}</div>
      <div className={`text-[30px] font-semibold leading-none tracking-tight tabular-nums ${tone}`}>
        {Math.round(animated)}
      </div>
      <div className="min-h-[18px] text-[13px] leading-snug text-[var(--color-ink-soft)]">{item.hint}</div>
    </div>
  )
}

/**
 * The page's key figures as one strip: equal-height cells in a single white sheet, separated by hairlines.
 * Label on top, the figure large, a plain-language hint under it. Admin-only; the manager dashboard keeps `KpiCard`.
 * Two columns below `md` (a lone last cell spans both), one row of every cell from `md` up; the hairlines are the
 * 1px grid gap over the line color, so they stay correct when the cells wrap.
 */
export function AdminStatStrip({ items }: { items: AdminStatItem[] }) {
  return (
    <div
      className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-line)] shadow-[var(--shadow-card)] max-md:[&>*:last-child:nth-child(odd)]:col-span-2 md:grid-cols-[repeat(var(--stat-cols),minmax(0,1fr))]"
      style={{ '--stat-cols': items.length } as CSSProperties}
    >
      {items.map((item) => (
        <StatCell key={item.label} item={item} />
      ))}
    </div>
  )
}
