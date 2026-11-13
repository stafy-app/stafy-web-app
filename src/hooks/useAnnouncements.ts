import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getAnnouncements } from '@stafy/api/generated/endpoints/announcements/announcements'
import { useProfile } from '@stafy/hooks/useProfile'
import { showToast } from '@stafy/lib/toast'
import { getCodedErrorMessage } from '@stafy/services/apiErrors'

const ACTIVE_ANNOUNCEMENTS_KEY = ['announcements', 'active']

/** Announcements the caller should see now. A platform admin works in the console and never sees them. */
export function useActiveAnnouncements() {
  const { data: profile } = useProfile()

  return useQuery({
    queryKey: ACTIVE_ANNOUNCEMENTS_KEY,
    queryFn: () => getAnnouncements().listActiveAnnouncements(),
    enabled: !!profile && profile.role !== 'admin',
  })
}

/** Announcements flagged for the login page; no authentication, no dismissal on the server. */
export function usePublicAnnouncements() {
  return useQuery({
    queryKey: ['announcements', 'public'],
    queryFn: () => getAnnouncements().listPublicAnnouncements(),
    staleTime: 5 * 60_000,
  })
}

export function useDismissAnnouncement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (announcementId: number) => getAnnouncements().dismissAnnouncement(announcementId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACTIVE_ANNOUNCEMENTS_KEY })
    },
    onError: (error) => {
      showToast(getCodedErrorMessage(error, 'Nu am putut ascunde anunțul.'), { tone: 'danger' })
    },
  })
}
