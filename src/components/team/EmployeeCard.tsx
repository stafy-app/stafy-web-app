import { useNavigate } from '@tanstack/react-router'
import type { CompanyTopEmployeeOut } from '@stafy/api/generated/endpoints/index.schemas'
import { getInitials } from '@stafy/utils/initials'
import { Delta } from '@stafy/components/shared/Delta'
import { ICONS } from '@stafy/lib/icons'

interface EmployeeCardProps {
  member: CompanyTopEmployeeOut
  index: number
}

const MAX_ACTIVITY_CHIPS = 4

const gross = new Intl.NumberFormat('ro-RO', { maximumFractionDigits: 0 })

export function EmployeeCard({ member, index }: EmployeeCardProps) {
  const navigate = useNavigate()
  const { user } = member
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ')
  const visibleActivities = member.activities.slice(0, MAX_ACTIVITY_CHIPS)
  const extraCount = member.activities.length - visibleActivities.length

  return (
    <div
      onClick={() => navigate({ to: '/team/$employeeId', params: { employeeId: String(user.id) } })}
      className="animate-fade-slide-in group flex cursor-pointer flex-col gap-4 rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-xs)] transition-all duration-[180ms] hover:-translate-y-0.5 hover:border-[var(--color-primary)] hover:shadow-[var(--shadow-md)]"
      style={{ animationDelay: `${Math.min(index * 50, 400)}ms` }}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[14px] font-bold text-[var(--color-primary-active)]">
          {getInitials(user.first_name, user.last_name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-semibold text-[var(--color-ink)]">{fullName}</div>
          <div className="truncate text-[12px] text-[var(--color-ink-muted)]">{user.email}</div>
        </div>
        <span
          className={`inline-flex flex-shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
            user.is_active
              ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]'
              : 'bg-[var(--color-ink-muted)]/10 text-[var(--color-ink-muted)]'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              user.is_active ? 'bg-[var(--color-success)]' : 'bg-[var(--color-ink-muted)]'
            }`}
          />
          {user.is_active ? 'Activ' : 'Inactiv'}
        </span>
      </div>

      <div className="grid grid-cols-2 border-y border-[var(--color-line-soft)] py-3.5">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[var(--color-ink-muted)]">
            Ore luna asta
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-[var(--font-mono)] text-[22px] font-bold text-[var(--color-ink)]">
              {member.total_hours.toFixed(1)}h
            </span>
            <Delta value={member.delta_vs_previous_month} />
          </div>
        </div>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[var(--color-ink-muted)]">
            De plată
          </div>
          <div className="mt-1 font-[var(--font-mono)] text-[18px] font-bold text-[var(--color-ink)]">
            {gross.format(parseFloat(member.estimated_gross))} RON
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap gap-1">
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
        <div className="flex flex-shrink-0 items-center gap-1 text-[13px] font-medium text-[var(--color-ink-soft)] transition-colors group-hover:text-[var(--color-primary)]">
          Detalii
          <ICONS.chevronRight className="h-3.5 w-3.5" />
        </div>
      </div>
    </div>
  )
}
