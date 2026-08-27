import { useState } from 'react'
import { useTopBar } from '@stafy/hooks/useTopBar'
import { useProfile } from '@stafy/hooks/useProfile'
import { SettingsNav, type SettingsSectionKey } from '@stafy/components/settings/SettingsNav'
import { AccountSection } from '@stafy/components/settings/AccountSection'
import { CompanySection } from '@stafy/components/settings/CompanySection'
import { ActivitiesSection } from '@stafy/components/settings/ActivitiesSection'
import { AuditSection } from '@stafy/components/settings/AuditSection'
import { SecuritySection } from '@stafy/components/settings/SecuritySection'
import { AdminSection } from '@stafy/components/settings/AdminSection'

const SECTION_COMPONENTS: Record<SettingsSectionKey, React.ComponentType> = {
  account: AccountSection,
  company: CompanySection,
  activities: ActivitiesSection,
  audit: AuditSection,
  security: SecuritySection,
  admin: AdminSection,
}

export default function SettingsPage() {
  useTopBar({ title: 'Setări', subtitle: 'Setările contului și ale companiei' })

  const { data: profile } = useProfile()
  // Admin accounts have no other section worth landing on — every other
  // section is manager-only and 403s for them (see AppLayout's route
  // confinement to /settings for this role). `manualActive` stays null until
  // the caller actually clicks a tab, so the default tracks `profile.role`
  // as it resolves without an effect — a manual click afterward wins.
  const [manualActive, setManualActive] = useState<SettingsSectionKey | null>(null)
  const active = manualActive ?? (profile?.role === 'admin' ? 'admin' : 'account')
  const ActiveSection = SECTION_COMPONENTS[active]

  return (
    <div className="flex gap-6">
      <SettingsNav active={active} onChange={setManualActive} />
      <div className="flex-1 rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
        <ActiveSection />
      </div>
    </div>
  )
}
