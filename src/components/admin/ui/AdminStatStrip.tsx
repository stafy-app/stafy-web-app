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
    <div className="flex flex-col gap-1 px-5 py-4">
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
 */
export function AdminStatStrip({ items }: { items: AdminStatItem[] }) {
  return (
    <div
      className="grid divide-x divide-[var(--color-line)] overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]"
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items.map((item) => (
        <StatCell key={item.label} item={item} />
      ))}
    </div>
  )
}
