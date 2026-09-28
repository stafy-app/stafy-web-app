import { useAttendanceMonth } from './useAttendanceMonth'
import { AttendancePeriodHeader } from './AttendancePeriodHeader'
import { AttendanceEntriesTable } from './AttendanceEntriesTable'

interface AttendanceTabProps {
  employeeId: number
  /** Company shell (EmployeeProfilePage, Reports flows) shows the bonus editor for
   * managers; the /me personal shell passes false — bonus is granted there, never
   * self-applied. Read (amount) renders either way. */
  allowBonusEdit?: boolean
  /** BonusCard is redundant in the /me personal shell — the same bonus amount already
   * renders as a row inside the Pontaje table below, so a second card showing it (or a
   * non-editable placeholder) next to the period bar adds nothing. Company shell keeps it. */
  showBonusCard?: boolean
  /** Delete column on the Pontaje table. Backend ownership-checks DELETE /time-entries/{id}
   * to the entry's own owner, so this only makes sense in the /me personal shell — a manager
   * viewing an employee's history (EmployeeProfilePage) can never delete on their behalf. */
  allowDelete?: boolean
  /** Edit column — the inverse of allowDelete: PATCH /time-entries/{id} is manager/owner-only,
   * so it defaults on here (this component's only caller is the company shell,
   * EmployeeProfilePage) and would need to default off if a /me caller ever used this
   * component directly instead of composing AttendanceEntriesTable itself. */
  allowEdit?: boolean
}

/** Company-shell composition: period header + bonus card, then the Pontaje table, adjacent.
 * The /me personal shell (MyHistoryPage) doesn't use this component directly — it needs
 * HistoryTab's chart sandwiched between the two, so it calls useAttendanceMonth and renders
 * AttendancePeriodHeader/AttendanceEntriesTable itself, in a different order. */
export function AttendanceTab({
  employeeId,
  allowBonusEdit = true,
  showBonusCard = true,
  allowDelete = false,
  allowEdit = true,
}: AttendanceTabProps) {
  const data = useAttendanceMonth(employeeId, { allowBonusEdit })

  return (
    <div className="flex flex-col gap-4">
      <AttendancePeriodHeader employeeId={employeeId} data={data} showBonusCard={showBonusCard} />
      <AttendanceEntriesTable data={data} allowDelete={allowDelete} allowEdit={allowEdit} />
    </div>
  )
}
