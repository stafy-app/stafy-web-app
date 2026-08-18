import type { TimeEntryOut } from '@stafy/api/generated/endpoints/index.schemas'
import { showToast } from '@stafy/lib/toast'
import { MONTHS_RO } from './period'

const dateFormatter = new Intl.DateTimeFormat('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' })
const timeFormatter = new Intl.DateTimeFormat('ro-RO', { hour: '2-digit', minute: '2-digit' })
const amountFormatter = new Intl.NumberFormat('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function csvField(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

export function exportEmployeeTimeEntriesCsv(
  entries: TimeEntryOut[],
  employeeName: string,
  year: number,
  month: number,
) {
  const header = ['dată', 'interval orar', 'activitate', 'durată (h)', 'tarif (RON/h)', 'sumă (RON)']
  const rows = entries.map((entry) => {
    const start = new Date(entry.time_start)
    const end = new Date(entry.time_end)
    const hours = (end.getTime() - start.getTime()) / 3_600_000
    const rate = parseFloat(entry.rate_applied)

    return [
      dateFormatter.format(start),
      `${timeFormatter.format(start)}–${timeFormatter.format(end)}`,
      entry.activity.activity_name,
      hours.toFixed(1),
      amountFormatter.format(rate),
      amountFormatter.format(hours * rate),
    ]
  })

  const csv = [header, ...rows].map((row) => row.map(csvField).join(',')).join('\r\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `pontaje-${employeeName.trim().replace(/\s+/g, '-').toLowerCase()}-${MONTHS_RO[month - 1]}-${year}.csv`
  link.click()

  URL.revokeObjectURL(url)
  showToast('Export CSV finalizat.')
}
