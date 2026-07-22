import { useState } from 'react'
import { getInitials } from '../../utils/initials'
import { getCurrentPeriod } from '../../utils/period'
import { exportEmployeeTimeEntriesCsv } from '../../utils/exportEmployeeTimeEntriesCsv'
import { useEmployeeSummary } from '../../hooks/useEmployeeSummary'
import { useEmployeeTimeEntries } from '../../hooks/useEmployeeTimeEntries'
import {
  useReactivateEmployee,
  useSuspendEmployee,
  useUpdateEmployeeJobTitle,
} from '../../hooks/useEmployeeActions'
import { Delta } from '../shared/Delta'
import { EmployeeActionsMenu } from './EmployeeActionsMenu'

interface EmployeeHeaderCardProps {
  employeeId: number
}

const gross = new Intl.NumberFormat('ro-RO', { maximumFractionDigits: 0 })
const joinDateFormatter = new Intl.DateTimeFormat('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })

export function EmployeeHeaderCard({ employeeId }: EmployeeHeaderCardProps) {
  const { year, month } = getCurrentPeriod()
  const { data: summary } = useEmployeeSummary(employeeId, year, month)
  const { data: currentMonthEntries } = useEmployeeTimeEntries(employeeId, year, month)

  const updateJobTitle = useUpdateEmployeeJobTitle(employeeId)
  const suspend = useSuspendEmployee(employeeId)
  const reactivate = useReactivateEmployee(employeeId)

  const [isEditingJobTitle, setIsEditingJobTitle] = useState(false)
  const [draftJobTitle, setDraftJobTitle] = useState('')

  if (!summary) return null

  const { user } = summary
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ')

  function startEditingJobTitle() {
    setDraftJobTitle(user.job_title ?? '')
    setIsEditingJobTitle(true)
  }

  function saveJobTitle() {
    const value = draftJobTitle.trim()
    if (!value) return
    updateJobTitle.mutate(value, { onSuccess: () => setIsEditingJobTitle(false) })
  }

  return (
    <div className="animate-fade-slide-in rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
      <div className="flex flex-wrap items-center gap-5">
        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[20px] font-bold text-[var(--color-primary-active)]">
          {getInitials(user.first_name, user.last_name)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-[22px] font-bold text-[var(--color-ink)]">{fullName}</div>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                user.is_active
                  ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]'
                  : 'bg-[var(--color-ink-muted)]/10 text-[var(--color-ink-muted)]'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${user.is_active ? 'bg-[var(--color-success)]' : 'bg-[var(--color-ink-muted)]'}`} />
              {user.is_active ? 'Activ' : 'Suspendat'}
            </span>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[var(--color-ink-muted)]">
            <span>{user.email}</span>
            {user.created_at && <span>Membru din {joinDateFormatter.format(new Date(user.created_at))}</span>}
          </div>

          <div className="mt-1.5">
            {isEditingJobTitle ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={draftJobTitle}
                  onChange={(e) => setDraftJobTitle(e.target.value)}
                  autoFocus
                  className="rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-surface)] px-2 py-1 text-[12px] text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]"
                />
                <button
                  type="button"
                  onClick={saveJobTitle}
                  disabled={updateJobTitle.isPending}
                  className="text-[12px] font-semibold text-[var(--color-primary)] disabled:opacity-50"
                >
                  Salvează
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingJobTitle(false)}
                  className="text-[12px] text-[var(--color-ink-muted)]"
                >
                  Anulează
                </button>
              </div>
            ) : (
              user.job_title && (
                <span className="rounded-full bg-[var(--color-surface-2)] px-2 py-0.5 text-[11px] text-[var(--color-ink-soft)]">
                  {user.job_title}
                </span>
              )
            )}
          </div>
        </div>

        <div className="flex items-center gap-5 border-l border-[var(--color-line-soft)] pl-5">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[var(--color-ink-muted)]">
              Ore luna curentă
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-[var(--font-mono)] text-[20px] font-bold text-[var(--color-ink)]">
                {summary.total_hours.toFixed(1)}h
              </span>
              <Delta value={summary.delta_vs_previous_month} />
            </div>
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[var(--color-ink-muted)]">
              Estimat de plată
            </div>
            <div className="mt-1 font-[var(--font-mono)] text-[18px] font-bold text-[var(--color-ink)]">
              {gross.format(parseFloat(summary.estimated_gross))} RON
            </div>
          </div>
        </div>

        <EmployeeActionsMenu
          isActive={user.is_active ?? true}
          onEditJobTitle={startEditingJobTitle}
          onExportCsv={() =>
            exportEmployeeTimeEntriesCsv(currentMonthEntries?.data ?? [], fullName, year, month)
          }
          onSuspend={() => suspend.mutate()}
          onReactivate={() => reactivate.mutate()}
          disabled={suspend.isPending || reactivate.isPending}
        />
      </div>
    </div>
  )
}
