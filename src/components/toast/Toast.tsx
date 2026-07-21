import { ICONS } from '../../lib/icons'
import type { ToastItem, ToastTone } from '../../lib/toast'

interface ToastProps {
  item: ToastItem
  onDismiss: (id: string) => void
}

// 'danger' is the public tone name (standard toast UX vocabulary); the
// stafy DaisyUI theme's own semantic for this color is 'error', not 'danger'.
const TONE_COLOR: Record<ToastTone, string> = {
  success: 'var(--color-success)',
  info: 'var(--color-info)',
  warning: 'var(--color-warning)',
  danger: 'var(--color-error)',
}

export function Toast({ item, onDismiss }: ToastProps) {
  const Icon = ICONS[item.icon]
  const accent = TONE_COLOR[item.tone]

  return (
    <div
      className={`pointer-events-auto relative flex min-w-[280px] max-w-[380px] items-center gap-3 overflow-hidden rounded-[var(--radius-md)] border-l-4 bg-[var(--color-surface)] p-[12px_16px] text-[var(--color-ink)] shadow-[var(--shadow-pop)] ${
        item.leaving ? 'animate-toast-out' : 'animate-toast-in'
      }`}
      style={{ borderLeftColor: accent }}
    >
      <div
        className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: accent }}
      >
        <Icon className={`h-[14px] w-[14px] text-white${item.icon === 'loading' ? ' animate-spin' : ''}`} />
      </div>

      <div className="flex-1 text-[13px] font-medium">{item.message}</div>

      <button
        type="button"
        className="btn btn-ghost btn-square btn-xs text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)]"
        aria-label="Închide"
        onClick={() => onDismiss(item.id)}
      >
        <ICONS.close className="h-[13px] w-[13px]" />
      </button>

      <div
        className="absolute bottom-0 left-0 h-[3px] w-full origin-left"
        style={{
          backgroundColor: accent,
          animation: item.leaving ? 'none' : `toast-timebar ${item.duration}ms linear forwards`,
        }}
      />
    </div>
  )
}
