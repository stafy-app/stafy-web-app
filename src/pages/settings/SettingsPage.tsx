import { useState } from 'react'
import { useTopBar } from '@stafy/hooks/useTopBar'
import { SettingsNav, type SettingsSectionKey } from '@stafy/components/settings/SettingsNav'
import { AccountSection } from '@stafy/components/settings/AccountSection'
import { CompanySection } from '@stafy/components/settings/CompanySection'
import { ActivitiesSection } from '@stafy/components/settings/ActivitiesSection'
import { SecuritySection } from '@stafy/components/settings/SecuritySection'

const SECTION_COMPONENTS: Record<SettingsSectionKey, React.ComponentType> = {
  account: AccountSection,
  company: CompanySection,
  activities: ActivitiesSection,
  security: SecuritySection,
}

export default function SettingsPage() {
  useTopBar({ title: 'Setări', subtitle: 'Setările contului și ale companiei' })

  const [active, setActive] = useState<SettingsSectionKey>('account')
  const ActiveSection = SECTION_COMPONENTS[active]

  return (
    <div className="flex gap-6">
      <SettingsNav active={active} onChange={setActive} />
      <div className="flex-1 rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
        <ActiveSection />
      </div>
    </div>
  )
}
