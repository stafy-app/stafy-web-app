import { useQuery } from '@tanstack/react-query'
import { getUsers } from '../api/generated/endpoints/users/users'

export function useEmployeeTimeEntries(
  employeeId: number,
  year: number,
  month: number,
  activityId?: number,
  enabled = true,
) {
  return useQuery({
    queryKey: ['employee-time-entries', employeeId, year, month, activityId ?? null],
    queryFn: () =>
      getUsers().listEmployeeTimeEntries(employeeId, {
        year,
        month,
        ...(activityId !== undefined ? { activity_id: activityId } : {}),
      }),
    enabled,
  })
}
