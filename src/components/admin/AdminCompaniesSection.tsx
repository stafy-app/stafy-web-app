import { useEffect, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { useAdminCompanies } from '@stafy/hooks/useAdmin'
import { AdminCompanyModal } from '@stafy/components/admin/AdminCompanyModal'
import { AdminSheet, AdminSheetSection } from '@stafy/components/admin/ui/AdminSheet'
import { AdminPageHeader } from '@stafy/components/admin/ui/AdminPageHeader'
import { StatusDot } from '@stafy/components/admin/ui/StatusDot'
import { AdminEmptyRow, AdminLoading, AdminPager, AdminTable } from '@stafy/components/admin/ui/AdminTable'
import {
  ListAdminCompaniesOrder,
  ListAdminCompaniesPlanStatus,
  ListAdminCompaniesPlanType,
  ListAdminCompaniesSort,
} from '@stafy/api/generated/endpoints/index.schemas'
import { PLAN_LABELS, STATUS_LABELS, formatPlanDate, planLabel } from '@stafy/utils/planLabels'

const PAGE_SIZE = 25

const ROLE_LABELS = { owner: 'owner', manager: 'manager', employee: 'angajat' } as const

// `wide`: shown from `sm` up only. On a phone a row is company (owner under it), plan and state; the rest is one
// tap away in the company modal.
const COLUMNS: { label: string; sort?: ListAdminCompaniesSort; numeric?: boolean; wide?: boolean }[] = [
  { label: 'Companie', sort: ListAdminCompaniesSort.name },
  { label: 'Owner', wide: true },
  { label: 'Plan', sort: ListAdminCompaniesSort.plan },
  { label: 'Stare' },
  { label: 'Locuri', sort: ListAdminCompaniesSort.seats, numeric: true, wide: true },
  { label: 'Expiră', sort: ListAdminCompaniesSort.expires, wide: true },
  { label: 'Ultima activitate', sort: ListAdminCompaniesSort.last_activity, wide: true },
]

const WIDE = 'max-sm:hidden'

export function AdminCompaniesSection() {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [planType, setPlanType] = useState<NonNullable<ListAdminCompaniesPlanType> | ''>('')
  const [planStatus, setPlanStatus] = useState<NonNullable<ListAdminCompaniesPlanStatus> | ''>('')
  const [sort, setSort] = useState<ListAdminCompaniesSort>(ListAdminCompaniesSort.name)
  const [order, setOrder] = useState<ListAdminCompaniesOrder>(ListAdminCompaniesOrder.asc)
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const { data, isLoading, isFetching } = useAdminCompanies({
    q: search || undefined,
    plan_type: planType || undefined,
    plan_status: planStatus || undefined,
    sort,
    order,
    page,
    page_size: PAGE_SIZE,
  })

  const companies = data?.data ?? []
  const total = data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const selected = companies.find((company) => company.company_id === selectedId)

  const toggleSort = (column: ListAdminCompaniesSort) => {
    if (column === sort) {
      setOrder(order === ListAdminCompaniesOrder.asc ? ListAdminCompaniesOrder.desc : ListAdminCompaniesOrder.asc)
    } else {
      setSort(column)
      // Dates are most useful newest-first; names and numbers ascending.
      setOrder(
        column === ListAdminCompaniesSort.last_activity ? ListAdminCompaniesOrder.desc : ListAdminCompaniesOrder.asc,
      )
    }
    setPage(1)
  }

  return (
    <>
      <AdminPageHeader
        title="Companii"
        subtitle="Alege o companie ca să vezi detaliile, membrii și planul sau să îi schimbi accesul."
      />

      <AdminSheet>
        <AdminSheetSection flush>
          <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-line)] p-3">
            <input
              type="search"
              className="input w-full rounded-[var(--radius-lg)] bg-[var(--color-surface-2)] sm:w-72"
              placeholder="Caută companie, persoană sau email"
              aria-label="Caută companie, persoană sau email"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
            <select
              className="select min-w-0 flex-1 rounded-[var(--radius-lg)] bg-[var(--color-surface-2)] sm:flex-none"
              aria-label="Filtrează după plan"
              value={planType}
              onChange={(event) => {
                setPlanType(event.target.value as NonNullable<ListAdminCompaniesPlanType> | '')
                setPage(1)
              }}
            >
              <option value="">Toate planurile</option>
              {Object.entries(PLAN_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <select
              className="select min-w-0 flex-1 rounded-[var(--radius-lg)] bg-[var(--color-surface-2)] sm:flex-none"
              aria-label="Filtrează după stare"
              value={planStatus}
              onChange={(event) => {
                setPlanStatus(event.target.value as NonNullable<ListAdminCompaniesPlanStatus> | '')
                setPage(1)
              }}
            >
              <option value="">Toate stările</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {isFetching && !isLoading && <span className="loading loading-spinner loading-xs" />}
            <span className="ml-auto text-[13px] text-[var(--color-ink-soft)] tabular-nums">{total} companii</span>
          </div>

          {isLoading ? (
            <AdminLoading />
          ) : (
            <AdminTable>
              <thead>
                <tr>
                  {COLUMNS.map((column) => (
                    <th
                      key={column.label}
                      className={[column.numeric && 'num', column.wide && WIDE].filter(Boolean).join(' ') || undefined}
                    >
                      {column.sort ? (
                        <button
                          type="button"
                          className="cursor-pointer font-semibold hover:text-[var(--color-primary)]"
                          onClick={() => toggleSort(column.sort as ListAdminCompaniesSort)}
                        >
                          {column.label}
                          {column.sort === sort && (order === ListAdminCompaniesOrder.asc ? ' ↑' : ' ↓')}
                        </button>
                      ) : (
                        column.label
                      )}
                    </th>
                  ))}
                  <th aria-hidden />
                </tr>
              </thead>
              <tbody>
                {companies.length === 0 && (
                  <AdminEmptyRow colSpan={COLUMNS.length + 1}>
                    Nicio companie nu se potrivește. Șterge filtrele sau schimbă căutarea.
                  </AdminEmptyRow>
                )}
                {companies.map((company) => (
                  <tr key={company.company_id} className="row-link" onClick={() => setSelectedId(company.company_id)}>
                    <td className="font-medium text-[var(--color-ink)]">
                      {company.company_name}
                      <div className="max-w-[45vw] truncate text-[12px] font-normal text-[var(--color-ink-soft)] sm:hidden">
                        {company.owner_name}
                      </div>
                    </td>
                    <td className={`max-w-[300px] ${WIDE}`}>
                      <div className="flex items-baseline gap-2">
                        <span className="shrink-0">{company.owner_name}</span>
                        <span className="truncate text-[12px] text-[var(--color-ink-soft)]">{company.owner_email}</span>
                      </div>
                      {(company.matched_members ?? [])
                        .filter((member) => member.company_role !== 'owner')
                        .map((member) => (
                          <div key={member.email} className="truncate text-[12px] text-[var(--color-ink-soft)]">
                            Găsit: {member.name} · {member.email} ({ROLE_LABELS[member.company_role]})
                          </div>
                        ))}
                    </td>
                    <td>{planLabel(company.plan_type)}</td>
                    <td>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <StatusDot tone={company.plan_status === 'read_only' ? 'error' : 'success'}>
                          {STATUS_LABELS[company.plan_status]}
                        </StatusDot>
                        {company.restriction && (
                          <StatusDot tone="warning">
                            {company.restriction === 'suspended' ? 'Suspendată' : 'Doar citire (admin)'}
                          </StatusDot>
                        )}
                      </div>
                    </td>
                    <td className={`num ${WIDE}`}>
                      {company.seats_limit === 0 ? '—' : `${company.seats_used} / ${company.seats_limit ?? '∞'}`}
                    </td>
                    <td className={`tabular-nums ${WIDE}`}>
                      {company.plan_expires_at ? formatPlanDate(company.plan_expires_at) : '—'}
                    </td>
                    <td className={`tabular-nums ${WIDE}`}>
                      {company.last_activity_at ? formatPlanDate(company.last_activity_at) : '—'}
                    </td>
                    <td className="w-8 text-[var(--color-ink-muted)]">
                      <ChevronRight className="h-4 w-4" aria-hidden />
                    </td>
                  </tr>
                ))}
              </tbody>
            </AdminTable>
          )}

          <AdminPager page={page} pageCount={pageCount} onPage={setPage} />
        </AdminSheetSection>
      </AdminSheet>

      {selected && (
        <AdminCompanyModal
          key={selected.company_id}
          companyId={selected.company_id}
          companyName={selected.company_name}
          onClose={() => setSelectedId(null)}
        />
      )}
    </>
  )
}
