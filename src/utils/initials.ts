export function getInitials(firstName?: string | null, lastName?: string | null): string {
  const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase()
  return initials || '—'
}
