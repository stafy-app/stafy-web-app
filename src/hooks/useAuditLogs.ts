import { useQuery } from '@tanstack/react-query'
import { getAuditLogs } from '@stafy/api/generated/endpoints/audit-logs/audit-logs'
import type { ListAuditLogsParams } from '@stafy/api/generated/endpoints/index.schemas'

export function useAuditLogs(params: ListAuditLogsParams) {
  return useQuery({
    queryKey: ['audit-logs', params],
    queryFn: () => getAuditLogs().listAuditLogs(params),
  })
}
