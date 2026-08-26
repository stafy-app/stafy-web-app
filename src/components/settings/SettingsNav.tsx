import { ICONS, type IconName } from '@stafy/lib/icons'

export type SettingsSectionKey = 'account' | 'company' | 'activities' | 'audit' | 'security'

interface SettingsNavProps {
  active: SettingsSectionKey
  onChange: (section: SettingsSectionKey) => void
}

const SECTIONS: { key: SettingsSectionKey; label: string; icon: IconName }[] = [
  { key: 'account', label: 'Cont', icon: 'user' },
  { key: 'company', label: 'Companie', icon: 'building' },
  { key: 'activities', label: 'Activități', icon: 'tags' },
  { key: 'audit', label: 'Audit', icon: 'history' },
  { key: 'security', label: 'Securitate', icon: 'shield' },
]

export function SettingsNav({ active, onChange }: SettingsNavProps) {
  return (
    <nav className="flex w-[220px] flex-shrink-0 flex-col gap-0.5">
      {SECTIONS.map((section) => {
        const Icon = ICONS[section.icon]
        const isActive = active === section.key
        return (
          <button
            key={section.key}
            type="button"
            onClick={() => onChange(section.key)}
            className={`flex items-center gap-2.5 rounded-[var(--radius-md)] px-3 py-2.5 text-left text-[14px] font-medium transition-colors ${
              isActive
                ? 'bg-[var(--color-primary-soft)] font-semibold text-[var(--color-primary-active)]'
                : 'text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-2)]'
            }`}
          >
            <Icon className={`h-[18px] w-[18px] ${isActive ? 'text-[var(--color-primary)]' : 'text-current'}`} />
            {section.label}
          </button>
        )
      })}
    </nav>
  )
}
