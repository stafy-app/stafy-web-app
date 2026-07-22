import { useMemo } from 'react'
import { useTopBar } from '../../hooks/useTopBar'
import { useInvitations } from '../../hooks/useInvitations'
import { InvitationForm } from '../../components/invitations/InvitationForm'
import { InvitationsTable } from '../../components/invitations/InvitationsTable'
import { KpiCard } from '../../components/dashboard/KpiCard'
import { ICONS } from '../../lib/icons'

export default function InvitationsPage() {
  useTopBar({ title: 'Invitații', subtitle: 'Invitații trimise către angajați' })

  const { data, isLoading } = useInvitations()

  const counts = useMemo(() => {
    const invitations = data?.data ?? []
    return {
      pending: invitations.filter((i) => i.status === 'pending').length,
      accepted: invitations.filter((i) => i.status === 'accepted').length,
      expired: invitations.filter((i) => i.status === 'expired').length,
    }
  }, [data])

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-5">
      <InvitationForm />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="În așteptare" icon={ICONS.clock} value={counts.pending} durationMs={600} />
        <KpiCard label="Acceptate" icon={ICONS.userCheck} value={counts.accepted} durationMs={700} />
        <KpiCard label="Expirate" icon={ICONS.warning} value={counts.expired} durationMs={800} />
      </div>

      {isLoading ? null : <InvitationsTable invitations={data?.data ?? []} />}
    </div>
  )
}
