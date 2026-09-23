import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getUsers } from '@stafy/api/generated/endpoints/users/users'
import { getSettings } from '@stafy/api/generated/endpoints/settings/settings'

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

// Manager/admin viewing their own row via /team/{ownId}: setEmployeeHourlyRate rejects
// self (get_user_by_id_in_company only matches role=="employee"), so this routes the
// same { activityId, hourlyRateGross } shape through the self-service upsert instead —
// same upsert semantics (activate + edit in one call), same RatesTab UI, just a
// different backend call, invalidating this same employee-scoped query key so the tab
// refreshes identically either way.
export function useActivateOwnRateInEmployeeView(employeeId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ activityId, hourlyRateGross }: { activityId: number; hourlyRateGross: string }) =>
      getSettings().activateMyHourlyRate({ activity_id: activityId, hourly_rate_gross: hourlyRateGross }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-rates', employeeId] })
    },
  })
}
