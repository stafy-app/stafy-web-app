import { ICONS, type IconName } from '@stafy/lib/icons'
import { useTheme } from '@stafy/hooks/useTheme'
import type { ThemePreference } from '@stafy/lib/theme'

const OPTIONS: { value: ThemePreference; label: string; icon: IconName }[] = [
  { value: 'light', label: 'Luminos', icon: 'sun' },
  { value: 'dark', label: 'Întunecat', icon: 'moon' },
  { value: 'system', label: 'Sistem', icon: 'monitor' },
]

/** Centre of the clicked control: where the theme reveal starts. */
function originOf(element: HTMLElement) {
  const rect = element.getBoundingClientRect()
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
}

/** Icon button for shell bars: flips between light and dark (an explicit choice, replacing "system"). */
export function ThemeToggleButton() {
  const { resolved, setPreference } = useTheme()
  const isDark = resolved === 'dark'
  const Sun = ICONS.sun
  const Moon = ICONS.moon
  const iconBase =
    'absolute h-[18px] w-[18px] transition-[rotate,scale,opacity] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none'
  const label = isDark ? 'Trecere la tema luminoasă' : 'Trecere la tema întunecată'
  return (
    <button
      type="button"
      onClick={(event) => setPreference(isDark ? 'light' : 'dark', originOf(event.currentTarget))}
      aria-label={label}
      title={label}
      className="relative flex h-9 w-9 flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full text-[var(--color-ink-soft)] transition-[background-color,color,scale] duration-200 hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)] active:scale-90 motion-reduce:transition-none"
    >
      <Sun
        aria-hidden
        className={`${iconBase} ${isDark ? 'rotate-0 scale-100 opacity-100' : 'rotate-180 scale-0 opacity-0'}`}
      />
      <Moon
        aria-hidden
        className={`${iconBase} ${isDark ? '-rotate-180 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`}
      />
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
            onClick={(event) => setPreference(option.value, originOf(event.currentTarget))}
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
