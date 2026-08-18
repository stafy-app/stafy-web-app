import { useState, type FormEvent } from 'react'
import { useSendInvitation } from '@stafy/hooks/useInvitations'
import { ICONS } from '@stafy/lib/icons'

export function InvitationForm() {
  const [email, setEmail] = useState('')
  const sendInvitation = useSendInvitation()

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!email.trim()) return
    sendInvitation.mutate(email.trim(), {
      onSuccess: () => setEmail(''),
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)] sm:flex-row sm:items-end"
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
      <button
        type="submit"
        disabled={sendInvitation.isPending}
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
