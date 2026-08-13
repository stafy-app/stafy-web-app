import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getReports } from '../api/generated/endpoints/reports/reports'
import { showToast } from '../lib/toast'
import type { PayrollBonusSetIn } from '../api/generated/endpoints/index.schemas'

export function useEmployeeReport(employeeId: number, year: number, month: number, enabled = true) {
  return useQuery({
    queryKey: ['employee-report', employeeId, year, month],
    queryFn: () => getReports().getEmployeeReport(employeeId, { year, month }),
    enabled,
  })
}

export function useSetReportBonus(employeeId: number, year: number, month: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: PayrollBonusSetIn) =>
      getReports().setEmployeeBonus(employeeId, data, { year, month }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-report', employeeId, year, month] })
      showToast('Bonus salvat.')
    },
    onError: () => {
      showToast('Nu s-a putut salva bonusul.', { tone: 'danger' })
    },
  })
}

export function useClearReportBonus(employeeId: number, year: number, month: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => getReports().clearEmployeeBonus(employeeId, { year, month }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-report', employeeId, year, month] })
      showToast('Bonus șters.')
    },
    onError: () => {
      showToast('Nu s-a putut șterge bonusul.', { tone: 'danger' })
    },
  })
}
