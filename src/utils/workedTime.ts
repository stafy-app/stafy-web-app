export function calculateWorkedTime(startTime: Date, stopTime: Date): {
  hours: number
  minutes: number
  totalHours: number
  totalMinutes: number
  formatted: string
} {
  const diffInMilliseconds = stopTime.getTime() - startTime.getTime()

  let totalMinutes = Math.floor(diffInMilliseconds / (1000 * 60))

  // Night shift: if end time crosses midnight, add 24h
  if (totalMinutes < 0) {
    totalMinutes += 24 * 60
  }

  const totalHours = totalMinutes / 60
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  return {
    hours,
    minutes,
    totalHours,
    totalMinutes,
    formatted: `${hours}h ${minutes}m`,
  }
}

// ORA STOP is picked on the same calendar day as ORA START, so a night shift
// (e.g. 22:00 -> 06:00) has stopTime chronologically before startTime — mirrors
// calculateWorkedTime's "add 24h" logic so the submitted time_end matches what
// the UI already shows the user. The backend rejects time_end <= time_start.
export function getSubmissionTimeEnd(start: Date, stop: Date): Date {
  if (stop.getTime() < start.getTime()) {
    return new Date(stop.getTime() + 24 * 60 * 60 * 1000)
  }
  return stop
}
