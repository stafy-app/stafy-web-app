import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getUsers } from '@stafy/api/generated/endpoints/users/users'

export function useEmployeeRates(employeeId: number, year: number, month: number) {
  return useQuery({
    queryKey: ['employee-rates', employeeId, year, month],
    queryFn: () => getUsers().listEmployeeHourlyRates(employeeId, { year, month }),
  })
}

export function useSetEmployeeRate(employeeId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ activityId, hourlyRateGross }: { activityId: number; hourlyRateGross: string }) =>
      getUsers().setEmployeeHourlyRate(employeeId, activityId, { hourly_rate_gross: hourlyRateGross }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-rates', employeeId] })
    },
  })
}
