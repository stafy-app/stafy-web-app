// Shared control styles for the signed-out screens (login, register, complete-registration, onboarding).
// Soft filled fields that light up with the brand focus ring — same look as the marketing site's forms.
export const AUTH_CONTROL =
  'w-full rounded-xl !border-transparent bg-[var(--color-surface-2)] text-[15px] transition-[background,box-shadow] duration-300 focus:bg-white focus:shadow-[var(--shadow-focus)] focus:!outline-none'

export const AUTH_INPUT = `input ${AUTH_CONTROL}`
export const AUTH_SELECT = `select ${AUTH_CONTROL}`

export const AUTH_LEGEND =
  'fieldset-legend text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-ink-muted)]'

export const AUTH_SUBMIT = 'btn btn-primary btn-lg mt-2 w-full rounded-full text-[15px] font-semibold shadow-none'

export const AUTH_LINK = 'font-semibold text-[var(--color-primary)] no-underline hover:underline'
