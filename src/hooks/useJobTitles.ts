import { useQuery } from '@tanstack/react-query'
import { getUsers } from '@stafy/api/generated/endpoints/users/users'

export function useJobTitles() {
  return useQuery({
    queryKey: ['job-titles'],
    queryFn: () => getUsers().listJobTitles(),
  })
}
