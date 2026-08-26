import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getSettings } from '@stafy/api/generated/endpoints/settings/settings'
import type { AccountUpdateIn } from '@stafy/api/generated/endpoints/index.schemas'

export function useUpdateAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: AccountUpdateIn) => getSettings().updateMyAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}
