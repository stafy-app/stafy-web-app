import { useLayoutEffect, useRef, useState } from 'react'

export type EmployeeTabKey = 'attendance' | 'rates' | 'history'

interface EmployeeTabsProps {
  active: EmployeeTabKey
  onChange: (tab: EmployeeTabKey) => void
}

const TABS: { key: EmployeeTabKey; label: string }[] = [
  { key: 'attendance', label: 'Pontaje' },
  { key: 'rates', label: 'Tarife' },
  { key: 'history', label: 'Istoric lunar' },
]

export function EmployeeTabs({ active, onChange }: EmployeeTabsProps) {
  const buttonRefs = useRef(new Map<EmployeeTabKey, HTMLButtonElement>())
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null)

  useLayoutEffect(() => {
    const el = buttonRefs.current.get(active)
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth })
  }, [active])

  return (
    <div className="relative flex gap-6 border-b border-[var(--color-line)]">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          ref={(el) => {
            if (el) buttonRefs.current.set(tab.key, el)
          }}
          type="button"
          onClick={() => onChange(tab.key)}
          className={`px-1 pb-3 text-[14px] font-medium transition-colors ${
            active === tab.key ? 'text-[var(--color-ink)]' : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink-soft)]'
          }`}
        >
          {tab.label}
        </button>
      ))}
      {indicator && (
        <span
          className="absolute bottom-0 h-[2px] bg-[var(--color-primary)] transition-[left,width] duration-200 ease-out"
          style={{ left: indicator.left, width: indicator.width }}
        />
      )}
    </div>
  )
}
