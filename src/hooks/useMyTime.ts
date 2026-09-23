import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getDashboard } from '@stafy/api/generated/endpoints/dashboard/dashboard'
import { getTimeEntries } from '@stafy/api/generated/endpoints/time-entries/time-entries'
import { getSettings } from '@stafy/api/generated/endpoints/settings/settings'
import type {
  TimeEntryIn,
  UserActivityCreate,
} from '@stafy/api/generated/endpoints/index.schemas'
import { showToast } from '@stafy/lib/toast'

export function useMyDashboard() {
  return useQuery({
    queryKey: ['my-dashboard'],
    queryFn: () => getDashboard().getMyDashboard(),
  })
}

export function useCreateTimeEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: TimeEntryIn) => getTimeEntries().createTimeEntry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['employee-time-entries'] })
      queryClient.invalidateQueries({ queryKey: ['employee-monthly-history'] })
      queryClient.invalidateQueries({ queryKey: ['employee-summary'] })
      queryClient.invalidateQueries({ queryKey: ['employee-report'] })
      queryClient.invalidateQueries({ queryKey: ['team-members'] })
      queryClient.invalidateQueries({ queryKey: ['company-dashboard'] })
      showToast('Pontaj salvat.')
    },
    onError: () => {
      showToast('Nu s-a putut salva pontajul.', { tone: 'danger' })
    },
  })
}

export function useDeleteTimeEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (entryId: number) => getTimeEntries().deleteTimeEntry(entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['employee-time-entries'] })
      queryClient.invalidateQueries({ queryKey: ['employee-monthly-history'] })
      queryClient.invalidateQueries({ queryKey: ['employee-summary'] })
      queryClient.invalidateQueries({ queryKey: ['employee-report'] })
      queryClient.invalidateQueries({ queryKey: ['team-members'] })
      queryClient.invalidateQueries({ queryKey: ['company-dashboard'] })
      showToast('Pontaj șters.')
    },
    onError: () => {
      showToast('Nu s-a putut șterge pontajul.', { tone: 'danger' })
    },
  })
}

export function useMyHourlyRates() {
  return useQuery({
    queryKey: ['my-hourly-rates'],
    queryFn: () => getSettings().listMyHourlyRates(),
  })
}

export function useUpdateMyHourlyRate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ activityId, hourlyRateGross }: { activityId: number; hourlyRateGross: string }) =>
      getSettings().updateMyHourlyRate({ activity_id: activityId, hourly_rate_gross: hourlyRateGross }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-hourly-rates'] })
      showToast('Tarif actualizat.')
    },
    onError: () => {
      showToast('Nu s-a putut actualiza tariful.', { tone: 'danger' })
    },
  })
}

export function useCreateMyActivity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UserActivityCreate) => getSettings().createMyActivity(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-hourly-rates'] })
      showToast('Activitate adăugată.')
    },
    onError: () => {
      showToast('Nu s-a putut adăuga activitatea.', { tone: 'danger' })
    },
  })
}

export function useDeleteMyActivity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (activityId: number) => getSettings().deleteMyActivity(activityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-hourly-rates'] })
      showToast('Activitate ștearsă.')
    },
    onError: () => {
      showToast('Nu s-a putut șterge activitatea.', { tone: 'danger' })
    },
  })
}
