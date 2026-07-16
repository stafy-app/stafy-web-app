const STORAGE_KEY = 'stafy.auth.blockedMessage'

export function setBlockedMessage(message: string) {
  sessionStorage.setItem(STORAGE_KEY, message)
}

/** Reads and clears the pending blocked-login message, if any. */
export function consumeBlockedMessage(): string | null {
  const message = sessionStorage.getItem(STORAGE_KEY)
  if (message) sessionStorage.removeItem(STORAGE_KEY)
  return message
}
