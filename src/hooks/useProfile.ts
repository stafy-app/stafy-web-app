import { useQuery } from '@tanstack/react-query'
import { getUsers } from '@stafy/api/generated/endpoints/users/users'
import { useAuth } from '@stafy/hooks/useAuth'

// Gated on authResolved + firebaseUser — onAuthStateChanged resolves
// asynchronously on cold start, so an ungated query fires before
// auth.currentUser exists and the request interceptor (api.ts) has no
// token to attach, producing a spurious 401.
export function useProfile() {
  const { authResolved, firebaseUser } = useAuth()

  return useQuery({
    queryKey: ['profile'],
    queryFn: () => getUsers().getProfile(),
    enabled: authResolved && !!firebaseUser,
    // A 404 means "no backend row yet" (interrupted registration), not a
    // transient failure — don't retry it, AppLayout routes to recovery.
    retry: (failureCount, error) => {
      const status = (error as { response?: { status?: number } })?.response?.status
      return status !== 404 && failureCount < 1
    },
  })
}
