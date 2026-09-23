import { useMemo, useState } from 'react'
import { useTopBar } from '@stafy/hooks/useTopBar'
import { useMyDashboard, useMyHourlyRates, useCreateTimeEntry } from '@stafy/hooks/useMyTime'
import { calculateWorkedTime, getSubmissionTimeEnd } from '@stafy/utils/workedTime'
import { showToast } from '@stafy/lib/toast'
import { Link } from '@tanstack/react-router'

const ron = new Intl.NumberFormat('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const ERROR_MESSAGES_RO: Record<string, string> = {
  not_found: 'Activitatea selectată nu mai este disponibilă. Te rog selecteaz-o din nou.',
  entry_already_exists: 'Există deja o înregistrare identică pentru acest interval orar.',
}

interface BackendErrorData {
  code?: string
  detail?: string
  field_errors?: Record<string, string[]>
}

function getErrorMessage(error: unknown): string {
  const response: { data?: BackendErrorData } | undefined =
    typeof error === 'object' && error !== null && 'response' in error
      ? (error.response as { data?: BackendErrorData } | undefined)
      : undefined
  const data = response?.data
  if (data?.code && ERROR_MESSAGES_RO[data.code]) {
    return ERROR_MESSAGES_RO[data.code]
  }
  const fieldErrors = data?.field_errors
  if (fieldErrors) {
    const messages = Object.values(fieldErrors).flat()
    if (messages.length > 0) return messages.join(' ')
  }
  if (data?.detail) return data.detail
  return 'A apărut o eroare la salvare. Te rog încearcă din nou.'
}

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function MyAttendancePage() {
  useTopBar({ title: 'Pontaj', subtitle: 'Înregistrează-ți orele lucrate' })

  const { data: dashboard } = useMyDashboard()
  const { data: ratesData } = useMyHourlyRates()
  const createEntry = useCreateTimeEntry()

  const rates = useMemo(() => ratesData?.data ?? [], [ratesData])

  const [activityId, setActivityId] = useState<number | null>(null)
  const [startValue, setStartValue] = useState(() => toLocalInputValue(new Date()))
  const [stopValue, setStopValue] = useState(() => toLocalInputValue(new Date()))

  const start = useMemo(() => new Date(startValue), [startValue])
  const stop = useMemo(() => new Date(stopValue), [stopValue])
  const worked = calculateWorkedTime(start, stop)
  const selectedRate = rates.find((r) => r.activity_id === activityId)
  const estimated = selectedRate ? worked.totalHours * parseFloat(selectedRate.hourly_rate_gross) : 0

  function handleSave() {
    if (!activityId) {
      showToast('Te rog selectează o activitate.', { tone: 'warning' })
      return
    }
    const submissionEnd = getSubmissionTimeEnd(start, stop)
    if (submissionEnd.getTime() === start.getTime()) {
      showToast('Ora de start și ora de stop nu pot fi identice.', { tone: 'warning' })
      return
    }
    createEntry.mutate(
      {
        time_start: start.toISOString(),
        time_end: submissionEnd.toISOString(),
        activity_id: activityId,
      },
      {
        onSuccess: () => {
          setActivityId(null)
          const now = toLocalInputValue(new Date())
          setStartValue(now)
          setStopValue(now)
        },
        onError: (error) => {
          showToast(getErrorMessage(error), { tone: 'danger' })
        },
      },
    )
  }

  if (rates.length === 0) {
    return (
      <div className="mx-auto flex max-w-[1280px] flex-col gap-5">
        <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-10 text-center shadow-[var(--shadow-sm)]">
          <div className="text-[15px] font-semibold text-[var(--color-ink)]">
            Nu ai niciun tarif configurat
          </div>
          <div className="mx-auto mt-1 max-w-[420px] text-[13px] text-[var(--color-ink-muted)]">
            Ca să poți înregistra ore, configurează-ți mai întâi tarifele orare pe activități.
            {(dashboard?.total_hours ?? 0) === 0 && ' Momentan nu ai niciun pontaj luna aceasta.'}
          </div>
          <Link to="/me/rates" className="btn btn-primary btn-sm mt-4">
            Configurează tarife
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-5">
      <div className="animate-fade-slide-in rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
        <div className="mb-4 text-[16px] font-semibold text-[var(--color-ink)]">Pontaj nou</div>

        <label className="mb-4 block">
          <span className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.05em] text-[var(--color-ink-muted)]">
            Activitate
          </span>
          <select
            value={activityId ?? ''}
            onChange={(e) => setActivityId(e.target.value === '' ? null : Number(e.target.value))}
            className="select select-bordered w-full"
          >
            <option value="">Selectează activitatea…</option>
            {rates.map((rate) => (
              <option key={rate.activity_id} value={rate.activity_id}>
                {rate.activity_name} · {ron.format(parseFloat(rate.hourly_rate_gross))} RON/h
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.05em] text-[var(--color-ink-muted)]">
              Start
            </span>
            <input
              type="datetime-local"
              value={startValue}
              onChange={(e) => setStartValue(e.target.value)}
              className="input input-bordered w-full"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.05em] text-[var(--color-ink-muted)]">
              Stop
            </span>
            <input
              type="datetime-local"
              value={stopValue}
              onChange={(e) => setStopValue(e.target.value)}
              className="input input-bordered w-full"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] bg-[var(--color-surface-2)] px-4 py-3">
          <div className="text-[13px] text-[var(--color-ink-soft)]">
            Durată: <span className="font-[var(--font-mono)] font-bold text-[var(--color-ink)]">{worked.formatted}</span>
            {selectedRate && (
              <>
                {' '}· Estimat:{' '}
                <span className="font-[var(--font-mono)] font-bold text-[var(--color-ink)]">
                  {ron.format(estimated)} RON
                </span>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={createEntry.isPending}
            className="btn btn-primary btn-sm disabled:opacity-50"
          >
            {createEntry.isPending ? 'Se salvează…' : 'Salvează pontaj'}
          </button>
        </div>
      </div>
    </div>
  )
}
