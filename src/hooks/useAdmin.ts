import { useQuery } from '@tanstack/react-query'
import { getAdmin } from '@stafy/api/generated/endpoints/admin/admin'
import type { GetAdminActivityParams, GetAdminGrowthParams } from '@stafy/api/generated/endpoints/index.schemas'

export function useAdminOverview() {
  return useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: () => getAdmin().getAdminOverview(),
  })
}

export function useAdminGrowth(params?: GetAdminGrowthParams) {
  return useQuery({
    queryKey: ['admin', 'growth', params],
    queryFn: () => getAdmin().getAdminGrowth(params),
  })
}

export function useAdminInvitationFunnel() {
  return useQuery({
    queryKey: ['admin', 'invitations-funnel'],
    queryFn: () => getAdmin().getAdminInvitationsFunnel(),
  })
}

export function useAdminActivity(params?: GetAdminActivityParams) {
  return useQuery({
    queryKey: ['admin', 'activity', params],
    queryFn: () => getAdmin().getAdminActivity(params),
  })
}
