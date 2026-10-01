import { useState, type FormEvent } from 'react'
import { useSendInvitation } from '@stafy/hooks/useInvitations'
import { useCompanyJobTitles } from '@stafy/hooks/useCompanyJobTitles'
import { useProfile } from '@stafy/hooks/useProfile'
import { InvitationInInvitedRole, type InvitationIn } from '@stafy/api/generated/endpoints/index.schemas'
import { ICONS } from '@stafy/lib/icons'

export function InvitationForm() {
  const [email, setEmail] = useState('')
  const [invitedRole, setInvitedRole] = useState<string>(InvitationInInvitedRole.employee)
  const [jobTitleId, setJobTitleId] = useState('')
  const sendInvitation = useSendInvitation()
  const { data: profile } = useProfile()
  const { data: jobTitlesData } = useCompanyJobTitles()
  const jobTitles = jobTitlesData?.data ?? []
  const canInviteManager = profile?.is_own_company ?? false

  const isValid = Boolean(email.trim()) && Boolean(invitedRole) && Boolean(jobTitleId)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!isValid) return
    sendInvitation.mutate(
      {
        invited_email: email.trim(),
        invited_role: invitedRole as InvitationIn['invited_role'],
        invited_job_title_id: Number(jobTitleId),
      },
      {
        onSuccess: () => {
          setEmail('')
          setInvitedRole(InvitationInInvitedRole.employee)
          setJobTitleId('')
        },
      },
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)] sm:flex-row sm:items-end sm:flex-wrap"
    >
      <fieldset className="fieldset flex-1">
        <legend className="fieldset-legend">Invită un angajat</legend>
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="nume@exemplu.ro"
          className="input w-full"
        />
      </fieldset>
      <fieldset className="fieldset">
        <legend className="fieldset-legend">Rol</legend>
        <select
          required
          value={invitedRole}
          onChange={(event) => setInvitedRole(event.target.value)}
          className="select w-full sm:w-40"
        >
          <option value={InvitationInInvitedRole.employee}>Angajat</option>
          {canInviteManager && <option value={InvitationInInvitedRole.manager}>Manager</option>}
        </select>
      </fieldset>
      <fieldset className="fieldset">
        <legend className="fieldset-legend">Funcție</legend>
        <select
          required
          value={jobTitleId}
          onChange={(event) => setJobTitleId(event.target.value)}
          className="select w-full sm:w-48"
        >
          <option value="" disabled>
            Alege funcția
          </option>
          {jobTitles.map((jobTitle) => (
            <option key={jobTitle.id} value={jobTitle.id}>
              {jobTitle.label}
            </option>
          ))}
        </select>
      </fieldset>
      <button
        type="submit"
        disabled={sendInvitation.isPending || !isValid}
        className="btn btn-primary gap-2"
      >
        {sendInvitation.isPending ? (
          <span className="loading loading-spinner loading-sm" />
        ) : (
          <>
            <ICONS.mail className="h-4 w-4" />
            Trimite invitație
          </>
        )}
      </button>
    </form>
  )
}
