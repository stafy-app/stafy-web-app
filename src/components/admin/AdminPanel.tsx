import type { ReactNode } from 'react'

// Single card every admin page body renders inside — same surface the
// Settings page gives each of its sections.
export function AdminPanel({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
      {children}
    </div>
  )
}
