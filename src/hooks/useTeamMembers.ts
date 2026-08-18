import { useQuery } from '@tanstack/react-query'
import { getTeams } from '@stafy/api/generated/endpoints/teams/teams'

export function useTeamMembers(year: number, month: number) {
  return useQuery({
    queryKey: ['team-members', year, month],
    queryFn: () => getTeams().listTeamMembers({ year, month }),
  })
}
