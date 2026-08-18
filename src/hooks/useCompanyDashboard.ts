import { useQuery } from '@tanstack/react-query'
import { getDashboard } from '@stafy/api/generated/endpoints/dashboard/dashboard'

export function useCompanyDashboard(year: number, month: number) {
  return useQuery({
    queryKey: ['company-dashboard', year, month],
    queryFn: () => getDashboard().getCompanyDashboard({ year, month }),
  })
}
