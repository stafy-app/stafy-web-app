import { useState } from 'react'
import { useProfile } from '@stafy/hooks/useProfile'
import { useAuditLogs } from '@stafy/hooks/useAuditLogs'
import { ACTION_LABELS, formatAuditDetail } from '@stafy/utils/auditLogFormat'

const PAGE_SIZE = 50

const dateTimeFormatter = new Intl.DateTimeFormat('ro-RO', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function AuditSection() {
  const { data: profile } = useProfile()
  const isAdmin = profile?.role === 'admin'

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
    company_id: isAdmin && companyId ? Number(companyId) : undefined,
  })

  function resetPage() {
    setVisibleLimit(PAGE_SIZE)
  }

  const entries = data?.data ?? []

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-[16px] font-semibold text-[var(--color-ink)]">Audit</h2>
        <p className="text-[13px] text-[var(--color-ink-muted)]">Istoric al acțiunilor sensibile din companie.</p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-[12px] text-[var(--color-ink-muted)]">
          Acțiune
          <select
            className="select select-sm"
            value={action}
            onChange={(e) => {
              setAction(e.target.value)
              resetPage()
            }}
          >
            <option value="">Toate</option>
            {Object.entries(ACTION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-[12px] text-[var(--color-ink-muted)]">
          De la
          <input
            type="date"
            className="input input-sm"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value)
              resetPage()
            }}
          />
        </label>

        <label className="flex flex-col gap-1 text-[12px] text-[var(--color-ink-muted)]">
          Până la
          <input
            type="date"
            className="input input-sm"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value)
              resetPage()
            }}
          />
        </label>

        {isAdmin && (
          <label className="flex flex-col gap-1 text-[12px] text-[var(--color-ink-muted)]">
            ID companie
            <input
              type="number"
              className="input input-sm w-28"
              placeholder="Toate"
              value={companyId}
              onChange={(e) => {
                setCompanyId(e.target.value)
                resetPage()
              }}
            />
          </label>
        )}
      </div>

      {isLoading ? null : entries.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-line)] p-10 text-center">
          <div className="text-[13px] text-[var(--color-ink-muted)]">Nicio acțiune înregistrată.</div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-line)]">
          <table className="table">
            <thead>
              <tr className="text-[12px] uppercase tracking-[0.06em] text-[var(--color-ink-muted)]">
                <th>Dată</th>
                <th>Acțiune</th>
                <th>Cine</th>
                <th>Pentru cine</th>
                {isAdmin && <th>Companie</th>}
                <th>Detalii</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="text-[13px] text-[var(--color-ink-muted)]">
                    {dateTimeFormatter.format(new Date(entry.created_at))}
                  </td>
                  <td className="text-[13px] text-[var(--color-ink)]">
                    {ACTION_LABELS[entry.action] ?? entry.action}
                  </td>
                  <td className="text-[13px] text-[var(--color-ink)]">{entry.actor_name}</td>
                  <td className="text-[13px] text-[var(--color-ink-muted)]">{entry.target_name ?? '—'}</td>
                  {isAdmin && (
                    <td className="text-[13px] text-[var(--color-ink-muted)]">{entry.company_name ?? '—'}</td>
                  )}
                  <td className="text-[13px] text-[var(--color-ink-muted)]">{formatAuditDetail(entry)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data?.has_more && (
        <button
          type="button"
          className="btn btn-outline btn-sm mx-auto"
          onClick={() => setVisibleLimit((limit) => limit + PAGE_SIZE)}
        >
          Încarcă mai multe
        </button>
      )}
    </div>
  )
}
