import { AdminPanel } from '@stafy/components/admin/AdminPanel'
import { AccountSection } from '@stafy/components/settings/AccountSection'
import { SecuritySection } from '@stafy/components/settings/SecuritySection'

export default function AdminAccountPage() {
  return (
    <div className="flex flex-col gap-6">
      <AdminPanel>
        <AccountSection />
      </AdminPanel>
      <AdminPanel>
        <SecuritySection />
      </AdminPanel>
    </div>
  )
}
