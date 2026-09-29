import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getUsers } from '@stafy/api/generated/endpoints/users/users'
import { showToast } from '@stafy/lib/toast'
import { getCodedErrorMessage } from '@stafy/services/apiErrors'

export function useUpdateEmployeeJobTitle(employeeId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (jobTitle: string) =>
      getUsers().updateEmployeeJobTitle(employeeId, { job_title: jobTitle }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-summary', employeeId] })
      showToast('Job title actualizat.')
    },
    onError: (error) => {
      showToast(getCodedErrorMessage(error, 'Nu s-a putut actualiza job title-ul.'), { tone: 'danger' })
    },
  })
}

export function useSuspendEmployee(employeeId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => getUsers().suspendEmployee(employeeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-summary', employeeId] })
      showToast('Angajat suspendat.')
    },
    onError: (error) => {
      showToast(getCodedErrorMessage(error, 'Nu s-a putut suspenda angajatul.'), { tone: 'danger' })
    },
  })
}

export function useReactivateEmployee(employeeId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => getUsers().reactivateEmployee(employeeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-summary', employeeId] })
      showToast('Angajat reactivat.')
    },
    onError: (error) => {
      showToast(getCodedErrorMessage(error, 'Nu s-a putut reactiva angajatul.'), { tone: 'danger' })
    },
  })
}

export function useRemoveFromCompany(employeeId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => getUsers().removeManager(employeeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] })
      showToast('Coordonator eliminat din companie.')
    },
    onError: (error) => {
      showToast(getCodedErrorMessage(error, 'Nu am putut elimina coordonatorul din companie.'), { tone: 'danger' })
    },
  })
}
