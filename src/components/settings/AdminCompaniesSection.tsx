import { useState } from 'react'
import { useAdminCompanies } from '@stafy/hooks/useAdmin'
import { AdminCompanyPlanPanel } from '@stafy/components/settings/AdminCompanyPlanPanel'
import { STATUS_LABELS, formatPlanDate, planLabel } from '@stafy/utils/planLabels'

export function AdminCompaniesSection() {
  const { data, isLoading } = useAdminCompanies()
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const companies = data?.data ?? []
  const selected = companies.find((company) => company.company_id === selectedId)

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-[16px] font-semibold text-[var(--color-ink)]">Companii și abonamente</h2>
        <p className="text-[13px] text-[var(--color-ink-muted)]">
          Companiile cu owner, planul lor și locurile folosite. Alege una ca să-i schimbi planul sau să vezi istoricul.
        </p>
      </div>

      {isLoading ? (
        <span className="loading loading-spinner loading-sm" />
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-sm">
            <thead>
              <tr>
                <th>Companie</th>
                <th>Owner</th>
                <th>Plan</th>
                <th>Stare</th>
                <th>Locuri</th>
                <th>Expiră</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr
                  key={company.company_id}
                  className={`cursor-pointer hover:bg-[var(--color-surface-2)] ${
                    company.company_id === selectedId ? 'bg-[var(--color-primary-soft)]' : ''
                  }`}
                  onClick={() => setSelectedId(company.company_id)}
                >
                  <td className="font-medium">{company.company_name}</td>
                  <td>
                    {company.owner_name}
                    <div className="text-[11px] text-[var(--color-ink-muted)]">{company.owner_email}</div>
                  </td>
                  <td>{planLabel(company.plan_type)}</td>
                  <td>
                    <span
                      className={`badge badge-sm badge-soft ${company.plan_status === 'read_only' ? 'badge-error' : 'badge-success'}`}
                    >
                      {STATUS_LABELS[company.plan_status]}
                    </span>
                  </td>
                  <td>
                    {company.seats_used} / {company.seats_limit ?? '∞'}
                  </td>
                  <td>{company.plan_expires_at ? formatPlanDate(company.plan_expires_at) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <AdminCompanyPlanPanel
          key={selected.company_id}
          companyId={selected.company_id}
          companyName={selected.company_name}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  )
}
