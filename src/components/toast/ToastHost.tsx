import { createPortal } from 'react-dom'
import { useSyncExternalStore } from 'react'
import { Toast } from './Toast'
import { dismissToast, getSnapshot, subscribe } from '@stafy/lib/toast'

// Portaled to document.body so position: fixed can never be broken by a
// future ancestor with a transform/filter (e.g. inside AppLayout's main).
export function ToastHost() {
  const toasts = useSyncExternalStore(subscribe, getSnapshot)

  if (toasts.length === 0) return null

  return createPortal(
    <div
      className="pointer-events-none fixed right-6 top-6 z-[9999] flex flex-col gap-[10px]"
      aria-live="polite"
    >
      {toasts.map((item) => (
        <Toast key={item.id} item={item} onDismiss={dismissToast} />
      ))}
    </div>,
    document.body,
  )
}
