import { useMemo, useState } from 'react'
import { useEmployeeTimeEntries } from '@stafy/hooks/useEmployeeTimeEntries'
import { useEmployeeReport, useSetReportBonus, useClearReportBonus } from '@stafy/hooks/useReports'
import { useProfile } from '@stafy/hooks/useProfile'
import { getAdjacentPeriod, getCurrentPeriod } from '@stafy/utils/period'
import { isCompanyManager } from '@stafy/utils/companyRole'

/**
 * Shared period/entries/bonus/filter state behind AttendancePeriodHeader +
 * AttendanceEntriesTable — one hook instance per screen so both pieces read
 * the same selected month, whether they're adjacent (AttendanceTab, the
 * company shell) or split across other content (MyHistoryPage's personal
 * shell, which sandwiches HistoryTab's chart between them).
 */
export function useAttendanceMonth(
  employeeId: number,
  { allowBonusEdit = true, enabled = true }: { allowBonusEdit?: boolean; enabled?: boolean } = {},
) {
  const [period, setPeriod] = useState(getCurrentPeriod)
  const current = getCurrentPeriod()
  const isCurrentMonth = period.year === current.year && period.month === current.month

  const { data, isLoading } = useEmployeeTimeEntries(employeeId, period.year, period.month, undefined, enabled)
  const entries = useMemo(() => data?.data ?? [], [data])
  const { data: report } = useEmployeeReport(employeeId, period.year, period.month, enabled)
  const bonus = report?.bonus && parseFloat(report.bonus.amount) > 0 ? report.bonus : null
  const setBonusMutation = useSetReportBonus(employeeId, period.year, period.month)
  const clearBonusMutation = useClearReportBonus(employeeId, period.year, period.month)
  // Bonus editor: company-manager-only (owner or manager, see isCompanyManager),
  // and hidden in the /me personal shell (allowBonusEdit=false there — bonus is
  // granted from the company context, never self-applied from personal). In the
  // company shell a manager edits any row, including their own — same parity
  // rule as rates.
  const { data: profileData } = useProfile()
  const canEditBonus = allowBonusEdit && isCompanyManager(profileData?.role)

  const [activityFilter, setActivityFilter] = useState<'all' | number>('all')

  const activities = useMemo(() => {
    const map = new Map<number, string>()
    for (const entry of entries) map.set(entry.activity.id, entry.activity.activity_name)
    return Array.from(map, ([id, name]) => ({ id, name }))
  }, [entries])

  const filteredEntries = useMemo(
    () => (activityFilter === 'all' ? entries : entries.filter((e) => e.activity.id === activityFilter)),
    [entries, activityFilter],
  )

  const totalHours = filteredEntries.reduce(
    (sum, e) => sum + (new Date(e.time_end).getTime() - new Date(e.time_start).getTime()) / 3_600_000,
    0,
  )

  function goToPrevMonth() {
    setPeriod((p) => getAdjacentPeriod(p, -1))
  }

  function goToNextMonth() {
    setPeriod((p) => getAdjacentPeriod(p, 1))
  }

  function jumpToCurrentMonth() {
    setPeriod(getCurrentPeriod())
  }

  return {
    period,
    isCurrentMonth,
    goToPrevMonth,
    goToNextMonth,
    jumpToCurrentMonth,
    isLoading,
    report,
    bonus,
    setBonusMutation,
    clearBonusMutation,
    canEditBonus,
    activityFilter,
    setActivityFilter,
    activities,
    filteredEntries,
    totalHours,
  }
}

export type AttendanceMonthData = ReturnType<typeof useAttendanceMonth>
