import type { IconName } from './icons'

export type ToastTone = 'success' | 'info' | 'warning' | 'danger'

export interface ToastOptions {
  tone?: ToastTone
  icon?: IconName
  duration?: number
}

export interface ToastItem {
  id: string
  message: string
  tone: ToastTone
  icon: IconName
  duration: number
  leaving: boolean
}

// Public tone name stays 'danger' (standard toast UX vocabulary); the
// DaisyUI theme's own semantic for this color is 'error', not 'danger' —
// callers of showToast never see that name, only Toast.tsx maps tone -> CSS var.
const DEFAULT_ICON: Record<ToastTone, IconName> = {
  success: 'check',
  info: 'info',
  warning: 'warning',
  danger: 'danger',
}

const DEFAULT_DURATION = 1800
const EXIT_ANIMATION_MS = 220

let toasts: ToastItem[] = []
const listeners = new Set<() => void>()

function notify() {
  for (const listener of listeners) listener()
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getSnapshot(): ToastItem[] {
  return toasts
}

export function showToast(message: string, options: ToastOptions = {}): string {
  const tone = options.tone ?? 'success'
  const id = crypto.randomUUID()
  const duration = options.duration ?? DEFAULT_DURATION

  toasts = [
    ...toasts,
    {
      id,
      message,
      tone,
      icon: options.icon ?? DEFAULT_ICON[tone],
      duration,
      leaving: false,
    },
  ]
  notify()

  setTimeout(() => dismissToast(id), duration)

  return id
}

export function dismissToast(id: string) {
  const target = toasts.find((toast) => toast.id === id)
  if (!target || target.leaving) return

  toasts = toasts.map((toast) => (toast.id === id ? { ...toast, leaving: true } : toast))
  notify()

  setTimeout(() => {
    toasts = toasts.filter((toast) => toast.id !== id)
    notify()
  }, EXIT_ANIMATION_MS)
}
