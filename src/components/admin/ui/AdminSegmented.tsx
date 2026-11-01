interface AdminSegmentedProps<T extends string> {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  label?: string
}

/** Segmented control: a soft gray track with a white pill under the active option. */
export function AdminSegmented<T extends string>({ value, options, onChange, label }: AdminSegmentedProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="inline-flex self-start gap-0.5 rounded-[var(--radius-lg)] bg-[var(--color-surface-2)] p-1"
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={`cursor-pointer rounded-[var(--radius-md)] px-3.5 py-1.5 text-[13px] font-medium transition-all duration-200 ${
              active
                ? 'bg-[var(--color-surface)] text-[var(--color-ink)] shadow-[var(--shadow-xs)]'
                : 'text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
