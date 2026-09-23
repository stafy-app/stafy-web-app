import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getUsers } from '@stafy/api/generated/endpoints/users/users'
import type { EmployeeOnboardingIn } from '@stafy/api/generated/endpoints/index.schemas'

export function useCompleteEmployeeOnboarding() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: EmployeeOnboardingIn) => getUsers().completeEmployeeOnboarding(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}
