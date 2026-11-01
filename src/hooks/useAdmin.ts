import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getAdmin } from '@stafy/api/generated/endpoints/admin/admin'
import type {
  AdminCompanyNotesIn,
  AnnouncementIn,
  AnnouncementPatchInStatus,
  AdminSubscriptionChangeIn,
  GetAdminActivityParams,
  GetAdminGrowthParams,
  ListAdminCompaniesParams,
  ListAdminCompanyMembersParams,
} from '@stafy/api/generated/endpoints/index.schemas'
import { showToast } from '@stafy/lib/toast'
import { getCodedErrorMessage } from '@stafy/services/apiErrors'

export function useAdminOverview() {
  return useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: () => getAdmin().getAdminOverview(),
  })
}

export function useAdminGrowth(params?: GetAdminGrowthParams) {
  return useQuery({
    queryKey: ['admin', 'growth', params],
    queryFn: () => getAdmin().getAdminGrowth(params),
  })
}

export function useAdminInvitationFunnel() {
  return useQuery({
    queryKey: ['admin', 'invitations-funnel'],
    queryFn: () => getAdmin().getAdminInvitationsFunnel(),
  })
}

export function useAdminActivity(params?: GetAdminActivityParams) {
  return useQuery({
    queryKey: ['admin', 'activity', params],
    queryFn: () => getAdmin().getAdminActivity(params),
  })
}

const ADMIN_COMPANIES_KEY = ['admin', 'companies']
const ADMIN_COMPANIES_SUMMARY_KEY = ['admin', 'companies-summary']

export function useAdminCompanies(params?: ListAdminCompaniesParams) {
  return useQuery({
    queryKey: [...ADMIN_COMPANIES_KEY, params],
    queryFn: () => getAdmin().listAdminCompanies(params),
    placeholderData: keepPreviousData,
  })
}

export function useAdminCompaniesSummary() {
  return useQuery({
    queryKey: ADMIN_COMPANIES_SUMMARY_KEY,
    queryFn: () => getAdmin().getAdminCompaniesSummary(),
  })
}

export function useAdminCompany(companyId: number | null) {
  return useQuery({
    queryKey: ['admin', 'company', companyId],
    queryFn: () => getAdmin().getAdminCompany(companyId as number),
    enabled: companyId !== null,
  })
}

export function useAdminCompanyMembers(companyId: number | null, params?: ListAdminCompanyMembersParams) {
  return useQuery({
    queryKey: ['admin', 'company-members', companyId, params],
    queryFn: () => getAdmin().listAdminCompanyMembers(companyId as number, params),
    enabled: companyId !== null,
    placeholderData: keepPreviousData,
  })
}

export function useAdminSetCompanyNotes(companyId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: AdminCompanyNotesIn) => getAdmin().setAdminCompanyNotes(companyId, data),
    onSuccess: (detail) => {
      queryClient.setQueryData(['admin', 'company', companyId], detail)
      showToast('Nota și etichetele au fost salvate.')
    },
    onError: (error) => {
      showToast(getCodedErrorMessage(error, 'Nu am putut salva nota.'), { tone: 'danger' })
    },
  })
}

const ADMIN_ANNOUNCEMENTS_KEY = ['admin', 'announcements']

export function useAdminAnnouncements() {
  return useQuery({
    queryKey: ADMIN_ANNOUNCEMENTS_KEY,
    queryFn: () => getAdmin().listAdminAnnouncements(),
  })
}

export function useAdminSaveAnnouncement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number | null; data: AnnouncementIn }) =>
      id === null ? getAdmin().createAdminAnnouncement(data) : getAdmin().updateAdminAnnouncement(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_ANNOUNCEMENTS_KEY })
      queryClient.invalidateQueries({ queryKey: ['announcements', 'active'] })
      showToast('Anunțul a fost salvat.')
    },
    onError: (error) => {
      showToast(getCodedErrorMessage(error, 'Nu am putut salva anunțul.'), { tone: 'danger' })
    },
  })
}

export function useAdminSetAnnouncementStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: AnnouncementPatchInStatus }) =>
      getAdmin().updateAdminAnnouncement(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_ANNOUNCEMENTS_KEY })
      queryClient.invalidateQueries({ queryKey: ['announcements', 'active'] })
    },
    onError: (error) => {
      showToast(getCodedErrorMessage(error, 'Nu am putut schimba starea anunțului.'), { tone: 'danger' })
    },
  })
}

export function useAdminDeleteAnnouncement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => getAdmin().deleteAdminAnnouncement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_ANNOUNCEMENTS_KEY })
      queryClient.invalidateQueries({ queryKey: ['announcements', 'active'] })
      showToast('Anunțul a fost șters.')
    },
    onError: (error) => {
      showToast(getCodedErrorMessage(error, 'Nu am putut șterge anunțul.'), { tone: 'danger' })
    },
  })
}

export function useAdminCompanySubscription(companyId: number | null) {
  return useQuery({
    queryKey: ['admin', 'company-subscription', companyId],
    queryFn: () => getAdmin().getAdminCompanySubscription(companyId as number),
    enabled: companyId !== null,
  })
}

export function useAdminSubscriptionEvents(companyId: number | null) {
  return useQuery({
    queryKey: ['admin', 'company-subscription-events', companyId],
    queryFn: () => getAdmin().listAdminCompanySubscriptionEvents(companyId as number),
    enabled: companyId !== null,
  })
}

export function useAdminSetSubscription(companyId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: AdminSubscriptionChangeIn) =>
      getAdmin().changeAdminCompanySubscription(companyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'company-subscription', companyId] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'company-subscription-events', companyId] })
      queryClient.invalidateQueries({ queryKey: ADMIN_COMPANIES_KEY })
      queryClient.invalidateQueries({ queryKey: ADMIN_COMPANIES_SUMMARY_KEY })
      showToast('Planul companiei a fost actualizat.')
    },
    onError: (error) => {
      showToast(getCodedErrorMessage(error, 'Nu am putut actualiza planul.'), { tone: 'danger' })
    },
  })
}
