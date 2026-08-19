import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getSettings } from '@stafy/api/generated/endpoints/settings/settings'
import type { CompanyUpdateIn } from '@stafy/api/generated/endpoints/index.schemas'

export function useCompany() {
  return useQuery({
    queryKey: ['company'],
    queryFn: () => getSettings().getMyCompany(),
  })
}

export function useUpdateCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CompanyUpdateIn) => getSettings().updateMyCompany(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company'] })
    },
  })
}
