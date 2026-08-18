import type { LucideIcon } from 'lucide-react'
import { useCountUp } from '@stafy/hooks/useCountUp'

interface KpiCardProps {
  label: string
  icon: LucideIcon
  value: number
  durationMs: number
  formatValue?: (value: number) => string
  subtext?: string
}

const defaultFormat = (value: number) => Math.round(value).toString()

export function KpiCard({
  label,
  icon: Icon,
  value,
  durationMs,
  formatValue = defaultFormat,
  subtext,
}: KpiCardProps) {
  const animated = useCountUp(value, durationMs)

  return (
    <div className="relative rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
      <div className="pr-10 text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--color-ink-muted)]">
        {label}
      </div>
      <div className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-soft)]">
        <Icon className="h-[18px] w-[18px] text-[var(--color-primary)]" />
      </div>
      <div className="mt-3 text-[28px] font-bold text-[var(--color-ink)]">{formatValue(animated)}</div>
      {subtext && <div className="mt-1 text-[12px] text-[var(--color-ink-muted)]">{subtext}</div>}
    </div>
  )
}
