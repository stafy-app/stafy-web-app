const INVITATION_ROLE_LABELS: Record<string, string> = {
  manager: 'Manager',
  employee: 'Angajat',
}

/** Romanian label for an invitation's `invited_role` ('manager' | 'employee'). */
export function getInvitationRoleLabel(role: string): string {
  return INVITATION_ROLE_LABELS[role] ?? role
}
