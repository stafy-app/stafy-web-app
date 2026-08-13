import { useState } from 'react'
import type { PayrollBonusOut } from '../../api/generated/endpoints/index.schemas'

interface BonusCardProps {
  bonus: PayrollBonusOut | null | undefined
  onSave: (amount: number, reason?: string) => void
  onClear: () => void
}

const QUICK_BONUS_AMOUNTS = [100, 250, 500]

export function BonusCard({ bonus, onSave, onClear }: BonusCardProps) {
  const [amount, setAmount] = useState(bonus ? bonus.amount : '')
  const [reason, setReason] = useState(bonus?.reason ?? '')

  return (
    <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)]">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-ink-muted)]">
          Bonus
        </div>
        {bonus && (
          <button
            type="button"
            onClick={onClear}
            className="text-[11px] font-medium text-[var(--color-error)] hover:underline"
          >
            Șterge
          </button>
        )}
      </div>
      <input
        type="number"
        min="0"
        step="1"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="0"
        className="input input-bordered input-sm w-full text-right font-[var(--font-mono)]"
      />
      <input
        type="text"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Motiv (opțional)"
        className="input input-bordered input-sm mt-2 w-full text-[12px]"
      />
      <div className="mt-2 flex gap-1.5">
        {QUICK_BONUS_AMOUNTS.map((quick) => (
          <button
            key={quick}
            type="button"
            onClick={() => setAmount(String(quick))}
            className="btn btn-outline btn-xs flex-1"
          >
            +{quick}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => {
          const parsed = parseFloat(amount)
          if (!parsed || parsed <= 0) return
          onSave(parsed, reason.trim() || undefined)
        }}
        disabled={!amount}
        className="btn btn-primary btn-sm mt-3 w-full"
      >
        Salvează bonus
      </button>
    </div>
  )
}
