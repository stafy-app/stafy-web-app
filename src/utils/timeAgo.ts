const MINUTE = 60
const HOUR = 3600
const DAY = 86400

/** "acum 5 min" / "acum 3 h" / "acum 2 zile" for an ISO timestamp; '' when it can't be parsed. */
export function timeAgo(iso: string | null | undefined, now: number = Date.now()): string {
  if (!iso) return ''
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const seconds = Math.max(0, Math.round((now - then) / 1000))
  if (seconds < 45) return 'acum câteva secunde'
  if (seconds < HOUR) return `acum ${Math.max(1, Math.round(seconds / MINUTE))} min`
  if (seconds < DAY) return `acum ${Math.round(seconds / HOUR)} h`
  const days = Math.round(seconds / DAY)
  return `acum ${days} ${days === 1 ? 'zi' : 'zile'}`
}
