import { useQuery } from '@tanstack/react-query'
import { getUsers } from '@stafy/api/generated/endpoints/users/users'

export function useTeam() {
  return useQuery({
    queryKey: ['team'],
    queryFn: () => getUsers().listUsers(),
  })
}
