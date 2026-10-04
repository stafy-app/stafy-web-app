import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getInfra } from '@stafy/api/generated/endpoints/infra/infra'
import { showToast } from '@stafy/lib/toast'
import { getCodedErrorMessage } from '@stafy/services/apiErrors'

const ADMIN_INFRA_KEY = ['admin', 'infra']
// Matches the backend's cache (~45 s): polling faster would only re-read cached data.
const POLL_MS = 60_000

export function useAdminInfra() {
  return useQuery({
    queryKey: ADMIN_INFRA_KEY,
    queryFn: () => getInfra().getAdminInfra(),
    refetchInterval: POLL_MS,
  })
}

// Asks the backend to bypass its cache (it still reuses data a few seconds old, so a
// mashed button can't exhaust a provider's rate limit) and swaps the result in.
export function useRefreshAdminInfra() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => getInfra().getAdminInfra({ refresh: true }),
    onSuccess: (data) => {
      queryClient.setQueryData(ADMIN_INFRA_KEY, data)
    },
    onError: (error) => {
      showToast(getCodedErrorMessage(error, 'Nu am putut reîmprospăta starea infrastructurii.'), {
        tone: 'danger',
      })
    },
  })
}
