import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getAdmin } from '@stafy/api/generated/endpoints/admin/admin'
import type {
  AdminSubscriptionChangeIn,
  GetAdminActivityParams,
  GetAdminGrowthParams,
} from '@stafy/api/generated/endpoints/index.schemas'
import { showToast } from '@stafy/lib/toast'
import { getCodedErrorMessage } from '@stafy/services/apiErrors'

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

const ADMIN_COMPANIES_KEY = ['admin', 'companies']

export function useAdminCompanies() {
  return useQuery({
    queryKey: ADMIN_COMPANIES_KEY,
    queryFn: () => getAdmin().listAdminCompanies(),
  })
}

export function useAdminCompanySubscription(companyId: number | null) {
  return useQuery({
    queryKey: ['admin', 'company-subscription', companyId],
    queryFn: () => getAdmin().getAdminCompanySubscription(companyId as number),
    enabled: companyId !== null,
  })
}

export function useAdminSubscriptionEvents(companyId: number | null) {
  return useQuery({
    queryKey: ['admin', 'company-subscription-events', companyId],
    queryFn: () => getAdmin().listAdminCompanySubscriptionEvents(companyId as number),
    enabled: companyId !== null,
  })
}

export function useAdminSetSubscription(companyId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: AdminSubscriptionChangeIn) =>
      getAdmin().changeAdminCompanySubscription(companyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'company-subscription', companyId] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'company-subscription-events', companyId] })
      queryClient.invalidateQueries({ queryKey: ADMIN_COMPANIES_KEY })
      showToast('Planul companiei a fost actualizat.')
    },
    onError: (error) => {
      showToast(getCodedErrorMessage(error, 'Nu am putut actualiza planul.'), { tone: 'danger' })
    },
  })
}
