import { isAxiosError } from 'axios'
import type { ErrorOut, ValidationErrorOut } from '../api/generated/endpoints/index.schemas'

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

/** User-facing message for a toast/banner — falls back to a generic Romanian message. */
export function getErrorMessage(error: unknown, fallback = DEFAULT_ERROR_MESSAGE): string {
  return getApiError(error)?.detail ?? fallback
}

/** Per-field messages for a form, keyed the same way as the field name sent to the backend. */
export function getFieldErrors(error: unknown): Record<string, string[]> {
  const apiError = getApiError(error)
  return isValidationError(apiError) ? apiError.field_errors : {}
}
