export interface Period {
  year: number
  month: number
}

export const MONTHS_RO = [
  'ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie',
  'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie',
]

export function getCurrentPeriod(): Period {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

export function getAdjacentPeriod(period: Period, delta: 1 | -1): Period {
  if (delta === -1) {
    return period.month === 1
      ? { year: period.year - 1, month: 12 }
      : { year: period.year, month: period.month - 1 }
  }
  return period.month === 12
    ? { year: period.year + 1, month: 1 }
    : { year: period.year, month: period.month + 1 }
}
