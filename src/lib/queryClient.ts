import { MutationCache, QueryClient } from '@tanstack/react-query'
import { getApiError } from '@stafy/services/apiErrors'

export const queryClient = new QueryClient({
  // Any write can come back 403 `plan_read_only` once a plan lapses in another tab/session. The
  // banner and Subscription section read the cached plan, so refetch it. No toast here — every
  // mutation already toasts its own error through getCodedErrorMessage, and a second one would
  // just be noise.
  mutationCache: new MutationCache({
    onError: (error) => {
      if (getApiError(error)?.code === 'plan_read_only') {
        void queryClient.invalidateQueries({ queryKey: ['subscription', 'me'] })
      }
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
