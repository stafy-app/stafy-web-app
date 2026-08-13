import type { CompanyTopEmployeeOut } from '../../api/generated/endpoints/index.schemas'
import { getInitials } from '../../utils/initials'
import { ICONS } from '../../lib/icons'

interface ReportEmployeePickerProps {
  members: CompanyTopEmployeeOut[]
  selectedEmployeeId: number | null
  onSelect: (employeeId: number) => void
}

export function ReportEmployeePicker({ members, selectedEmployeeId, onSelect }: ReportEmployeePickerProps) {
  return (
    <div className="flex flex-col gap-1">
      {members.map(({ user }) => {
        const isSelected = user.id === selectedEmployeeId
        const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ')

        return (
          <button
            key={user.id}
            type="button"
            onClick={() => onSelect(user.id!)}
            className={`flex items-center gap-2.5 rounded-[var(--radius-md)] px-2.5 py-2 text-left transition-colors ${
              isSelected
                ? 'bg-[var(--color-primary-soft)]'
                : 'hover:bg-[var(--color-surface-2)]'
            }`}
          >
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[12px] font-bold text-[var(--color-primary-active)]">
              {getInitials(user.first_name, user.last_name)}
            </div>
            <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[var(--color-ink)]">
              {fullName}
            </span>
            {isSelected && <ICONS.check className="h-4 w-4 flex-shrink-0 text-[var(--color-primary)]" />}
          </button>
        )
      })}
    </div>
  )
}
