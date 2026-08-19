import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getActivities } from '@stafy/api/generated/endpoints/activities/activities'
import type { ActivityCreateIn, ActivityUpdateIn } from '@stafy/api/generated/endpoints/index.schemas'

export function useActivities() {
  return useQuery({
    queryKey: ['activities'],
    queryFn: () => getActivities().listActivities(),
  })
}

export function useCreateActivity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ActivityCreateIn) => getActivities().createActivity(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
    },
  })
}

export function useUpdateActivity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ activityId, data }: { activityId: number; data: ActivityUpdateIn }) =>
      getActivities().updateActivity(activityId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
    },
  })
}
