import { useState } from 'react'
import { useTopBar } from '@stafy/hooks/useTopBar'
import { SettingsNav, type SettingsSectionKey } from '@stafy/components/settings/SettingsNav'
import { AccountSection } from '@stafy/components/settings/AccountSection'
import { CompanySection } from '@stafy/components/settings/CompanySection'
import { ActivitiesSection } from '@stafy/components/settings/ActivitiesSection'
import { JobTitlesSection } from '@stafy/components/settings/JobTitlesSection'
import { AuditSection } from '@stafy/components/settings/AuditSection'
import { SecuritySection } from '@stafy/components/settings/SecuritySection'
import { MobileWorkspaceSwitch } from '@stafy/components/layout/MobileWorkspaceSwitch'
import { useAuth } from '@stafy/hooks/useAuth'
import { SubscriptionSection } from '@stafy/components/settings/SubscriptionSection'

const SECTION_COMPONENTS: Record<SettingsSectionKey, React.ComponentType> = {
  account: AccountSection,
  company: CompanySection,
  activities: ActivitiesSection,
  jobTitles: JobTitlesSection,
  audit: AuditSection,
  security: SecuritySection,
  subscription: SubscriptionSection,
}

export default function SettingsPage() {
  useTopBar({ title: 'Setări', subtitle: 'Contul tău și compania' })

  const { logout } = useAuth()
  const [active, setActive] = useState<SettingsSectionKey>('account')
  const ActiveSection = SECTION_COMPONENTS[active]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 md:flex-row md:gap-6">
        <SettingsNav active={active} onChange={setActive} />
        <div className="min-w-0 flex-1 rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)] sm:p-6">
          <ActiveSection />
        </div>
      </div>
      <MobileWorkspaceSwitch target="personal" />
      <button
        type="button"
        onClick={() => logout()}
        className="btn btn-ghost min-h-12 w-full text-[var(--color-error)] md:hidden sm:w-auto sm:self-start"
      >
        Deconectează-te
      </button>
    </div>
  )
}
