import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getCompanyJobTitles } from '@stafy/api/generated/endpoints/company-job-titles/company-job-titles'
import type {
  CompanyJobTitleCreateIn,
  CompanyJobTitleUpdateIn,
} from '@stafy/api/generated/endpoints/index.schemas'

const COMPANY_JOB_TITLES_KEY = ['company-job-titles']

export function useCompanyJobTitles() {
  return useQuery({
    queryKey: COMPANY_JOB_TITLES_KEY,
    queryFn: () => getCompanyJobTitles().listCompanyJobTitles(),
  })
}

export function useCreateCompanyJobTitle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CompanyJobTitleCreateIn) => getCompanyJobTitles().createCompanyJobTitle(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMPANY_JOB_TITLES_KEY })
    },
  })
}

export function useUpdateCompanyJobTitle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ jobTitleId, data }: { jobTitleId: number; data: CompanyJobTitleUpdateIn }) =>
      getCompanyJobTitles().updateCompanyJobTitle(jobTitleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMPANY_JOB_TITLES_KEY })
    },
  })
}

export function useDeleteCompanyJobTitle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (jobTitleId: number) => getCompanyJobTitles().deleteCompanyJobTitle(jobTitleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMPANY_JOB_TITLES_KEY })
    },
  })
}
