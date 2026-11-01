import { useEffect, useState } from 'react'
import { useAdminCompanies } from '@stafy/hooks/useAdmin'
import { AdminCompanyDetailPanel } from '@stafy/components/admin/AdminCompanyDetailPanel'
import { AdminCompanyPlanPanel } from '@stafy/components/admin/AdminCompanyPlanPanel'
import {
  ListAdminCompaniesOrder,
  ListAdminCompaniesPlanStatus,
  ListAdminCompaniesPlanType,
  ListAdminCompaniesSort,
} from '@stafy/api/generated/endpoints/index.schemas'
import { PLAN_LABELS, STATUS_LABELS, formatPlanDate, planLabel } from '@stafy/utils/planLabels'

const PAGE_SIZE = 25

const COLUMNS: { label: string; sort?: ListAdminCompaniesSort }[] = [
  { label: 'Companie', sort: ListAdminCompaniesSort.name },
  { label: 'Owner' },
  { label: 'Plan', sort: ListAdminCompaniesSort.plan },
  { label: 'Stare' },
  { label: 'Locuri', sort: ListAdminCompaniesSort.seats },
  { label: 'Expiră', sort: ListAdminCompaniesSort.expires },
  { label: 'Ultima activitate', sort: ListAdminCompaniesSort.last_activity },
]

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
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-[16px] font-semibold text-[var(--color-ink)]">Companii și abonamente</h2>
        <p className="text-[13px] text-[var(--color-ink-muted)]">
          Companiile cu owner, planul lor, locurile folosite și data ultimului pont. Alege una ca să-i schimbi planul sau
          să vezi istoricul.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          className="input input-sm w-64"
          placeholder="Caută companie, owner sau email"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
        />
        <select
          className="select select-sm"
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
          className="select select-sm"
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
        <span className="ml-auto text-[12px] text-[var(--color-ink-muted)]">{total} companii</span>
      </div>

      {isLoading ? (
        <span className="loading loading-spinner loading-sm" />
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-sm">
            <thead>
              <tr>
                {COLUMNS.map((column) => (
                  <th key={column.label}>
                    {column.sort ? (
                      <button
                        type="button"
                        className="cursor-pointer font-semibold hover:text-[var(--color-primary)]"
                        onClick={() => toggleSort(column.sort as ListAdminCompaniesSort)}
                      >
                        {column.label}
                        {column.sort === sort && (order === ListAdminCompaniesOrder.asc ? ' ▲' : ' ▼')}
                      </button>
                    ) : (
                      column.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {companies.length === 0 && (
                <tr>
                  <td colSpan={COLUMNS.length} className="text-center text-[var(--color-ink-muted)]">
                    Nicio companie nu se potrivește.
                  </td>
                </tr>
              )}
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
                  <td>{company.last_activity_at ? formatPlanDate(company.last_activity_at) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pageCount > 1 && (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            className="btn btn-sm btn-outline"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Înapoi
          </button>
          <span className="text-[12px] text-[var(--color-ink-muted)]">
            Pagina {page} din {pageCount}
          </span>
          <button
            type="button"
            className="btn btn-sm btn-outline"
            disabled={page >= pageCount}
            onClick={() => setPage(page + 1)}
          >
            Înainte
          </button>
        </div>
      )}

      {selected && (
        <div className="flex flex-col gap-5 rounded-[var(--radius-md)] border border-[var(--color-line)] p-5">
          <AdminCompanyDetailPanel key={`detail-${selected.company_id}`} companyId={selected.company_id} />
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
