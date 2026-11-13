import { useState } from 'react'
import { useAuditLogs } from '@stafy/hooks/useAuditLogs'
import { ADMIN_CONTROL, AdminField } from '@stafy/components/admin/ui/AdminField'
import { AdminSheet, AdminSheetSection } from '@stafy/components/admin/ui/AdminSheet'
import { AdminPageHeader } from '@stafy/components/admin/ui/AdminPageHeader'
import { AdminEmptyRow, AdminLoading, AdminTable } from '@stafy/components/admin/ui/AdminTable'
import { ACTION_LABELS, formatAuditDetail } from '@stafy/utils/auditLogFormat'

const PAGE_SIZE = 50

const dateTimeFormatter = new Intl.DateTimeFormat('ro-RO', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

/**
 * Cross-company audit feed in the console's own table. Same data and formatting as the manager's Settings
 * audit (`useAuditLogs`, `auditLogFormat`), different presentation, so the managers' section stays untouched.
 */
export function AdminAuditSection() {
  const [visibleLimit, setVisibleLimit] = useState(PAGE_SIZE)
  const [action, setAction] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [companyId, setCompanyId] = useState('')

  const { data, isLoading } = useAuditLogs({
    limit: visibleLimit,
    offset: 0,
    action: action || undefined,
    date_from: dateFrom ? new Date(dateFrom).toISOString() : undefined,
    date_to: dateTo ? new Date(dateTo).toISOString() : undefined,
    company_id: companyId ? Number(companyId) : undefined,
  })

  function change(setter: (value: string) => void) {
    return (value: string) => {
      setter(value)
      setVisibleLimit(PAGE_SIZE)
    }
  }

  const entries = data?.data ?? []

  return (
    <>
      <AdminPageHeader
        title="Audit"
        subtitle="Acțiunile sensibile din toate companiile, inclusiv ce a făcut echipa Stafy, cu motiv."
      />

      <AdminSheet>
        <AdminSheetSection flush>
          <div className="flex flex-wrap items-end gap-3 border-b border-[var(--color-line)] p-3">
            <AdminField label="Acțiune">
              <select
                className={`select ${ADMIN_CONTROL}`}
                value={action}
                onChange={(event) => change(setAction)(event.target.value)}
              >
                <option value="">Toate</option>
                {Object.entries(ACTION_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </AdminField>
            <AdminField label="De la">
              <input
                type="date"
                className={`input ${ADMIN_CONTROL}`}
                value={dateFrom}
                onChange={(event) => change(setDateFrom)(event.target.value)}
              />
            </AdminField>
            <AdminField label="Până la">
              <input
                type="date"
                className={`input ${ADMIN_CONTROL}`}
                value={dateTo}
                onChange={(event) => change(setDateTo)(event.target.value)}
              />
            </AdminField>
            <AdminField label="ID companie">
              <input
                type="number"
                className={`input w-28 ${ADMIN_CONTROL}`}
                placeholder="Toate"
                value={companyId}
                onChange={(event) => change(setCompanyId)(event.target.value)}
              />
            </AdminField>
          </div>

          {isLoading ? (
            <AdminLoading />
          ) : (
            <AdminTable>
              <thead>
                <tr>
                  <th>Dată</th>
                  <th>Acțiune</th>
                  <th>Cine</th>
                  <th>Pentru cine</th>
                  <th>Companie</th>
                  <th>Detalii</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 && (
                  <AdminEmptyRow colSpan={6}>Nicio acțiune înregistrată pentru filtrele alese.</AdminEmptyRow>
                )}
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="whitespace-nowrap tabular-nums text-[var(--color-ink-soft)]">
                      {dateTimeFormatter.format(new Date(entry.created_at))}
                    </td>
                    <td className="font-medium text-[var(--color-ink)]">
                      {ACTION_LABELS[entry.action] ?? entry.action}
                    </td>
                    <td>{entry.actor_name}</td>
                    <td className="text-[var(--color-ink-soft)]">{entry.target_name ?? '—'}</td>
                    <td className="text-[var(--color-ink-soft)]">{entry.company_name ?? '—'}</td>
                    <td
                      className="max-w-[320px] truncate text-[var(--color-ink-soft)]"
                      title={formatAuditDetail(entry)}
                    >
                      {formatAuditDetail(entry)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </AdminTable>
          )}

          {data?.has_more && (
            <div className="border-t border-[var(--color-line)] p-3 text-center">
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => setVisibleLimit((limit) => limit + PAGE_SIZE)}
              >
                Încarcă mai multe
              </button>
            </div>
          )}
        </AdminSheetSection>
      </AdminSheet>
    </>
  )
}
