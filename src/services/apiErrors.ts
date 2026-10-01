import { isAxiosError } from 'axios'
import type { ErrorOut, ValidationErrorOut } from '@stafy/api/generated/endpoints/index.schemas'

const DEFAULT_ERROR_MESSAGE = 'A apărut o eroare neașteptată. Încearcă din nou.'

/** Narrows a catch-block `unknown` to the backend's `{code, detail}` error body, if present. */
export function getApiError(error: unknown): ErrorOut | ValidationErrorOut | undefined {
  if (isAxiosError<ErrorOut | ValidationErrorOut>(error)) {
    return error.response?.data
  }
  return undefined
}

/** `field_errors` is only present on the backend's 422 validation body. */
export function isValidationError(
  error: ErrorOut | ValidationErrorOut | undefined,
): error is ValidationErrorOut {
  return !!error && 'field_errors' in error
}

/**
 * Romanian messages for backend error codes that any write can return, whatever the screen
 * (subscription plan limits). Local per-hook code maps handle screen-specific codes; this map is
 * consulted first so a mutation with a generic fallback never hides "the plan is read-only".
 */
const COMMON_ERROR_MESSAGES: Record<string, string> = {
  plan_read_only: 'Planul companiei este în modul doar citire. Alege un plan ca să poți face modificări.',
  seats_limit_reached: 'Ai atins limita de locuri a planului. Suspendă un membru sau schimbă planul.',
  seats_over_new_limit:
    'Ai mai mulți membri decât permite planul ales. Elimină sau suspendă membri înainte de schimbare.',
  plan_change_not_allowed: 'Această schimbare de plan nu este disponibilă acum. Contactează-ne.',
}

/** Message for a common (cross-screen) error code, or `fallback` when the error isn't one. */
export function getCodedErrorMessage(error: unknown, fallback: string): string {
  const code = getApiError(error)?.code
  return (code && COMMON_ERROR_MESSAGES[code]) || fallback
}

/** User-facing message for a toast/banner — falls back to a generic Romanian message. */
export function getErrorMessage(error: unknown, fallback = DEFAULT_ERROR_MESSAGE): string {
  const apiError = getApiError(error)
  return (
    (apiError?.code && COMMON_ERROR_MESSAGES[apiError.code]) || apiError?.detail || fallback
  )
}

/** Per-field messages for a form, keyed the same way as the field name sent to the backend. */
export function getFieldErrors(error: unknown): Record<string, string[]> {
  const apiError = getApiError(error)
  return isValidationError(apiError) ? apiError.field_errors : {}
}
