import { PeriodBar } from '@stafy/components/dashboard/PeriodBar'
import { BonusCard } from '@stafy/components/reports/BonusCard'
import type { AttendanceMonthData } from './useAttendanceMonth'

interface AttendancePeriodHeaderProps {
  employeeId: number
  data: AttendanceMonthData
  /** BonusCard is redundant in the /me personal shell — the same bonus amount already
   * renders as a row inside AttendanceEntriesTable, so a second card next to the period
   * bar adds nothing. Company shell (AttendanceTab) keeps it. */
  showBonusCard?: boolean
}

export function AttendancePeriodHeader({ employeeId, data, showBonusCard = true }: AttendancePeriodHeaderProps) {
  return (
    <div className="flex flex-wrap items-start gap-4">
      <div className="min-w-0 flex-1 sm:min-w-[280px]">
        <PeriodBar
          year={data.period.year}
          month={data.period.month}
          isCurrentMonth={data.isCurrentMonth}
          onPrev={data.goToPrevMonth}
          onNext={data.goToNextMonth}
          onJumpToCurrent={data.jumpToCurrentMonth}
        />
      </div>
      {showBonusCard && (
        <div className="w-full flex-shrink-0 sm:w-[260px]">
          <BonusCard
            key={`${employeeId}-${data.period.year}-${data.period.month}`}
            bonus={data.report?.bonus}
            onSave={(amount, reason) => data.setBonusMutation.mutate({ amount, reason })}
            onClear={() => data.clearBonusMutation.mutate()}
            editable={data.canEditBonus}
          />
        </div>
      )}
    </div>
  )
}
