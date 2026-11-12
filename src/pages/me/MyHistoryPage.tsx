import { useProfile } from '@stafy/hooks/useProfile'
import { useTopBar } from '@stafy/hooks/useTopBar'
import { HistoryTab } from '@stafy/components/employee/tabs/HistoryTab'
import { useAttendanceMonth } from '@stafy/components/employee/tabs/useAttendanceMonth'
import { AttendancePeriodHeader } from '@stafy/components/employee/tabs/AttendancePeriodHeader'
import { AttendanceEntriesTable } from '@stafy/components/employee/tabs/AttendanceEntriesTable'

export default function MyHistoryPage() {
  useTopBar({ title: 'Istoric', subtitle: 'Toate pontajele tale' })

  const { data: profile } = useProfile()
  const employeeId = profile?.id
  // Called unconditionally (rules of hooks) with a 0 fallback id — enabled: false keeps the
  // underlying queries from firing until profile resolves; the early return below then bails
  // before this component's JSX (which would otherwise read the still-empty result) mounts.
  const attendanceData = useAttendanceMonth(employeeId ?? 0, { allowBonusEdit: false, enabled: !!employeeId })

  if (!employeeId) return null

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-4 sm:gap-5">
      <AttendancePeriodHeader employeeId={employeeId} data={attendanceData} showBonusCard={false} />

      {/* KPI cards follow the month picked above (issue #34): totals from the month's report,
          which useAttendanceMonth already fetches, so no extra request. */}
      <HistoryTab
        employeeId={employeeId}
        selectedMonth={{
          year: attendanceData.period.year,
          month: attendanceData.period.month,
          totalHours: attendanceData.report?.total_hours ?? 0,
          totalPay: parseFloat(attendanceData.report?.total_pay ?? '0'),
          workedDays: attendanceData.workedDays,
        }}
      />

      <AttendanceEntriesTable data={attendanceData} allowDelete />
    </div>
  )
}
