import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getSubscriptions } from '@stafy/api/generated/endpoints/subscriptions/subscriptions'
import type { SubscriptionChangeIn } from '@stafy/api/generated/endpoints/index.schemas'
import { useProfile } from '@stafy/hooks/useProfile'
import { showToast } from '@stafy/lib/toast'
import { getCodedErrorMessage } from '@stafy/services/apiErrors'
import { isCompanyManager } from '@stafy/utils/companyRole'

export const MY_SUBSCRIPTION_KEY = ['subscription', 'me']

/** Plan status + seat usage of the caller's active company — owner/manager only (403 otherwise). */
export function useMySubscription() {
  const { data: profile } = useProfile()

  return useQuery({
    queryKey: MY_SUBSCRIPTION_KEY,
    queryFn: () => getSubscriptions().getMySubscription(),
    enabled: isCompanyManager(profile?.role),
  })
}

export function useChangeMyPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SubscriptionChangeIn) => getSubscriptions().changeMySubscription(data),
    onSuccess: (subscription) => {
      queryClient.setQueryData(MY_SUBSCRIPTION_KEY, subscription)
      showToast('Planul a fost actualizat.')
    },
    onError: (error) => {
      showToast(getCodedErrorMessage(error, 'Nu am putut schimba planul.'), { tone: 'danger' })
    },
  })
}
