import { useState } from 'react'
import { AdminModal } from '@stafy/components/admin/AdminModal'
import {
  CompanyAccessTab,
  CompanyMembersTab,
  CompanyOverviewTab,
} from '@stafy/components/admin/AdminCompanyDetailPanel'
import { AdminCompanyPlanPanel } from '@stafy/components/admin/AdminCompanyPlanPanel'
import { AdminSegmented } from '@stafy/components/admin/ui/AdminSegmented'
import { useAdminCompany } from '@stafy/hooks/useAdmin'

type CompanyTab = 'overview' | 'members' | 'plan' | 'access'

const TABS: { value: CompanyTab; label: string }[] = [
  { value: 'overview', label: 'Prezentare' },
  { value: 'members', label: 'Membri' },
  { value: 'plan', label: 'Plan' },
  { value: 'access', label: 'Acces' },
]

interface AdminCompanyModalProps {
  companyId: number
  companyName: string
  onClose: () => void
}

/** One company in a sheet: Prezentare | Membri | Plan | Acces, so nothing needs a long scroll. */
export function AdminCompanyModal({ companyId, companyName, onClose }: AdminCompanyModalProps) {
  const [tab, setTab] = useState<CompanyTab>('overview')
  const { data: company } = useAdminCompany(companyId)

  return (
    <AdminModal
      title={companyName}
      subtitle={company ? `${company.owner_name} · ${company.owner_email}` : undefined}
      toolbar={<AdminSegmented label="Secțiunile companiei" value={tab} options={TABS} onChange={setTab} />}
      onClose={onClose}
    >
      {tab === 'overview' && <CompanyOverviewTab companyId={companyId} />}
      {tab === 'members' && <CompanyMembersTab companyId={companyId} />}
      {tab === 'plan' && <AdminCompanyPlanPanel companyId={companyId} />}
      {tab === 'access' && <CompanyAccessTab companyId={companyId} />}
    </AdminModal>
  )
}
