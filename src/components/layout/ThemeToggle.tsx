import { ICONS, type IconName } from '@stafy/lib/icons'
import { useTheme } from '@stafy/hooks/useTheme'
import type { ThemePreference } from '@stafy/lib/theme'

const OPTIONS: { value: ThemePreference; label: string; icon: IconName }[] = [
  { value: 'light', label: 'Luminos', icon: 'sun' },
  { value: 'dark', label: 'Întunecat', icon: 'moon' },
  { value: 'system', label: 'Sistem', icon: 'monitor' },
]

/** Icon button for shell bars: flips between light and dark (an explicit choice, replacing "system"). */
export function ThemeToggleButton() {
  const { resolved, setPreference } = useTheme()
  const isDark = resolved === 'dark'
  const Icon = ICONS[isDark ? 'sun' : 'moon']
  const label = isDark ? 'Trecere la tema luminoasă' : 'Trecere la tema întunecată'
  return (
    <button
      type="button"
      onClick={() => setPreference(isDark ? 'light' : 'dark')}
      aria-label={label}
      title={label}
      className="flex h-9 w-9 flex-shrink-0 cursor-pointer items-center justify-center rounded-full text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)]"
    >
      <Icon className="h-[18px] w-[18px]" />
    </button>
  )
}

/** Three-way picker (light / dark / follow the system) for the Account settings. */
export function ThemeSwitch() {
  const { preference, setPreference } = useTheme()
  return (
    <div role="radiogroup" aria-label="Aspect" className="join">
      {OPTIONS.map((option) => {
        const Icon = ICONS[option.icon]
        const active = option.value === preference
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setPreference(option.value)}
            className={`btn btn-sm join-item gap-1.5 ${active ? 'btn-primary' : ''}`}
          >
            <Icon className="h-4 w-4" />
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
