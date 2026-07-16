import { ChevronRight } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import type { CompanyTopEmployeeOut } from '../../api/generated/endpoints/index.schemas'
import { getInitials } from '../../utils/initials'
import { Delta } from './Delta'

interface TopEmployeesTableProps {
  employees: CompanyTopEmployeeOut[]
  totalEmployeeCount: number
}

const MAX_ACTIVITY_CHIPS = 3

const gross = new Intl.NumberFormat('ro-RO', { maximumFractionDigits: 0 })

export function TopEmployeesTable({ employees, totalEmployeeCount }: TopEmployeesTableProps) {
  const navigate = useNavigate()

  return (
    <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]">
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <div className="text-[16px] font-semibold text-[var(--color-ink)]">Echipa ta · top 5</div>
          <div className="text-[12px] text-[var(--color-ink-muted)]">Angajați după ore lucrate luna aceasta</div>
        </div>
        <button
          type="button"
          onClick={() => navigate({ to: '/team' })}
          className="flex items-center gap-1 rounded-[var(--radius-md)] px-2 py-1 text-[13px] font-medium text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-surface-2)]"
        >
          Vezi toți ({totalEmployeeCount})
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-[var(--color-surface-2)] text-left text-[11px] uppercase tracking-[0.05em] text-[var(--color-ink-muted)]">
            <th className="px-5 py-2.5 font-semibold">Angajat</th>
            <th className="px-5 py-2.5 font-semibold">Ore luna aceasta</th>
            <th className="px-5 py-2.5 font-semibold">Δ vs luna trecută</th>
            <th className="px-5 py-2.5 font-semibold">Activități</th>
            <th className="px-5 py-2.5 font-semibold">Estimat</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => {
            const { user } = employee
            const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ')
            const visibleActivities = employee.activities.slice(0, MAX_ACTIVITY_CHIPS)
            const extraCount = employee.activities.length - visibleActivities.length

            return (
              <tr
                key={user.id}
                onClick={() => navigate({ to: '/team/$employeeId', params: { employeeId: String(user.id) } })}
                className="cursor-pointer border-t border-[var(--color-line-soft)] transition-colors hover:bg-[var(--color-surface-2)]"
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[12px] font-bold text-[var(--color-primary-active)]">
                      {getInitials(user.first_name, user.last_name)}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-[14px] font-semibold text-[var(--color-ink)]">{fullName}</div>
                      <div className="truncate text-[12px] text-[var(--color-ink-muted)]">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 font-[var(--font-mono)] text-[14px] font-semibold text-[var(--color-ink)]">
                  {employee.total_hours.toFixed(1)}h
                </td>
                <td className="px-5 py-3">
                  <Delta value={employee.delta_vs_previous_month} />
                </td>
                <td className="px-5 py-3">
                  <div className="flex flex-wrap gap-1">
                    {visibleActivities.map((activity) => (
                      <span
                        key={activity}
                        className="rounded-full bg-[var(--color-surface-2)] px-2 py-0.5 text-[11px] text-[var(--color-ink-soft)]"
                      >
                        {activity}
                      </span>
                    ))}
                    {extraCount > 0 && (
                      <span className="rounded-full bg-[var(--color-surface-2)] px-2 py-0.5 text-[11px] text-[var(--color-ink-muted)]">
                        +{extraCount}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3 font-[var(--font-mono)] text-[13px] text-[var(--color-ink-soft)]">
                  {gross.format(parseFloat(employee.estimated_gross))} RON
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
