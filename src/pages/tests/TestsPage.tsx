import * as Sentry from '@sentry/react'
import { showToast } from '@stafy/lib/toast'

// Dev-only shadow page — see src/routes/index.tsx (registered only when
// import.meta.env.DEV). Not part of the product; not wired to useTopBar().
export default function TestsPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-page)] p-8">
      <div className="card w-full max-w-md bg-base-100 p-6 shadow-[var(--shadow-md)]">
        <h1 className="mb-4 text-[var(--text-h3)] font-semibold text-[var(--color-ink)]">
          Toast tests
        </h1>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            className="btn btn-success"
            onClick={() => showToast('Salvat cu succes.')}
          >
            Success toast
          </button>
          <button
            type="button"
            className="btn btn-error"
            onClick={() => showToast('Nu s-a putut trimite formularul.', { tone: 'danger' })}
          >
            Danger toast
          </button>
          <button
            type="button"
            className="btn btn-info"
            onClick={() =>
              showToast('Se procesează, te rugăm așteaptă…', {
                tone: 'info',
                duration: 5000,
                icon: 'loading',
              })
            }
          >
            Info toast (custom duration + icon)
          </button>
          <button
            type="button"
            className="btn btn-outline btn-error"
            onClick={() => {
              const eventId = Sentry.captureException(new Error('Sentry test error (TestsPage)'))
              console.log('Sentry event id:', eventId)
            }}
          >
            Trigger Sentry test error
          </button>
        </div>
      </div>
    </div>
  )
}
