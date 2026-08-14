import type { CompanyTopEmployeeOut } from '../api/generated/endpoints/index.schemas'
import { showToast } from '../lib/toast'
import { MONTHS_RO } from './period'

const gross = new Intl.NumberFormat('ro-RO', { maximumFractionDigits: 0 })

function csvField(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

export function exportTeamCsv(members: CompanyTopEmployeeOut[], year: number, month: number) {
  const header = ['nume', 'email', 'status', 'ore', 'delta', 'sumă (RON)', 'activități']
  const rows = members.map((member) => [
    `${member.user.first_name ?? ''} ${member.user.last_name ?? ''}`.trim(),
    member.user.email ?? '',
    member.user.is_active ? 'Activ' : 'Inactiv',
    member.total_hours.toFixed(1),
    member.delta_vs_previous_month.toFixed(1),
    gross.format(parseFloat(member.estimated_gross)),
    member.activities.join('; '),
  ])

  const csv = [header, ...rows].map((row) => row.map(csvField).join(',')).join('\r\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `echipa-stafy-${MONTHS_RO[month - 1]}-${year}.csv`
  link.click()

  URL.revokeObjectURL(url)
  showToast('Export CSV finalizat.')
}
