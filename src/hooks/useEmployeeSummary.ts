import { useQuery } from '@tanstack/react-query'
import { getUsers } from '@stafy/api/generated/endpoints/users/users'

export function useEmployeeSummary(employeeId: number, year: number, month: number) {
  return useQuery({
    queryKey: ['employee-summary', employeeId, year, month],
    queryFn: () => getUsers().getEmployeeSummary(employeeId, { year, month }),
  })
}
