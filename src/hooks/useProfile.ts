import { useQuery } from '@tanstack/react-query'
import { getUsers } from '@stafy/api/generated/endpoints/users/users'

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => getUsers().getProfile(),
  })
}
