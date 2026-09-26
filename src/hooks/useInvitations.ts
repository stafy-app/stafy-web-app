import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getInvitations } from '@stafy/api/generated/endpoints/invitations/invitations'
import type { InvitationIn } from '@stafy/api/generated/endpoints/index.schemas'
import { getApiError } from '@stafy/services/apiErrors'
import { showToast } from '@stafy/lib/toast'

const INVITATIONS_KEY = ['invitations']
const MY_INVITATIONS_KEY = ['my-invitations']

const ERROR_MESSAGES: Record<string, string> = {
  invitation_already_pending: 'Există deja o invitație în așteptare pentru acest email.',
  invitation_not_actionable: 'Această invitație nu mai poate fi modificată.',
  invitation_not_found: 'Invitația nu a fost găsită.',
  invitation_role_not_allowed: 'Doar administratorul companiei poate invita alți manageri.',
  owner_has_team: 'Ai deja propria echipă — nu poți accepta o altă invitație cât timp o conduci.',
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
    mutationFn: (data: InvitationIn) => getInvitations().createInvitation(data),
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

export function useMyInvitations() {
  return useQuery({
    queryKey: MY_INVITATIONS_KEY,
    queryFn: () => getInvitations().listMyInvitations(),
  })
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (invitationId: string) => getInvitations().acceptInvitation(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_INVITATIONS_KEY })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      queryClient.invalidateQueries({ queryKey: ['my-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['my-hourly-rates'] })
      showToast('Bun venit în echipă!')
    },
    onError: (error) => {
      showToast(invitationErrorMessage(error, 'Nu am putut accepta invitația.'), {
        tone: 'danger',
      })
    },
  })
}

export function useRejectInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (invitationId: string) => getInvitations().rejectInvitation(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_INVITATIONS_KEY })
      showToast('Invitație respinsă.')
    },
    onError: (error) => {
      showToast(invitationErrorMessage(error, 'Nu am putut respinge invitația.'), {
        tone: 'danger',
      })
    },
  })
}
