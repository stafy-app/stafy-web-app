import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getInvitations } from '../api/generated/endpoints/invitations/invitations'
import { getApiError } from '../services/apiErrors'
import { showToast } from '../lib/toast'

const INVITATIONS_KEY = ['invitations']

const ERROR_MESSAGES: Record<string, string> = {
  invitation_already_pending: 'Există deja o invitație în așteptare pentru acest email.',
  invitation_not_actionable: 'Această invitație nu mai poate fi modificată.',
  invitation_not_found: 'Invitația nu a fost găsită.',
}

function invitationErrorMessage(error: unknown, fallback: string): string {
  const code = getApiError(error)?.code
  return (code && ERROR_MESSAGES[code]) || fallback
}

export function useInvitations() {
  return useQuery({
    queryKey: INVITATIONS_KEY,
    queryFn: () => getInvitations().listInvitations(),
  })
}

export function useSendInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (invitedEmail: string) =>
      getInvitations().createInvitation({ invited_email: invitedEmail }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVITATIONS_KEY })
      showToast('Invitație trimisă.')
    },
    onError: (error) => {
      showToast(invitationErrorMessage(error, 'Nu s-a putut trimite invitația.'), {
        tone: 'danger',
      })
    },
  })
}

export function useResendInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (invitationId: string) => getInvitations().resendInvitation(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVITATIONS_KEY })
      showToast('Invitație retrimisă.')
    },
    onError: (error) => {
      showToast(invitationErrorMessage(error, 'Nu s-a putut retrimite invitația.'), {
        tone: 'danger',
      })
    },
  })
}

export function useCancelInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (invitationId: string) => getInvitations().cancelInvitation(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVITATIONS_KEY })
      showToast('Invitație anulată.')
    },
    onError: (error) => {
      showToast(invitationErrorMessage(error, 'Nu s-a putut anula invitația.'), {
        tone: 'danger',
      })
    },
  })
}
