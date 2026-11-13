interface AdminSegmentedProps<T extends string> {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  label?: string
}

/**
 * Segmented control: a soft gray track with a white pill under the active option. Below `sm` it spans the full
 * width with equal options (bigger tap targets, no sideways scroll for the usual 2–4 options); from `sm` up it
 * hugs its content.
 */
export function AdminSegmented<T extends string>({ value, options, onChange, label }: AdminSegmentedProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="flex w-full max-w-full gap-0.5 overflow-x-auto rounded-[var(--radius-lg)] bg-[var(--color-surface-2)] p-1 sm:inline-flex sm:w-auto sm:self-start"
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
            className={`flex-1 shrink-0 cursor-pointer whitespace-nowrap rounded-[var(--radius-md)] px-2.5 py-2 sm:flex-none sm:px-3.5 sm:py-1.5 text-[13px] font-medium transition-all duration-200 ${
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
