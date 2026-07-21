import { ArrowDown, ArrowUp } from 'lucide-react'

interface DeltaProps {
  value: number
}

export function Delta({ value }: DeltaProps) {
  if (value === 0) {
    return <span className="font-[var(--font-mono)] text-[13px] text-[var(--color-ink-muted)]">—</span>
  }

  const isPositive = value > 0
  const Icon = isPositive ? ArrowUp : ArrowDown

  return (
    <span
      className={`inline-flex items-center gap-0.5 font-[var(--font-mono)] text-[13px] font-medium ${
        isPositive ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'
      }`}
    >
      <Icon className="h-3 w-3" />
      {Math.abs(value).toFixed(1)}h
    </span>
  )
}
