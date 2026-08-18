import type { InvitationOut } from '@stafy/api/generated/endpoints/index.schemas'
import { useCancelInvitation, useResendInvitation } from '@stafy/hooks/useInvitations'
import { InvitationStatusBadge } from './InvitationStatusBadge'
import { ICONS } from '@stafy/lib/icons'

const dateFormatter = new Intl.DateTimeFormat('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' })

const ACTIONABLE_STATUSES = new Set(['pending', 'expired'])

interface InvitationsTableProps {
  invitations: InvitationOut[]
}

export function InvitationsTable({ invitations }: InvitationsTableProps) {
  const resendInvitation = useResendInvitation()
  const cancelInvitation = useCancelInvitation()

  if (invitations.length === 0) {
    return (
      <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-10 text-center shadow-[var(--shadow-sm)]">
        <div className="text-[13px] text-[var(--color-ink-muted)]">Nicio invitație trimisă încă.</div>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-[var(--radius-lg)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]">
      <table className="table">
        <thead>
          <tr className="text-[12px] uppercase tracking-[0.06em] text-[var(--color-ink-muted)]">
            <th>Email</th>
            <th>Status</th>
            <th>Trimisă</th>
            <th>Expiră / Răspuns</th>
            <th className="text-right">Acțiuni</th>
          </tr>
        </thead>
        <tbody>
          {invitations.map((invitation) => {
            const isActionable = ACTIONABLE_STATUSES.has(invitation.status)
            const isMutating =
              (resendInvitation.isPending && resendInvitation.variables === invitation.id) ||
              (cancelInvitation.isPending && cancelInvitation.variables === invitation.id)

            return (
              <tr key={invitation.id}>
                <td className="text-[13px] text-[var(--color-ink)]">{invitation.invited_email}</td>
                <td>
                  <InvitationStatusBadge status={invitation.status} />
                </td>
                <td className="text-[13px] text-[var(--color-ink-muted)]">
                  {dateFormatter.format(new Date(invitation.created_at))}
                </td>
                <td className="text-[13px] text-[var(--color-ink-muted)]">
                  {invitation.responded_at
                    ? dateFormatter.format(new Date(invitation.responded_at))
                    : dateFormatter.format(new Date(invitation.expires_at))}
                </td>
                <td>
                  {isActionable && (
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        title="Retrimite"
                        disabled={isMutating}
                        onClick={() => resendInvitation.mutate(invitation.id)}
                        className="btn btn-ghost btn-square btn-sm text-[var(--color-ink-soft)] disabled:opacity-50"
                      >
                        <ICONS.refresh className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        title="Anulează"
                        disabled={isMutating}
                        onClick={() => cancelInvitation.mutate(invitation.id)}
                        className="btn btn-ghost btn-square btn-sm text-[var(--color-error)] disabled:opacity-50"
                      >
                        <ICONS.trash className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
