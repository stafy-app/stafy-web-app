import { useQuery } from '@tanstack/react-query'
import { getUsers } from '../api/generated/endpoints/users/users'

export function useEmployeeMonthlyHistory(employeeId: number, months = 5) {
  return useQuery({
    queryKey: ['employee-monthly-history', employeeId, months],
    queryFn: () => getUsers().getEmployeeMonthlyHistory(employeeId, { months }),
  })
}
