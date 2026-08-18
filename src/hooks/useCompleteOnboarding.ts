import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getUsers } from '@stafy/api/generated/endpoints/users/users'
import type { OnboardingIn } from '@stafy/api/generated/endpoints/index.schemas'

export function useCompleteOnboarding() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: OnboardingIn) => getUsers().completeOnboarding(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}
