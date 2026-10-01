import { useState } from 'react'
import { useAcceptInvitation, useMyInvitations, useRejectInvitation } from '@stafy/hooks/useInvitations'
import { useProfile } from '@stafy/hooks/useProfile'
import { getInvitationRoleLabel } from '@stafy/utils/invitationRole'

/**
 * Pending invitations addressed to the caller's email, with accept/reject. Rendered once by
 * `AppLayout`, so it shows on every page of both the company shell and the personal `/me` shell —
 * an invitation shouldn't only be visible from one of them. Admins are skipped: the backend
 * refuses to let an admin accept (403 `invitation_role_not_eligible`).
 */
export function IncomingInvitations() {
  const { data: profile } = useProfile()
  const { data } = useMyInvitations()
  const acceptInvitation = useAcceptInvitation()
  const rejectInvitation = useRejectInvitation()
  const [respondingId, setRespondingId] = useState<string | null>(null)

  const invitations = data?.data ?? []
  if (profile?.role === 'admin' || invitations.length === 0) return null

  return (
    <div className="mx-auto mb-4 flex max-w-[1280px] flex-col gap-4 sm:mb-5">
      {invitations.map((invitation) => (
        <div
          key={invitation.id}
          className="animate-fade-slide-in rounded-[var(--radius-lg)] border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 p-4 shadow-[var(--shadow-sm)] sm:p-5"
        >
          <div className="text-[14px] font-semibold text-[var(--color-ink)]">
            Invitație de la {invitation.manager_name} · {invitation.company_name}
          </div>
          <div className="mt-1 text-[13px] text-[var(--color-ink-soft)]">
            Acceptă pentru a intra în echipa {invitation.company_name}. Pontajele și tarifele tale se reîncarcă automat.
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[12px] text-[var(--color-ink-muted)]">
            <span className="rounded-full bg-[var(--color-surface-2)] px-2 py-0.5">
              Rol: {getInvitationRoleLabel(invitation.invited_role)}
            </span>
            <span className="rounded-full bg-[var(--color-surface-2)] px-2 py-0.5">
              Funcție: {invitation.job_title_label ?? '—'}
            </span>
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              disabled={respondingId === invitation.id}
              onClick={() => {
                setRespondingId(invitation.id)
                acceptInvitation.mutate(invitation.id, {
                  onSettled: () => setRespondingId(null),
                })
              }}
              className="btn btn-primary min-h-12 flex-1 sm:btn-sm disabled:opacity-50"
            >
              {respondingId === invitation.id ? 'Se procesează…' : 'Acceptă invitația'}
            </button>
            <button
              type="button"
              disabled={respondingId === invitation.id}
              onClick={() => {
                setRespondingId(invitation.id)
                rejectInvitation.mutate(invitation.id, {
                  onSettled: () => setRespondingId(null),
                })
              }}
              className="btn btn-ghost min-h-12 flex-1 sm:btn-sm disabled:opacity-50"
            >
              Respinge
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
