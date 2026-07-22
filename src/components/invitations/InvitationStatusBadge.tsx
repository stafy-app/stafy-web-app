const STATUS_LABEL: Record<string, string> = {
  pending: 'În așteptare',
  accepted: 'Acceptată',
  rejected: 'Respinsă',
  expired: 'Expirată',
}

const STATUS_CLASS: Record<string, string> = {
  pending: 'badge-warning',
  accepted: 'badge-success',
  rejected: 'badge-neutral',
  expired: 'badge-neutral',
}

export function InvitationStatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge ${STATUS_CLASS[status] ?? 'badge-neutral'} badge-sm`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  )
}
